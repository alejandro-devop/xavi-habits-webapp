import type { PersistedClient } from '@tanstack/react-query-persist-client'
import { habitKeys, vidaKeys } from '@/shared/api/query-keys'

/**
 * La red de abajo: **se valida lo que se rehidrata, no lo que se recibe.**
 *
 * El invalidador de la tajada 1 (`vite/cache-shape.ts`) se calcula del código
 * del **front**, así que hay un hueco que no puede ver por diseño: **que la
 * forma cambie en el servidor**. El API vive en otro repositorio y se despliega
 * solo; ningún hash de ficheros de aquí se entera. Eso es exactamente lo que
 * pasó el 2026-09-23. Y de paso este mismo sitio cubre los otros puntos ciegos
 * que quedaron escritos allí: una escritura en caché factorizada a un fichero
 * que no nombre ningún marcador, e `initialData`/`placeholderData` sembradas
 * desde un componente.
 *
 * **Por qué aquí y no recargando la página.** La otra opción era un *error
 * boundary* que borrase la caché y recargase una vez si el render reventaba.
 * Se descartó: no distingue «la caché estaba envenenada» de «hay un bug en un
 * componente», así que escondería fallos recargando encima de ellos, y un
 * bucle de recarga en el teléfono es peor que la pantalla de error que veníamos
 * a evitar. Aquí se descarta el dato malo **antes** de que exista un árbol de
 * React, sin recargar nada.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * QUÉ SE VALIDA, Y CUÁNDO AÑADIR UNA GUARDA
 * ────────────────────────────────────────────────────────────────────────────
 *
 * **No se copia el SDL.** Copiar el esquema serían 63 documentos de contrato
 * duplicado que además ya valida `src/features/vida/graphql/contracts.test.ts`,
 * y se descartó con razón al evaluar zod.
 *
 * La regla es ésta, y es la que decide qué entra y qué no:
 *
 * > **Lleva guarda la consulta cuya forma inesperada TUMBA una pantalla. La que
 * > solo la VACÍA, no.**
 *
 * Si al faltar un campo la pantalla se queda con una lista vacía o un texto
 * ausente, degradar ya es seguro y una guarda solo añadiría mantenimiento. Si al
 * faltar un campo el render desreferencia `undefined` durante el primer
 * pintado —`activeDays.includes(...)`, `suggestion.item.days`—, la pantalla se
 * cae entera y ahí sí.
 *
 * Aplicada hoy son **nueve guardas**. Cubren lo que alimenta `/app/vida/hoy` y lo
 * que se recorre sin red en Plantilla y Revisión. Y no se decide de memoria:
 * `SIN_GUARDA_A_PROPOSITO`, abajo, lista las claves de Vida que se quedan fuera
 * **con su motivo**, y un test recorre `vidaKeys` y falla si aparece una que no
 * esté ni guardada ni en esa lista.
 *
 * **Una guarda, una forma.** El prefijo de una guarda tiene que cubrir claves que
 * devuelvan la **misma** forma. Se aprendió caro: una sola guarda sobre
 * `followUps` parecía elegante y en realidad rechazaba el 100 % de
 * `followUps.range()`, que devuelve `{ date, followUps[] }` y no tiene ni `id` ni
 * `startTime` — caché sana tirada en cada arranque, con un aviso que mentía.
 * Ahora son cuatro guardas para cuatro claves de `followUps`, y el test de
 * cobertura comprueba que ninguna guarda se solapa con otra. Un ejemplo de lo que la
 * regla deja fuera, para que se vea que no es «todo»: `settingsKeys.my()` **no
 * lleva guarda** porque `useVidaDayHours` lo lee entero con `?.` y cae a su
 * respaldo de las 23:00; una forma rara de ajustes no tumba nada.
 *
 * **Las guardas comprueban invariantes de carga, no el tipo entero.** De
 * `ActivityDayPlanItem` (11 campos) se mira `id`, `startTime` y `endTime`, que
 * son los que la agenda desreferencia sin red. Añadir el resto sería el SDL otra
 * vez, con su mismo coste de mantenimiento y sin cubrir nada más.
 *
 * **Para añadir una guarda:** una entrada más en `CACHE_GUARDS`, con el prefijo
 * de clave, la frase de por qué y el predicado. Nada más; el resto es
 * automático.
 */

// ─── Utilidades de forma, diminutas a propósito ──────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullish(value: unknown): boolean {
  return value === null || value === undefined
}

/** Un array cuyos elementos cumplen todos el predicado. El vacío vale. */
function everyItem(value: unknown, predicate: (item: Record<string, unknown>) => boolean): boolean {
  return Array.isArray(value) && value.every((item) => isRecord(item) && predicate(item))
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === 'string'
}

// ─── El registro ─────────────────────────────────────────────────────────────

export type CacheGuard = {
  /** Se compara contra el principio de la clave, así que cubre sus variantes. */
  keyPrefix: readonly unknown[]
  /** Qué se cae si esto llega con otra forma. Sale en el aviso de consola. */
  porQue: string
  isValid: (data: unknown) => boolean
}

