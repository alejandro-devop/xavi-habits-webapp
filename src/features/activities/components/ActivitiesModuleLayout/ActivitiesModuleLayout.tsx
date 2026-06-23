import { Outlet } from 'react-router'
import { ActivitiesModuleNav } from '@/features/activities/components/ActivitiesModuleNav'
import styles from './ActivitiesModuleLayout.module.scss'

export function ActivitiesModuleLayout() {
  return (
    <div className={styles.root}>
      <ActivitiesModuleNav />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
