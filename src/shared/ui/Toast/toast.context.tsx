import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ToastViewport } from '@/shared/ui/Toast/ToastViewport'
import type { ToastInput, ToastItem, ToastPosition, ToastVariant } from '@/shared/ui/Toast/toast.types'

const DEFAULT_DURATION = 4000

type ToastContextValue = {
  toasts: ToastItem[]
  position: ToastPosition
  show: (variant: ToastVariant, input: ToastInput) => string
  dismiss: (id: string) => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastCounter = 0

function nextToastId() {
  toastCounter += 1
  return `toast-${toastCounter}`
}

type ToastProviderProps = {
  children: ReactNode
  position?: ToastPosition
}

export function ToastProvider({ children, position = 'top-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((variant: ToastVariant, input: ToastInput) => {
    const id = nextToastId()
    const duration = input.duration ?? DEFAULT_DURATION
    setToasts((prev) => [...prev, { id, variant, message: input.message, duration }])
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      position,
      show,
      dismiss,
      success: (message, duration) => show('success', { message, duration }),
      error: (message, duration) => show('error', { message, duration }),
      info: (message, duration) => show('info', { message, duration }),
      warning: (message, duration) => show('warning', { message, duration }),
    }),
    [toasts, position, show, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
