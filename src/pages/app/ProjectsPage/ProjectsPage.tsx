import { useState, useCallback } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ProjectCard } from '@/features/quarters/components/ProjectCard/ProjectCard'
import { ProjectFormModal } from '@/features/quarters/components/ProjectFormModal/ProjectFormModal'
import { ProjectDetailDrawer } from '@/features/quarters/components/ProjectDetailDrawer/ProjectDetailDrawer'
import { useProjectsQuery, useRemoveProjectMutation } from '@/features/quarters'
import type { Project } from '@/features/quarters'
import styles from './ProjectsPage.module.scss'

export function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjectsQuery()
  const removeMutation = useRemoveProjectMutation()
  const { confirm } = useConfirmDialog()

  const [formOpen, setFormOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [drawerProjectId, setDrawerProjectId] = useState<string | null>(null)

  const openCreate = useCallback(() => { setEditProject(null); setFormOpen(true) }, [])
  const openEdit = useCallback((p: Project) => { setEditProject(p); setFormOpen(true) }, [])
  const closeForm = useCallback(() => setFormOpen(false), [])

  const handleDelete = useCallback(async (project: Project) => {
    const confirmed = await confirm({
      title: 'Eliminar proyecto',
      description: `¿Eliminar "${project.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (confirmed) removeMutation.mutate(project.id)
  }, [confirm, removeMutation])

  return (
    <section className={styles.page}>
      <PageHeader
        title="Proyectos"
        subtitle="Pool de proyectos y metas"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            + Nuevo proyecto
          </Button>
        }
      />

      <div className={styles.content}>
        {isLoading && <p className={styles.loading}>Cargando proyectos…</p>}

        {!isLoading && projects.length === 0 && (
          <EmptyState
            title="Sin proyectos aún"
            description="Crea tu primer proyecto para empezar a planificar tus quarters."
            action={
              <Button variant="primary" size="sm" onClick={openCreate}>
                Crear proyecto
              </Button>
            }
          />
        )}

        {projects.length > 0 && (
          <div className={styles.grid}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setDrawerProjectId(project.id)}
                onEdit={() => openEdit(project)}
                onDelete={() => void handleDelete(project)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal open={formOpen} onClose={closeForm} project={editProject} />

      <ProjectDetailDrawer
        projectId={drawerProjectId}
        open={Boolean(drawerProjectId)}
        onClose={() => setDrawerProjectId(null)}
      />
    </section>
  )
}
