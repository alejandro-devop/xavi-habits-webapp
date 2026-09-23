import { createHash } from 'node:crypto'
import { type Dirent, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * El identificador de **forma** de la caché persistida.
 *
 * La caché de react-query se guarda en `localStorage` y se rehidrata al abrir
 * la app. Si entre el guardado y la apertura se desplegó un cambio en la forma
 * de los datos, lo que se hidrata tiene la estructura vieja y el código nuevo
 * revienta antes de pintar nada (pasó el 2026-09-23 con `activeDays`).
 *
 * `PersistQueryClientProvider` ya admite un `buster`: si el guardado no coincide
 * con el actual, tira la caché. Lo que faltaba era un valor que **cambiara
 * solo**. Aquí se calcula hasheando el contenido de los ficheros que deciden la
 * forma de lo que acaba en la caché.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * QUÉ ENTRA EN EL CÁLCULO, Y CÓMO SABER SI TU FICHERO NUEVO ENTRA
 * ────────────────────────────────────────────────────────────────────────────
 *
 * **Son dos reglas, y las dos se aplican solas.** No hay ninguna lista que
 * alguien tenga que acordarse de actualizar: eso es exactamente el fallo que
 * esto viene a arreglar (`VITE_APP_VERSION` llevaba en `0.0.0` desde el primer
 * commit porque dependía de que alguien se acordara).
 *
 * 1. **Por ruta** (`isShapeSourceByPath`) — lo que por su sitio ya es capa de
 *    datos:
 *    - los `*.graphql.ts` de cualquier carpeta `graphql/`: los conjuntos de
 *      selección, o sea la forma que devuelve el servidor.
 *    - los `*.api.ts` de cualquier carpeta `api/`: la capa que mapea la
 *      respuesta a lo que se guarda.
 *    - **todo `src/shared/api/*.ts`**: el transporte. `graphql-client.ts` es el
 *      embudo único por el que pasa el 100 % de lo que se cachea —un cambio de
 *      una línea ahí reforma todo lo guardado— y `query-keys.ts` es el espacio
 *      de claves bajo el que se guarda. Entra la carpeta entera, y no una lista
 *      de ficheros, para que un fichero nuevo de transporte entre **solo**.
 *
 * 2. **Por contenido** (`writesCacheByHand`) — quien **fabrica** el objeto
 *    cacheado aunque no viva en la capa de datos. Cualquier fichero de `src/`
 *    que llame a `setQueryData`, `setQueriesData` o `setQueryState` escribe en
 *    la caché un objeto que no es ni lo que devuelve el documento ni lo que
 *    devuelve el `*.api.ts`: un híbrido (mira
 *    `src/features/vida/hooks/useActivityFollowUps.ts`, que compone
 *    `{ ...open, ...data, activity: …, sessionSubtasks: … }`). Esa forma la
 *    define el hook, así que el hook entra —**y entra el día que escribes la
 *    llamada, sin tocar este fichero**.
 *
 * **Si creas un fichero nuevo:** no tienes que hacer nada. Si es capa de datos,
 * la regla 1 lo coge por dónde lo pusiste; si escribe en la caché a mano, la
 * regla 2 lo coge por lo que hace. Lo único que hay que mantener a mano es
 * `CACHE_WRITE_MARKERS`, y solo si react-query saca una forma nueva de escribir
 * en la caché.
 *
 * **Por qué NO entra `hooks/` entero:** los hooks cambian en casi cada tajada y
 * la inmensa mayoría solo *consume* la forma. Meterlos todos convertiría esto en
 * un invalidador por build y tiraría la caché de todo el mundo sin motivo —que es
 * justo lo que se descartó al no usar `VERCEL_GIT_COMMIT_SHA`—. La regla 2 coge
 * los dos que sí la definen (hoy son dos) sin arrastrar los demás.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * PUNTOS CIEGOS QUE SIGUEN AHÍ (conscientes)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * - **La forma que cambia en el servidor.** Esto se calcula del código del
 *   front. El API se despliega solo, desde otro repositorio: un cambio de forma
 *   que llegue solo de allí no lo caza este invalidador.
 * - **Escribir en la caché por una vía que no esté en `CACHE_WRITE_MARKERS`.**
 *   Si un día se usa otra API de react-query para meter datos, hay que añadirla
 *   a esa lista.
 * - **`initialData` o `placeholderData` sembradas desde un componente** que no
 *   pase por ninguna de las dos reglas. Son hermanas y tienen el mismo efecto:
 *   meten una forma en la caché sin tocar la capa de datos.
 *
 * Los tres están tapados, por otra vía, por la red de la tajada 2
 * (`src/app/providers/query-cache-guards.ts`): allí se valida **lo que se
 * rehidrata**, venga de donde venga.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * EL COSTE: EL HASH ES SENSIBLE AL BYTE
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Se hashea el **contenido crudo**, no la forma declarada. Añadir un comentario
 * a un `*.api.ts`, reordenar imports, renombrar una variable local o dejar **un
 * espacio al final de `query-keys.ts`** cambian el identificador y caducan la
 * caché de todo el mundo aunque la forma sea idéntica. Medido: sobre el mismo
 * árbol, un comentario en `habits.api.ts` lleva `c4e2522f5cb9` a `3cc620c3f302`,
 * y un espacio suelto en `query-keys.ts` a `f5148e2ad97c`.
 *
 * Eso **no es un defecto, es el lado correcto en el que fallar**: un falso
 * positivo cuesta una apertura fría; un falso negativo cuesta una pantalla en
 * blanco. Si un día ves la caché caducar tras un cambio cosmético, la
 * explicación es esta y no hay bug que buscar. (Un `pnpm format` a lo ancho la
 * caducaría; en este repositorio no se corre, ver `ENVIRONMENT.md`.)
 */

/** Carpetas que ni se recorren. */
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'schema', '__snapshots__'])

