import { useNavigate } from 'react-router'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui'
import { NotebookList } from '@/features/todos/components/NotebookList/NotebookList'
import styles from './TodosPage.module.scss'

export function TodosPage() {
  const navigate = useNavigate()

  return (
    <section className={styles.page}>
      <PageHeader
        title="Tareas"
        subtitle="Presiona N para nueva tarea · ↑↓ para navegar · E para completar · D para eliminar"
        hideSubtitleOnMobile
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/todos/settings')}>
            Configurar
          </Button>
        }
      />
      <NotebookList />
    </section>
  )
}
