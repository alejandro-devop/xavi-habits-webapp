import { selectAuthUser } from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'
import styles from './TodayPage.module.scss'

export function TodayPage() {
  const user = useAuthStore(selectAuthUser)

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Hoy</h1>
      <p className={styles.lead}>
        Bienvenido{user?.name ? `, ${user.name}` : ''}. El módulo de hábitos estará disponible
        pronto.
      </p>
      {user ? (
        <p className={styles.meta}>
          Sesión activa: <strong>{user.email}</strong>
        </p>
      ) : null}
    </section>
  )
}
