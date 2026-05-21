import { Outlet } from 'react-router'
import { ActivitiesModuleNav } from '@/features/activities/components/ActivitiesModuleNav'
import { PageHeader } from '@/shared/ui/PageHeader'
import styles from './ActivitiesModuleLayout.module.scss'

export function ActivitiesModuleLayout() {
  return (
    <div className={styles.root}>
      <PageHeader
        title="Actividades"
        subtitle="Gestiona tareas, categorías y seguimiento de tiempo en un solo módulo."
      />
      <ActivitiesModuleNav />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
