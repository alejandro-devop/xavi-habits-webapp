import { useToastContext } from '@/shared/ui/Toast/toast.context'

export function useToast() {
  const { success, error, info, warning, dismiss, show } = useToastContext()
  return { success, error, info, warning, dismiss, show }
}
