import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { env } from '@/app/config/env'

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
 * Invalida la caché persistida cuando cambia la versión de la app, para que un
 * cambio en la forma de las respuestas no hidrate datos con estructura vieja.
 */
export const queryPersistBuster = env.appVersion
