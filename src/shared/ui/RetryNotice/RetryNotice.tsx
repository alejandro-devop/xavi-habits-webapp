import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { MAX_QUERY_RETRIES } from '@/app/providers/query-client'
import { reducedTransition, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { useRetryStatus } from '@/shared/hooks/useRetryStatus'
import styles from './RetryNotice.module.scss'

/**
 * Avisa que una petición falló y cuánto falta para el siguiente intento; al
 * agotarse los reintentos automáticos, ofrece reintentar a mano.
 *
 * Va arriba al centro a propósito: los toasts ocupan la esquina superior
 * derecha y RunningActivityWidget la inferior derecha.
 */
export function RetryNotice() {
  const { status, retryNow } = useRetryStatus()
  const prefersReducedMotion = useReducedMotionPreference()

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.viewport}>
      <AnimatePresence initial={false}>
        {status.kind !== 'idle' ? (
          <motion.div
            key={status.kind}
            role="status"
            aria-live="polite"
            className={[styles.notice, status.kind === 'failed' ? styles.failed : styles.retrying]
              .filter(Boolean)
              .join(' ')}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={prefersReducedMotion ? reducedTransition : transitions.normal}
          >
            {status.kind === 'retrying' ? (
              <>
                <span className={styles.dot} aria-hidden />
                <span className={styles.message}>
                  Sin respuesta del servidor. Reintentando en {status.secondsLeft} s…
                  <span className={styles.attempt}>
                    Intento {status.attempt} de {MAX_QUERY_RETRIES}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className={styles.message}>
                  No se pudo conectar con el servidor.
                  <span className={styles.attempt}>
                    Se agotaron los {MAX_QUERY_RETRIES} reintentos automáticos.
                  </span>
                </span>
                <button type="button" className={styles.action} onClick={retryNow}>
                  Reintentar
                </button>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
