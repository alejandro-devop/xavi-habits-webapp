import { PageHeader } from '@/shared/ui/PageHeader'
import { Card } from '@/shared/ui/Card'
import { Switch } from '@/shared/ui/Switch'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import {
  useUpdateUserSettingsMutation,
  useUserSettingsQuery,
} from '@/features/settings/hooks/useUserSettings'
import styles from './SettingsPage.module.scss'

export function SettingsPage() {
  const { data: settings, isLoading, isError } = useUserSettingsQuery()
  const updateMutation = useUpdateUserSettingsMutation()

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Preferencias generales de la aplicación." />

      {isLoading ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : null}

      {isError ? (
        <Alert variant="danger">No se pudieron cargar los ajustes.</Alert>
      ) : null}

      {settings ? (
        <div className={styles.sections}>
          <Card className={styles.section}>
            <h2 className={styles.sectionTitle}>Privacidad</h2>
            <p className={styles.sectionDescription}>
              Controla qué hábitos se muestran en la interfaz. Los hábitos marcados como ocultos
              siguen existiendo; solo dejan de verse cuando esta opción está activa.
            </p>
            <Switch
              id="hide-hidden-habits"
              label="Ocultar hábitos ocultos"
              checked={settings.hideHiddenHabits}
              disabled={updateMutation.isPending}
              onChange={(e) =>
                updateMutation.mutate({ hideHiddenHabits: e.target.checked })
              }
            />
            <p className={styles.hint}>
              Desactiva esta opción para ver y gestionar hábitos marcados como ocultos en detalle o
              formulario.
            </p>
          </Card>
        </div>
      ) : null}
    </>
  )
}
