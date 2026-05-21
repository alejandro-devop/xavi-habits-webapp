export type ConfirmDialogVariant = 'default' | 'danger'

export type ConfirmDialogOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
  onConfirm?: () => void | Promise<void>
}

export type ConfirmDialogState = ConfirmDialogOptions & {
  open: boolean
  loading: boolean
  resolve: ((value: boolean) => void) | null
}
