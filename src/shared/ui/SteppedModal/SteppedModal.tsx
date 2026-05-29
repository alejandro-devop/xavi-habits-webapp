import { AnimatePresence, motion } from 'framer-motion'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { scaleIn, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import styles from './SteppedModal.module.scss'

// ─── Step config ─────────────────────────────────────────────────────────────

export type ModalStepConfig = {
  title: string
  description?: string
  content: ReactNode
  footer?: ReactNode
}

// ─── Context / hook ───────────────────────────────────────────────────────────

type ModalStepContextValue = {
  push: (step: ModalStepConfig) => void
  pop: () => void
}

const ModalStepContext = createContext<ModalStepContextValue>({
  push: () => {},
  pop: () => {},
})

export function useModalStep() {
  return useContext(ModalStepContext)
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 16 : -16 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -16 : 16 }),
}

// ─── Component ────────────────────────────────────────────────────────────────

export type SteppedModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function SteppedModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: SteppedModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotionPreference()

  const [stack, setStack] = useState<ModalStepConfig[]>([])
  const [direction, setDirection] = useState(1)

  useBodyScrollLock(open)
  useFocusTrap(panelRef, open)

  // Reset stack when modal closes
  useEffect(() => {
    if (!open) setStack([])
  }, [open])

  // Escape: go back one step or close
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (stack.length > 0) {
        setDirection(-1)
        setStack((prev) => prev.slice(0, -1))
      } else {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, stack.length, onClose])

  const push = useCallback((step: ModalStepConfig) => {
    setDirection(1)
    setStack((prev) => [...prev, step])
  }, [])

  const pop = useCallback(() => {
    setDirection(-1)
    setStack((prev) => prev.slice(0, -1))
  }, [])

  if (typeof document === 'undefined') return null

  const current = stack.at(-1)
  const stepIndex = stack.length
  const canGoBack = stepIndex > 0

  const currentTitle = current?.title ?? title
  const currentDescription = current?.description ?? (stepIndex === 0 ? description : undefined)
  const currentContent = current?.content ?? children
  const currentFooter = current?.footer ?? (stepIndex === 0 ? footer : null)

  return createPortal(
    <AnimatePresence>
      {open ? (
        <ModalStepContext.Provider value={{ push, pop }}>
          <motion.div
            className={styles.overlay}
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : transitions.fast}
            onClick={onClose}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={currentDescription ? descriptionId : undefined}
              className={[styles.panel, styles[size]].join(' ')}
              variants={prefersReducedMotion ? undefined : scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={prefersReducedMotion ? { duration: 0 } : transitions.normal}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={styles.headerRow}>
                {canGoBack ? (
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={pop}
                    aria-label="Volver al paso anterior"
                  >
                    ←
                  </button>
                ) : null}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.header
                    key={`header-${stepIndex}`}
                    id={titleId}
                    className={styles.header}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <h2 className={styles.title}>{currentTitle}</h2>
                    {currentDescription ? (
                      <p id={descriptionId} className={styles.description}>
                        {currentDescription}
                      </p>
                    ) : null}
                  </motion.header>
                </AnimatePresence>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={onClose}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              {/* Sliding body */}
              <div className={styles.bodyClip}>
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={stepIndex}
                    custom={direction}
                    variants={prefersReducedMotion ? undefined : slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeInOut' }}
                    className={styles.body}
                  >
                    {currentContent}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <AnimatePresence mode="wait" initial={false}>
                {currentFooter ? (
                  <motion.footer
                    key={`footer-${stepIndex}`}
                    className={styles.footer}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {currentFooter}
                  </motion.footer>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </ModalStepContext.Provider>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