/** Extensiones cuyo contenido se mira para la regla 2. */
const SCANNABLE = /\.tsx?$/

/**
 * Las llamadas que significan «este fichero escribe en la caché un objeto que
 * compone él». Si react-query añade otra, va aquí.
 */
export const CACHE_WRITE_MARKERS = ['setQueryData', 'setQueriesData', 'setQueryState'] as const

/** Los tests describen la forma, no la definen: no caducan la caché de nadie. */
function isTest(relPath: string): boolean {
  return /\.(test|spec)\.tsx?$/.test(relPath)
}

/**
 * Regla 1: ¿la ruta, por sí sola, dice que esto es capa de datos? Recibe una
 * ruta relativa a la raíz del repositorio, ya en separadores POSIX.
 */
export function isShapeSourceByPath(relPath: string): boolean {
  if (isTest(relPath)) return false
  if (/^src\/shared\/api\/[^/]+\.ts$/.test(relPath)) return true
  if (/(^|\/)graphql\/[^/]+\.graphql\.ts$/.test(relPath)) return true
  if (/(^|\/)api\/[^/]+\.api\.ts$/.test(relPath)) return true
  return false
}

/** Regla 2: ¿este contenido escribe en la caché a mano? */
export function writesCacheByHand(content: string): boolean {
  return CACHE_WRITE_MARKERS.some((marker) => content.includes(marker))
}

/**
 * Los ficheros que entran en el cálculo, en rutas relativas POSIX y **ordenados**
 * (`readdir` no garantiza orden entre sistemas y el hash tiene que ser estable).
 *
 * La regla 2 obliga a leer el contenido de los `.ts`/`.tsx` de `src/` que no haya
 * cogido ya la regla 1. Son unos cientos de ficheros una vez, al arrancar Vite.
 */
export function collectShapeSources(root: string): string[] {
  const found: string[] = []

  function walk(dir: string): void {
    let entries: Dirent[]
    try {
      entries = readdirSync(path.join(root, dir), { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const rel = dir === '' ? entry.name : `${dir}/${entry.name}`
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        walk(rel)
        continue
      }
      if (!entry.isFile()) continue
      if (isShapeSourceByPath(rel)) {
        found.push(rel)
        continue
      }
      if (isTest(rel) || !SCANNABLE.test(rel)) continue
      let content: string
      try {
        content = readFileSync(path.join(root, rel), 'utf-8')
      } catch {
        continue
      }
      if (writesCacheByHand(content)) {
        found.push(rel)
      }
    }
  }

  walk('src')
  return found.sort()
}

/**
 * Hash corto y estable del contenido de esos ficheros. Se mete también la ruta:
 * mover un fichero de sitio sin tocar su contenido **también** cambia la forma
 * de la capa de datos.
 *
 * Si no se encuentra ninguno, el cálculo falla hacia el lado seguro: devuelve un
 * valor distinto en cada build, de modo que la caché se tira. Es preferible una
 * apertura fría a una pantalla en blanco.
 */
export function computeCacheShapeId(root: string): string {
  const files = collectShapeSources(root)
  if (files.length === 0) {
    return `sin-fuentes-${Date.now().toString(36)}`
  }
  const hash = createHash('sha256')
  for (const rel of files) {
    hash.update(rel)
    hash.update('\0')
    hash.update(readFileSync(path.join(root, rel)))
    hash.update('\0')
  }
  return hash.digest('hex').slice(0, 12)
}
