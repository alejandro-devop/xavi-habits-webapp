import { Alert, Button, EmptyState, Section, Skeleton, SkeletonText, Spinner } from '@/shared/ui'
import styles from '../TestingHallPage.module.scss'

export function FeedbackSection() {
  return (
    <Section id="feedback" title="Feedback" description="Alertas, carga y estados vacíos">
      <Alert variant="info">Mensaje informativo.</Alert>
      <Alert variant="success">Operación exitosa.</Alert>
      <Alert variant="warning">Revisa los datos.</Alert>
      <Alert variant="danger">Error en la solicitud.</Alert>
      <div className={styles.row}>
        <Spinner size="sm" />
        <Spinner size="md" />
        <Button isLoading variant="secondary">
          Botón loading
        </Button>
      </div>
      <Section title="Skeleton" description="Placeholders animados">
        <Skeleton width="100%" height={48} />
        <SkeletonText lines={3} />
        <div className={styles.row}>
          <Skeleton circle width={48} height={48} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="90%" height={12} />
          </div>
        </div>
      </Section>
      <EmptyState
        title="Sin resultados"
        description="No hay elementos que mostrar en esta lista."
        icon="○"
        action={
          <Button variant="primary" size="sm">
            Crear nuevo
          </Button>
        }
      />
    </Section>
  )
}
