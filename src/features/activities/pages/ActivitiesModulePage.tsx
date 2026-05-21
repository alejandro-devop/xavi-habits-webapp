import { Card } from '@/shared/ui/Card'
import styles from './ActivitiesModulePage.module.scss'

export function ActivitiesModulePage() {
  return (
    <div className={styles.page}>
      <p className={styles.intro}>
        Bienvenido al módulo de Actividades. Aquí centralizarás tareas, categorías y
        seguimiento de tiempo.
      </p>

      <div className={styles.cards}>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>Lista de actividades</h2>
          <p className={styles.cardText}>
            Próximamente: crear, editar y completar actividades con estado, prioridad y fecha
            programada.
          </p>
        </Card>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>Seguimiento de tiempo</h2>
          <p className={styles.cardText}>
            Próximamente: registros de tiempo (follow-ups) por actividad y vista del día.
          </p>
        </Card>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>Reportes rápidos</h2>
          <p className={styles.cardText}>
            Próximamente: resúmenes de tiempo invertido y actividad por categoría.
          </p>
        </Card>
      </div>

      <p className={styles.hint}>
        Mientras tanto, configura tus <strong>categorías</strong> desde la pestaña Categories.
      </p>
    </div>
  )
}
