import { useState } from 'react'
import {
  Alert,
  Button,
  EmptyState,
  Section,
  Skeleton,
  SkeletonText,
  Spinner,
  useConfirmDialog,
  useToast,
} from '@/shared/ui'
import styles from '../TestingHallPage.module.scss'

export function FeedbackSection() {
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleDangerConfirm = async () => {
    const ok = await confirm({
      title: '¿Eliminar elemento?',
      description: 'Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        setConfirmLoading(true)
        await new Promise((r) => setTimeout(r, 600))
        setConfirmLoading(false)
      },
    })
    if (ok) toast.success('Confirmado')
  }

  return (
    <Section id="feedback" title="Feedback" description="Alertas, toast, confirm y estados vacíos">
      <div className={styles.row}>
        <Button variant="primary" size="sm" onClick={() => toast.success('Guardado correctamente')}>
          Toast success
        </Button>
        <Button variant="secondary" size="sm" onClick={() => toast.info('Información')}>
          Toast info
        </Button>
        <Button variant="ghost" size="sm" onClick={() => toast.warning('Atención')}>
          Toast warning
        </Button>
        <Button variant="danger" size="sm" onClick={() => toast.error('Error al guardar')}>
          Toast error
        </Button>
        <Button variant="danger" size="sm" isLoading={confirmLoading} onClick={() => void handleDangerConfirm()}>
          ConfirmDialog
        </Button>
      </div>
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
