import { Outlet } from 'react-router'
import styles from './LearningModuleLayout.module.scss'

export function LearningModuleLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
