import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { env } from '@/app/config/env'
import { sanitizePersistedClient } from './query-cache-guards'

/**
 * Clave donde react-query guarda la caché hidratada. Se expone para poder
 * limpiarla explícitamente (logout) sin depender del throttle del persister.
 */
export const QUERY_PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE'

const isBrowser = typeof window !== 'undefined'

/** Se avisa una sola vez: el persister reintenta en cada cambio de caché. */
let quotaWarned = false

/**
 * No se usa `shared/lib/storage` a propósito: ese helper traga los errores de
 * escritura, y aquí necesitamos distinguir "no hay espacio" de "se guardó". Si
 * la caché supera la cuota de localStorage (~5 MB) y el fallo pasa en silencio,
 * el modo offline deja de funcionar sin ninguna señal.
 */
export const queryPersister = createAsyncStoragePersister({
  key: QUERY_PERSIST_KEY,
  /**
   * La red de abajo (tajada 2). Sustituye al `JSON.parse` por defecto y descarta
   * las entradas cuya forma no cuadra **antes** de que exista un árbol de React.
   * Tapa el hueco que el invalidador no puede ver: que la forma cambie en el
   * servidor. El porqué y qué se valida, en `query-cache-guards.ts`.
   */
  deserialize: sanitizePersistedClient,
  storage: {
    getItem: (key) => {
      if (!isBrowser) return Promise.resolve(null)
      try {
        return Promise.resolve(window.localStorage.getItem(key))
      } catch {
        return Promise.resolve(null)
      }
    },
    setItem: (key, value) => {
      if (!isBrowser) return Promise.resolve()
      try {
        window.localStorage.setItem(key, value)
        quotaWarned = false
      } catch {
        // Cuota excedida o modo privado. Se descarta la entrada a medias para
        // no dejar una caché truncada que luego falle al hidratar.
        try {
          window.localStorage.removeItem(key)
        } catch {
          // sin nada más que hacer
        }
        if (!quotaWarned) {
          quotaWarned = true
          console.warn(
            '[query-persist] No se pudo guardar la caché offline (cuota de localStorage o modo privado). La app seguirá funcionando, pero sin datos al abrir sin red.',
          )
        }
      }
      return Promise.resolve()
    },
    removeItem: (key) => {
      if (!isBrowser) return Promise.resolve()
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
      return Promise.resolve()
    },
  },
})

/**
 * Identificador de la **forma** de los datos que se cachean. Lo inyecta Vite
 * (`define` en `vite.config.ts`) y lo calcula `vite/cache-shape.ts` a partir del
 * contenido de los documentos GraphQL, la capa `*.api.ts` y `query-keys.ts`.
 *
 * Se lee con `typeof` y con valor de reserva porque **nunca puede lanzar**: es
 * de lo primero que se evalúa al arrancar la app, y una excepción aquí es una
 * pantalla en blanco. Si el `define` no se aplicó, el invalidador se queda solo
 * con la versión: peor protección, pero app viva.
 */
export const QUERY_PERSIST_SHAPE_ID =
  typeof __QUERY_CACHE_SHAPE__ === 'string' && __QUERY_CACHE_SHAPE__.length > 0
    ? __QUERY_CACHE_SHAPE__
    : 'sin-forma'

/**
 * Invalida la caché persistida cuando cambia la forma de los datos, para que un
 * despliegue que cambia la estructura de las respuestas no hidrate datos con
 * estructura vieja.
 *
 * **Por qué no es `env.appVersion` a secas:** lo era, y por eso esto falló en
 * producción el 2026-09-23. `VITE_APP_VERSION` vale `0.0.0` en los tres `.env`
 * del repositorio y `package.json` no se ha movido del `0.0.0` del primer
 * commit: el invalidador jamás cambió de valor y la protección **nunca llegó a
 * ejecutarse**. Depender de que alguien suba un número a mano es depender de que
 * alguien se acuerde.
 *
 * **Por qué no es el commit del despliegue** (`VERCEL_GIT_COMMIT_SHA`): cambiaría
 * en *cada* push a `main`, así que tiraría la caché en cada despliegue —también
 * en los que solo tocan estilos— y se perdería el beneficio de abrir con datos al
 * instante, que es la razón de persistirla. Además Vercel no expone sus variables
 * al cliente por sí sola (Vite solo publica `VITE_*`), así que habría que
 * puentearla igualmente por `define`, y en un build local no existiría.
 *
 * La versión se conserva como primer componente: si algún día se versiona la app
 * de verdad, seguirá invalidando sin tocar nada de esto.
 */
export const queryPersistBuster = `v${env.appVersion}-${QUERY_PERSIST_SHAPE_ID}`

/**
 * Las opciones exactas con las que la app monta `PersistQueryClientProvider`.
 * Viven aquí, y no dentro de `AppProviders`, para que un test pueda montar la
 * **misma** configuración que corre en producción en vez de una copia que se
 * desincroniza.
 *
 * `maxAge` sigue en 24 h y **sigue alineado con el `gcTime` de
 * `query-client.ts`**: si `maxAge` superara al `gcTime`, se hidratarían queries
 * que la caché en memoria ya considera descartables. Con el invalidador atado a
 * la forma, una caché puede sobrevivir ahora a varios despliegues seguidos, así
 * que estas 24 h pasan a ser el único techo de antigüedad de lo que se hidrata:
 * razón de más para no subirlas sin subir el `gcTime` a la vez.
 */
export const queryPersistOptions = {
  persister: queryPersister,
  buster: queryPersistBuster,
  maxAge: 1000 * 60 * 60 * 24,
}
