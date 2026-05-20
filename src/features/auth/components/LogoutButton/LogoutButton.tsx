import { useLogoutMutation } from '@/features/auth/hooks/useLogoutMutation'
import styles from './LogoutButton.module.scss'

export function LogoutButton() {
  const logoutMutation = useLogoutMutation()

  return (
    <button
      type="button"
      className={styles.button}
      disabled={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
    >
      {logoutMutation.isPending ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}