export const CACHE_GUARDS: readonly CacheGuard[] = [
  {
    // El fallo literal del 2026-09-23: `goal.activeDays.includes(...)`.
    keyPrefix: vidaKeys.categories.list(),
    porQue: 'el arco de la meta de Hoy recorre `goal.activeDays`',
    isValid: (data) =>
      everyItem(
        data,
        (category) =>
          hasString(category, 'id') &&
          (isNullish(category.goal) ||
            (isRecord(category.goal) && Array.isArray(category.goal.activeDays))),
      ),
  },
  {
    keyPrefix: vidaKeys.dayPlan.all(),
    porQue: 'la agenda de Hoy ordena y pinta cada bloque por `startTime`/`endTime`',
    isValid: (data) =>
      everyItem(
        data,
        (item) => hasString(item, 'id') && hasString(item, 'startTime') && hasString(item, 'endTime'),
      ),
  },
  {
    // El prefijo se escribe con las piezas de la fábrica de claves y **sin** la
    // fecha: así cubre `suggestions(cualquier día)` sin listarlos.
    keyPrefix: [...vidaKeys.items.all(), 'suggestions'],
    porQue: 'lo que trae la plantilla desreferencia `suggestion.item` sin red',
    isValid: (data) =>
      everyItem(
        data,
        (suggestion) =>
          isRecord(suggestion.item) &&
          hasString(suggestion.item, 'id') &&
          Array.isArray(suggestion.item.days),
      ),
  },
  {
    // El **mismo** `VidaItem` y el **mismo** campo que en `suggestions`, por otra
    // clave. `item.days.includes(...)` sin red aparece diez veces —la Plantilla
    // entera, los avisos de Hoy y `templateItemsForDate`, que Hoy llama en el
    // primer pintado—: es el gesto del 2026-09-23 con otro campo.
    // Sin el argumento: `items.list()` devuelve `[...,'list', false]` y un
    // prefijo con el `false` dentro dejaba fuera `list(true)`. Lo cazó el test
    // de cobertura, que es justo para lo que está.
    keyPrefix: [...vidaKeys.items.all(), 'list'],
    porQue: 'la plantilla y los avisos recorren `item.days` sin red',
    isValid: (data) =>
      everyItem(data, (item) => hasString(item, 'id') && Array.isArray(item.days)),
  },
  // ── `followUps`: cuatro claves y **tres formas**. Una guarda por forma. ─────
  {
    keyPrefix: [...vidaKeys.followUps.all(), 'open'],
    porQue: 'la barra de sesión lee la sesión abierta por `startTime`',
    // `ActivityFollowUp | null`: sin sesión abierta se guarda `null`, y es legítimo.
    isValid: (data) =>
      isNullish(data) || (isRecord(data) && hasString(data, 'id') && hasString(data, 'startTime')),
  },
  {
    keyPrefix: [...vidaKeys.followUps.all(), 'day'],
    porQue: 'lo vivido se coloca en la línea del día por `startTime`',
    isValid: (data) =>
      everyItem(data, (followUp) => hasString(followUp, 'id') && hasString(followUp, 'startTime')),
  },
  {
    // `ActivityFollowUpsDateGroup[]` = `{ date, followUps[] }`. **No tiene `id`
    // ni `startTime`**, y darlo por supuesto tiraba el 100 % de esta caché en
    // cada arranque: un prefijo que cubre varias formas es una trampa.
    keyPrefix: [...vidaKeys.followUps.all(), 'range'],
    porQue: 'Revisión recorre cada grupo de días y su lista de sesiones',
    isValid: (data) =>
      everyItem(data, (group) => hasString(group, 'date') && Array.isArray(group.followUps)),
  },
  {
    // **La primera guarda de hábitos, y la única de esta feature.**
    // `HabitFollowUpsDateGroup[]` = `{ date, followUps[] }`, la misma forma que
    // obligó a partir la guarda de `vidaKeys.followUps.range`. Va porque
    // `buildFollowUpsByHabit` (`habit-stats.utils.ts`) hace
    // `for (const fu of group.followUps)` **sin red**: un grupo cacheado sin
    // `followUps` tumba cuatro pantallas antes de pintar. El resto de
    // `habitKeys` sigue fuera del automatismo a sabiendas (ver el test de
    // cobertura): `FABRICAS` solo recorre `vidaKeys`, y meter hábitos ahí es una
    // decisión por clave con su propio expediente.
    keyPrefix: [...habitKeys.all, 'calendar'],
    porQue: 'el panel, Mi Día, la lista y Mi Persona recorren cada grupo y su lista de seguimientos',
    isValid: (data) =>
      everyItem(data, (group) => hasString(group, 'date') && Array.isArray(group.followUps)),
  },
  {
    // `ActivityFollowUpNoteRow[]`: id, date, startTime, notes.
    keyPrefix: vidaKeys.followUps.byActivityAll(),
    porQue: '«lo de otras veces» ordena las sesiones por `startTime`',
    isValid: (data) =>
      everyItem(data, (row) => hasString(row, 'id') && hasString(row, 'startTime')),
  },
]

