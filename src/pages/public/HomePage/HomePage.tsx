import { authPaths } from '@/features/auth/router/auth-paths'
import { Button, Card } from '@/shared/ui'
import styles from './HomePage.module.scss'

export function HomePage() {
  return (
    <section className={styles.hero}>
      <Card className={styles.card} padding="lg">
        <p className={styles.eyebrow}>Hábitos, actividades y cursos</p>
        <h1 className={styles.title}>Xavi</h1>
        <p className={styles.description}>
          Organiza tu día, construye hábitos duraderos y sigue tu progreso en un solo lugar.
        </p>
        <div className={styles.actions}>
          <Button to={authPaths.register} variant="primary" size="lg">
            Crear cuenta
          </Button>
          <Button to={authPaths.login} variant="secondary" size="lg">
            Iniciar sesión
          </Button>
        </div>
      </Card>
    </section>
  )
}
