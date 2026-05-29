import { PageHeader } from '@/shared/ui/PageHeader'
import { NotebookList } from '@/features/todos/components/NotebookList/NotebookList'
import styles from './TodosPage.module.scss'

export function TodosPage() {
  return (
    <section className={styles.page}>
      <PageHeader
        title="Tareas"
        subtitle="Presiona N para nueva tarea · ↑↓ para navegar · E para completar · D para eliminar"
        hideSubtitleOnMobile
      />
      <NotebookList />
    </section>
  )
}
