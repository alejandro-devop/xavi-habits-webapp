import { Outlet } from 'react-router'
import styles from './AppIdeasModuleLayout.module.scss'

export function AppIdeasModuleLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
