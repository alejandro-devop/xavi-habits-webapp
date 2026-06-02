import { useState, useCallback } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ActiveQuarterHub } from '@/features/quarters/components/ActiveQuarterHub/ActiveQuarterHub'
import { QuarterCard } from '@/features/quarters/components/QuarterCard/QuarterCard'
import { QuarterFormModal } from '@/features/quarters/components/QuarterFormModal/QuarterFormModal'
import { useActiveQuarterQuery, useQuartersQuery } from '@/features/quarters'
import type { Quarter } from '@/features/quarters'
import styles from './QuartersPage.module.scss'

export function QuartersPage() {
  const { data: activeQuarter, isLoading: loadingActive } = useActiveQuarterQuery()
  const { data: allQuarters = [], isLoading: loadingAll } = useQuartersQuery()

  const [formOpen, setFormOpen] = useState(false)
  const [editQuarter, setEditQuarter] = useState<Quarter | null>(null)

  const openCreate = useCallback(() => { setEditQuarter(null); setFormOpen(true) }, [])
  const openEdit = useCallback((q: Quarter) => { setEditQuarter(q); setFormOpen(true) }, [])
  const closeForm = useCallback(() => setFormOpen(false), [])

  const isLoading = loadingActive || loadingAll
  const inactiveQuarters = allQuarters.filter((q) => q.status !== 'active')
  const planningQuarters = inactiveQuarters.filter((q) => q.status === 'planning')
  const completedQuarters = inactiveQuarters.filter((q) => q.status === 'completed')
  const hasActiveQuarter = Boolean(activeQuarter)

  return (
    <section className={styles.page}>
      <PageHeader
        title={activeQuarter ? activeQuarter.name : 'Quarters'}
        subtitle="Planificación y seguimiento trimestral"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            + Nuevo quarter
          </Button>
        }
      />

      <div className={styles.content}>
        {isLoading && <p className={styles.loading}>Cargando…</p>}

        {!isLoading && !activeQuarter && allQuarters.length === 0 && (
          <EmptyState
            title="Sin quarters aún"
            description="Crea tu primer quarter para empezar a planificar tus metas trimestrales."
            action={
              <Button variant="primary" size="sm" onClick={openCreate}>
                Crear quarter
              </Button>
            }
          />
        )}

        {activeQuarter && (
          <div className={styles.activeSection}>
            <ActiveQuarterHub quarter={activeQuarter} />
          </div>
        )}

        {planningQuarters.length > 0 && (
          <div className={styles.quartersGroup}>
            <h2 className={styles.groupTitle}>En planificación</h2>
            <div className={styles.quartersList}>
              {planningQuarters.map((q) => (
                <QuarterCard
                  key={q.id}
                  quarter={q}
                  onEdit={() => openEdit(q)}
                  hasActiveQuarter={hasActiveQuarter}
                />
              ))}
            </div>
          </div>
        )}

        {completedQuarters.length > 0 && (
          <div className={styles.quartersGroup}>
            <h2 className={styles.groupTitle}>Completados</h2>
            <div className={styles.quartersList}>
              {completedQuarters.map((q) => (
                <QuarterCard
                  key={q.id}
                  quarter={q}
                  onEdit={() => openEdit(q)}
                  hasActiveQuarter={hasActiveQuarter}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <QuarterFormModal open={formOpen} onClose={closeForm} quarter={editQuarter} />
    </section>
  )
}
