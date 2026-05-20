import { env } from '@/app/config/env'
import styles from './HomePage.module.scss'

export function HomePage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{env.appName}</h1>
      <p className={styles.description}>
        Base del proyecto lista. Aquí irán las features de hábitos.
      </p>
      <p className={styles.meta}>
        Versión <strong>{env.appVersion}</strong>
      </p>
    </section>
  )
}