/**
 * Las claves de Vida que **no** llevan guarda, cada una con su motivo. No es
 * documentación: `query-cache-guards.coverage.test.ts` recorre `vidaKeys` y
 * **falla** si aparece una clave que no está ni guardada ni aquí. Así una
 * consulta nueva no puede quedarse fuera por olvido —es la misma idea que la
 * regla por contenido de la tajada 1: que no dependa de que alguien se acuerde—.
 *
 * Se apunta por su **camino** dentro de `vidaKeys`, no por la clave con
 * argumentos.
 */
export const SIN_GUARDA_A_PROPOSITO: Readonly<Record<string, string>> = {
  'activities.list':
    'el catálogo se pinta como tarjetas y ningún campo suyo se recorre sin red: al degradar se vacía, no se cae',
  'activities.detail':
    'la ficha de una actividad lee campos sueltos con `?.`; sin ellos queda en blanco',
  'categories.detail':
    'la hoja de una categoría lee campos sueltos; el arco, que es quien recorre `goal.activeDays`, va por `categories.list`',
  'items.takenToday':
    '`VidaTakenToday[]` solo se usa para saber si un ítem ya se tomó: al degradar, no se marca ninguno',
}

/**
 * La guarda de una clave, si la hay. Se compara por **prefijo**, que es la parte
 * estructural de la clave: así `dayPlan.byDate('2026-09-23')` y
 * `items.suggestions('2026-09-23')` caen en su guarda sin listar un día por
 * entrada.
 */
export function findGuard(queryKey: unknown): CacheGuard | undefined {
  if (!Array.isArray(queryKey)) return undefined
  return CACHE_GUARDS.find(
    (guard) =>
      queryKey.length >= guard.keyPrefix.length &&
      guard.keyPrefix.every((piece, i) => queryKey[i] === piece),
  )
}

// ─── El saneador ─────────────────────────────────────────────────────────────

/**
 * Lo que se devuelve cuando no hay nada que salvar. `timestamp: 0` lo deja más
 * viejo que cualquier `maxAge`, así que `persistQueryClient` no solo no lo
 * hidrata: **borra** la entrada de `localStorage`. La app arranca sin datos, las
 * consultas piden lo suyo y la pantalla se ve **en carga**, no en error.
 */
const CLIENTE_VACIO: PersistedClient = {
  buster: '',
  timestamp: 0,
  clientState: { mutations: [], queries: [] },
}

/** Aviso una sola vez por arranque: no se llena la consola en cada entrada. */
let avisado = false

function avisar(mensaje: string): void {
  if (avisado) return
  avisado = true
  console.warn(`[query-persist] ${mensaje}`)
}

/** Solo para los tests: el aviso es por arranque, y cada test es un arranque. */
export function resetAvisoDeGuardas(): void {
  avisado = false
}

/**
 * El `deserialize` del persister. Corre **en cada arranque de la app**, antes de
 * que exista un árbol de React.
 *
 * Tira **solo** las entradas que no pasan su guarda, no la caché entera: lo que
 * sigue siendo válido se hidrata igual y la consulta descartada simplemente
 * vuelve a pedir lo suyo.
 *
 * **Esta función no lanza nunca.** Si lanzara, cambiaríamos una caída por otra:
 * es de lo primero que se ejecuta al abrir. Ante cualquier error —JSON roto, una
 * guarda con un fallo, una estructura que no es la esperada— devuelve el cliente
 * vacío y la app arranca sin caché.
 */
export function sanitizePersistedClient(cached: string): PersistedClient {
  try {
    const parsed: unknown = JSON.parse(cached)
    if (!isRecord(parsed) || !isRecord(parsed.clientState)) return CLIENTE_VACIO

    const queries = parsed.clientState.queries
    if (!Array.isArray(queries)) return CLIENTE_VACIO
    // `mutations` no se hidrata aquí, pero si no fuera una lista reventaría
    // dentro de `hydrate()`, ya fuera de esta función. Cuesta una línea.
    if (!Array.isArray(parsed.clientState.mutations)) return CLIENTE_VACIO

    const limpias = queries.filter((query: unknown) => {
      if (!isRecord(query)) return false
      const guard = findGuard(query.queryKey)
      if (!guard) return true
      const state = query.state
      // Una entrada sin datos (error, o en vuelo cuando se guardó) no tiene
      // forma que validar y tampoco puede tumbar nada.
      if (!isRecord(state) || state.data === undefined) return true
      let valida: boolean
      try {
        valida = guard.isValid(state.data)
      } catch {
        // Una guarda que revienta se comporta como una guarda que falla.
        valida = false
      }
      if (!valida) {
        avisar(
          `Se descartó una entrada de la caché con una forma inesperada (${guard.porQue}). La app la volverá a pedir.`,
        )
      }
      return valida
    })

    return {
      ...(parsed as unknown as PersistedClient),
      clientState: { ...parsed.clientState, queries: limpias },
    } as PersistedClient
  } catch {
    avisar('No se pudo leer la caché persistida. Se arranca sin ella.')
    return CLIENTE_VACIO
  }
}
