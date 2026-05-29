import { useNavigate } from 'react-router'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui'
import { TodosSettings } from '@/features/todos/components/TodosSettings/TodosSettings'

export function TodosSettingsPage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Configuración de tareas"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/todos')}>
            ← Volver
          </Button>
        }
      />
      <TodosSettings />
    </>
  )
}
