import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import type {
  ConfirmDialogOptions,
  ConfirmDialogState,
} from '@/shared/ui/ConfirmDialog/confirm-dialog.types'

const initialState: ConfirmDialogState = {
  open: false,
  loading: false,
  title: '',
  resolve: null,
}

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>(initialState)

  const close = useCallback((result: boolean) => {
    setState((prev) => {
      prev.resolve?.(result)
      return initialState
    })
  }, [])

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        loading: false,
        resolve,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        variant: options.variant ?? 'default',
        onConfirm: options.onConfirm,
      })
    })
  }, [])

  const handleConfirm = async () => {
    if (!state.onConfirm) {
      close(true)
      return
    }
    setState((prev) => ({ ...prev, loading: true }))
    try {
      await state.onConfirm()
      close(true)
    } catch {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <Modal
        open={state.open}
        onClose={() => !state.loading && close(false)}
        title={state.title}
        description={state.description}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={state.loading}
              onClick={() => close(false)}
            >
              {state.cancelLabel}
            </Button>
            <Button
              variant={state.variant === 'danger' ? 'danger' : 'primary'}
              isLoading={state.loading}
              onClick={() => void handleConfirm()}
            >
              {state.confirmLabel}
            </Button>
          </>
        }
      />
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext)
  if (!ctx) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')
  }
  return ctx
}
