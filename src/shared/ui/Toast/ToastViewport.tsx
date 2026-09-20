import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { reducedTransition, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { useToastContext } from '@/shared/ui/Toast/toast.context'
import styles from './Toast.module.scss'

const ROLE_BY_VARIANT = {
  success: 'status',
  info: 'status',
  warning: 'alert',
  error: 'alert',
} as const

type ToastViewportProps = {
  /** Ámbito del design system para el portal (p. ej. `'aura'`). */
  ds?: string
}

export function ToastViewport({ ds }: ToastViewportProps) {
  const { toasts, position, dismiss } = useToastContext()
  const prefersReducedMotion = useReducedMotionPreference()

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={[styles.viewport, styles[position]].join(' ')}
      data-ds={ds}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role={ROLE_BY_VARIANT[toast.variant]}
            className={[styles.toast, styles[toast.variant]].join(' ')}
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={prefersReducedMotion ? reducedTransition : transitions.normal}
            layout
          >
            <span className={styles.message}>{toast.message}</span>
            {/* La acción va **antes** de la ✕ y cierra el aviso al usarse: si se
                quedara abierto detrás del modal que abre, taparía lo que la
                persona acaba de pedir (FEAT-004, criterio 5). */}
            {toast.action ? (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.dismiss}
              aria-label="Cerrar notificación"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
