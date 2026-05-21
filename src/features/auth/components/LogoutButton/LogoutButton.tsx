import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation'
import { Button } from '@/shared/ui'

export function LogoutButton() {
  const logoutMutation = useLogoutMutation()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      isLoading={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
    >
      Cerrar sesión
    </Button>
  )
}
