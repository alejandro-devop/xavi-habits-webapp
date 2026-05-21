import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './LogoutButton.module.scss'

export function LogoutButton() {
  const logoutMutation = useLogoutMutation()

  return (
    <button
      type="button"
      className={styles.logoutBtn}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      disabled={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
    >
      {logoutMutation.isPending ? (
        <Spinner size="sm" decorative />
      ) : (
        <AppIcon name="power-off" size="sm" decorative />
      )}
    </button>
  )
}
