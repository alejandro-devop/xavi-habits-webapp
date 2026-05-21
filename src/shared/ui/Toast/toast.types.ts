export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export type ToastPosition = 'top-right' | 'bottom-right'

export type ToastItem = {
  id: string
  variant: ToastVariant
  message: string
  duration: number
}

export type ToastInput = {
  message: string
  duration?: number
}
