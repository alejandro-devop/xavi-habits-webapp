export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export type ToastPosition = 'top-right' | 'bottom-right'

/**
 * Una acción dentro del aviso: un solo botón, con su etiqueta y lo que hace.
 *
 * Aditivo (FEAT-004, criterio 5): el toast que confirma «Terminar» ofrece
 * **«añadir una nota»** y lleva al cierre completo de esa sesión. Quien no la
 * pase sigue viendo el aviso exactamente igual que antes.
 *
 * Una, no varias: dos botones en un aviso que se va solo a los cuatro segundos
 * es una decisión que no da tiempo a tomar.
 */
export type ToastAction = {
  label: string
  onClick: () => void
}

export type ToastItem = {
  id: string
  variant: ToastVariant
  message: string
  duration: number
  action?: ToastAction
}

export type ToastInput = {
  message: string
  duration?: number
  action?: ToastAction
}
