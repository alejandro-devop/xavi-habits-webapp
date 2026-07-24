import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { StandupItemDrawer } from '@/features/activities/components/StandupItemDrawer'
import { StandupKanbanCard } from '@/features/activities/components/StandupKanbanCard'
import { StandupKanbanColumn } from '@/features/activities/components/StandupKanbanColumn'
import {
  useCarryOverStandupItemsMutation,
  useCloseStandupDayMutation,
  useCreateStandupItemMutation,
  useCreateStandupMemberMutation,
  useCreateTodoFromStandupItemMutation,
  useDeleteStandupItemMutation,
  useDeleteStandupMemberMutation,
  useOpenStandupDayMutation,
  useStandupDayQuery,
  useStandupDaySummaryQuery,
  useStandupMembersQuery,
  useUpdateStandupItemMutation,
  useUpdateStandupMemberMutation,
} from '@/features/activities/hooks/useStandup'
import type {
  StandupItem,
  StandupItemFormValues,
  StandupItemStatus,
} from '@/features/activities/types/standup.types'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { getCurrentLocalDate } from '@/features/activities/utils/activity-time.utils'
import {
  useUpdateUserSettingsMutation,
  useUserSettingsQuery,
} from '@/features/settings/hooks/useUserSettings'
import { useTodoFoldersQuery } from '@/features/todos/hooks/useTodos'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { SearchSelect } from '@/shared/ui/SearchSelect'
import { Select } from '@/shared/ui/Select'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Textarea } from '@/shared/ui/Textarea'
import { useToast } from '@/shared/ui/Toast'
import styles from './StandupPage.module.scss'

const STATUS_OPTIONS: { value: StandupItemStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'blocked', label: 'Bloqueada' },
  { value: 'completed', label: 'Completada' },
]

const STATUS_BADGE: Record<StandupItemStatus, 'neutral' | 'primary' | 'success' | 'danger'> = {
  pending: 'neutral',
  in_progress: 'primary',
  completed: 'success',
  blocked: 'danger',
}

const emptyForm = (memberId = ''): StandupItemFormValues => ({
  title: '',
  notes: '',
  ticketNumber: '',
  memberId,
  status: 'in_progress',
  blockedReason: '',
})

export function StandupPage() {
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const today = getCurrentLocalDate()
  const [searchParams] = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || today)
  const [memberName, setMemberName] = useState('')
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StandupItem | null>(null)
  const [formValues, setFormValues] = useState<StandupItemFormValues>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [carryOverOpen, setCarryOverOpen] = useState(false)
  const [selectedCarryIds, setSelectedCarryIds] = useState<string[]>([])
  const [quickAddMemberId, setQuickAddMemberId] = useState('')
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [detailItemId, setDetailItemId] = useState<string | null>(null)
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const { data: settings } = useUserSettingsQuery()
  const updateSettings = useUpdateUserSettingsMutation()
  const { data: folders = [] } = useTodoFoldersQuery()
  const { data: members = [] } = useStandupMembersQuery(true)
  const activeMembers = useMemo(() => members.filter((m) => m.isActive), [members])
  const {
    data: dayView,
    isLoading,
    isError,
    refetch,
  } = useStandupDayQuery(selectedDate)
  const { data: summary, isFetching: summaryLoading } = useStandupDaySummaryQuery(
    selectedDate,
    summaryOpen,
  )

  const openDay = useOpenStandupDayMutation()
  const closeDay = useCloseStandupDayMutation()
  const createMember = useCreateStandupMemberMutation()
  const updateMember = useUpdateStandupMemberMutation()
  const deleteMember = useDeleteStandupMemberMutation()
  const createItem = useCreateStandupItemMutation()
  const updateItem = useUpdateStandupItemMutation(selectedDate)
  const deleteItem = useDeleteStandupItemMutation(selectedDate)
  const carryOver = useCarryOverStandupItemsMutation()
  const createTodo = useCreateTodoFromStandupItemMutation(selectedDate)

  const day = dayView?.day ?? null
  const items = dayView?.items ?? []
  const candidates = dayView?.carryOverCandidates ?? []
  const isOpen = day?.status === 'open'
  const busy =
    openDay.isPending ||
    closeDay.isPending ||
    createItem.isPending ||
    updateItem.isPending ||
    deleteItem.isPending ||
    carryOver.isPending

  const folderOptions = folders.map((f) => ({ value: f.id, label: f.name }))

  const itemsByMember = useMemo(() => {
    const map = new Map<string, StandupItem[]>()
    for (const item of items) {
      const list = map.get(item.memberId) ?? []
      list.push(item)
      map.set(item.memberId, list)
    }
    const groups = [...map.entries()].map(([memberId, memberItems]) => {
      const sortedItems = [...memberItems].sort((a, b) => {
        if (a.status === 'blocked' && b.status !== 'blocked') return -1
        if (b.status === 'blocked' && a.status !== 'blocked') return 1
        return b.daysInBacklog - a.daysInBacklog
      })
      const stats = {
        blocked: memberItems.filter((i) => i.status === 'blocked').length,
        inProgress: memberItems.filter((i) => i.status === 'in_progress').length,
        pending: memberItems.filter((i) => i.status === 'pending').length,
        completed: memberItems.filter((i) => i.status === 'completed').length,
      }
      const maxBacklog = memberItems.reduce((max, i) => Math.max(max, i.daysInBacklog), 0)
      return {
        memberId,
        memberName:
          members.find((m) => m.id === memberId)?.name ??
          memberItems[0]?.member?.name ??
          'Sin responsable',
        items: sortedItems,
        stats,
        maxBacklog,
      }
    })
    return groups.sort((a, b) => {
      if (a.stats.blocked !== b.stats.blocked) return b.stats.blocked - a.stats.blocked
      if (a.maxBacklog !== b.maxBacklog) return b.maxBacklog - a.maxBacklog
      return a.memberName.localeCompare(b.memberName, 'es')
    })
  }, [items, members])

  const dayStats = useMemo(() => {
    const blocked = items.filter((i) => i.status === 'blocked').length
    const inProgress = items.filter((i) => i.status === 'in_progress').length
    const pending = items.filter((i) => i.status === 'pending').length
    const completed = items.filter((i) => i.status === 'completed').length
    const oldestBacklog = items.reduce((max, i) => Math.max(max, i.daysInBacklog), 0)
    return { total: items.length, blocked, inProgress, pending, completed, oldestBacklog }
  }, [items])

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of members) map.set(member.id, member.name)
    return map
  }, [members])

  const kanbanColumns = useMemo(() => {
    return STATUS_OPTIONS.map(({ value, label }) => ({
      status: value,
      title: label,
      items: items
        .filter((item) => item.status === value)
        .sort((a, b) => b.daysInBacklog - a.daysInBacklog),
    }))
  }, [items])

  const activeDragItem = activeDragId ? items.find((i) => i.id === activeDragId) ?? null : null
  const detailItem = detailItemId ? items.find((i) => i.id === detailItemId) ?? null : null

  useEffect(() => {
    if (carryOverOpen) {
      setSelectedCarryIds(candidates.map((c) => c.id))
    }
  }, [carryOverOpen, candidates])

  const effectiveQuickAddMemberId = quickAddMemberId || activeMembers[0]?.id || ''

  const openCreateItem = () => {
    setEditingItem(null)
    setFormValues(emptyForm(activeMembers[0]?.id ?? ''))
    setFormError(null)
    setItemModalOpen(true)
  }

  const openEditItem = (item: StandupItem) => {
    setEditingItem(item)
    setFormValues({
      title: item.title,
      notes: item.notes ?? '',
      ticketNumber: item.ticketNumber ?? '',
      memberId: item.memberId,
      status: item.status,
      blockedReason: item.blockedReason ?? '',
    })
    setFormError(null)
    setItemModalOpen(true)
  }

  const handleSaveItem = () => {
    if (!formValues.title.trim()) {
      setFormError('El título es obligatorio')
      return
    }
    if (!formValues.memberId) {
      setFormError('Selecciona un responsable')
      return
    }
    if (formValues.status === 'blocked' && !formValues.blockedReason.trim()) {
      setFormError('Indica el motivo del bloqueo')
      return
    }

    const blockedReason = formValues.status === 'blocked' ? formValues.blockedReason.trim() : null

    if (editingItem) {
      updateItem.mutate(
        {
          id: editingItem.id,
          title: formValues.title.trim(),
          notes: formValues.notes.trim() || null,
          ticketNumber: formValues.ticketNumber.trim() || null,
          memberId: formValues.memberId,
          status: formValues.status,
          blockedReason,
        },
        { onSuccess: () => setItemModalOpen(false) },
      )
      return
    }

    createItem.mutate(
      {
        date: selectedDate,
        title: formValues.title.trim(),
        notes: formValues.notes.trim() || null,
        ticketNumber: formValues.ticketNumber.trim() || null,
        memberId: formValues.memberId,
        status: formValues.status,
        blockedReason,
      },
      { onSuccess: () => setItemModalOpen(false) },
    )
  }

  const handleQuickAdd = () => {
    if (!quickAddTitle.trim() || !effectiveQuickAddMemberId) return
    createItem.mutate({
      date: selectedDate,
      title: quickAddTitle.trim(),
      memberId: effectiveQuickAddMemberId,
      status: 'in_progress',
    })
    setQuickAddTitle('')
  }

  const handleDeleteItem = async (item: StandupItem) => {
    const ok = await confirm({
      title: 'Eliminar entrada',
      description: `¿Eliminar "${item.title}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    })
    if (ok) deleteItem.mutate(item.id)
  }

  const handleMoveItem = (item: StandupItem, status: StandupItemStatus) => {
    if (status === item.status) return
    if (status === 'blocked') {
      setEditingItem(item)
      setFormValues({
        title: item.title,
        notes: item.notes ?? '',
        ticketNumber: item.ticketNumber ?? '',
        memberId: item.memberId,
        status: 'blocked',
        blockedReason: item.blockedReason ?? '',
      })
      setFormError(null)
      setItemModalOpen(true)
      return
    }
    updateItem.mutate({ id: item.id, status })
  }

  const handleDrawerMove = (status: StandupItemStatus) => {
    if (!detailItem) return
    handleMoveItem(detailItem, status)
    setDetailItemId(null)
  }

  const handleDrawerDelete = () => {
    if (!detailItem) return
    const item = detailItem
    setDetailItemId(null)
    void handleDeleteItem(item)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)
    if (!over) return
    const item = items.find((i) => i.id === active.id)
    if (!item) return
    handleMoveItem(item, over.id as StandupItemStatus)
  }

  const handleCopySummary = async () => {
    const text = summary?.text
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Resumen copiado')
    } catch {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <FormField id="standup-date" label="Día">
          <Input
            id="standup-date"
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </FormField>

        <div className={styles.toolbarActions}>
          {!day || day.status === 'closed' ? (
            <Button
              variant="primary"
              onClick={() => openDay.mutate(selectedDate)}
              disabled={openDay.isPending}
            >
              Abrir día
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => closeDay.mutate(selectedDate)}
              disabled={closeDay.isPending}
            >
              Cerrar día
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setSummaryOpen(true)}
            disabled={!day || items.length === 0}
          >
            Resumen
          </Button>
          <Link to={activitiesPaths.standupWeek} className={styles.weekLink}>
            Ver semana
          </Link>
          {isOpen && candidates.length > 0 ? (
            <Button variant="ghost" onClick={() => setCarryOverOpen(true)}>
              Traer de ayer ({candidates.length})
            </Button>
          ) : null}
          {isOpen ? (
            <Button variant="primary" onClick={openCreateItem} disabled={activeMembers.length === 0}>
              Nueva entrada
            </Button>
          ) : null}
        </div>
      </div>

      <div className={styles.settingsRow}>
        <FormField
          id="standup-todo-folder"
          label="Carpeta de tareas"
          hint="Las entradas enviadas a Todos irán a esta carpeta."
        >
          <SearchSelect
            value={settings?.standupTodoFolderId ?? null}
            options={folderOptions}
            onChange={(value) => updateSettings.mutate({ standupTodoFolderId: value ?? null })}
            placeholder="Selecciona una carpeta…"
            clearable
            disabled={updateSettings.isPending || !settings}
          />
        </FormField>
      </div>

      {isOpen && activeMembers.length > 0 ? (
        <div className={styles.quickAdd}>
          <Select
            id="quick-add-member"
            aria-label="Responsable"
            value={effectiveQuickAddMemberId}
            options={activeMembers.map((m) => ({ value: m.id, label: m.name }))}
            onChange={(value) => setQuickAddMemberId(value)}
          />
          <Input
            aria-label="Nueva entrada rápida"
            placeholder="Escribe y presiona Enter para agregar…"
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleQuickAdd()
              }
            }}
          />
          <Button
            variant="secondary"
            onClick={handleQuickAdd}
            disabled={!quickAddTitle.trim() || createItem.isPending}
          >
            Agregar
          </Button>
        </div>
      ) : null}

      {day && items.length > 0 ? (
        <div className={styles.dashboard}>
          <span className={styles.dashboardStat}>{dayStats.total} entradas</span>
          <span className={styles.dashboardStat}>{dayStats.inProgress} en progreso</span>
          {dayStats.blocked > 0 ? (
            <span className={`${styles.dashboardStat} ${styles.dashboardStatDanger}`}>
              {dayStats.blocked} bloqueadas
            </span>
          ) : null}
          {dayStats.oldestBacklog > 0 ? (
            <span className={styles.dashboardStat}>
              Más antiguo: {dayStats.oldestBacklog}d en backlog
            </span>
          ) : null}
        </div>
      ) : null}

      <section className={styles.membersSection} aria-label="Responsables">
        <h2 className={styles.sectionTitle}>Responsables</h2>
        <div className={styles.memberAdd}>
          <Input
            aria-label="Nombre del responsable"
            placeholder="Nombre"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!memberName.trim() || createMember.isPending}
            onClick={() =>
              createMember.mutate(
                { name: memberName.trim() },
                { onSuccess: () => setMemberName('') },
              )
            }
          >
            Añadir
          </Button>
        </div>
        {members.length === 0 ? (
          <p className={styles.hint}>Añade al menos un responsable para crear entradas.</p>
        ) : (
          <ul className={styles.memberList}>
            {members.map((member) => (
              <li key={member.id} className={styles.memberItem}>
                <span className={!member.isActive ? styles.inactive : undefined}>{member.name}</span>
                <div className={styles.memberActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateMember.mutate({ id: member.id, isActive: !member.isActive })
                    }
                  >
                    {member.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Eliminar responsable',
                        description: `¿Eliminar a ${member.name}? Solo funciona si no tiene entradas.`,
                        confirmLabel: 'Eliminar',
                        variant: 'danger',
                      })
                      if (ok) deleteMember.mutate(member.id)
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {day && items.length > 0 ? (
        <div className={styles.viewToggle}>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            Lista
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
        </div>
      ) : null}

      {isLoading ? <Skeleton height="8rem" /> : null}
      {isError ? (
        <Alert variant="danger">
          No se pudo cargar el standup del día.{' '}
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {!isLoading && !day ? (
        <EmptyState
          title="Día sin abrir"
          description="Abre el día para registrar el seguimiento del equipo."
        />
      ) : null}

      {!isLoading && day && items.length === 0 ? (
        <EmptyState
          title="Sin entradas"
          description={
            isOpen
              ? 'Crea una entrada o arrastra pendientes de ayer.'
              : 'Este día está cerrado y no tiene entradas.'
          }
        />
      ) : null}

      {viewMode === 'list' && itemsByMember.map((group) => (
        <section key={group.memberId} className={styles.group}>
          <h3 className={styles.groupTitle}>
            {group.memberName}
            {group.stats.blocked > 0 ? (
              <Badge variant="danger">{group.stats.blocked} bloqueada{group.stats.blocked > 1 ? 's' : ''}</Badge>
            ) : null}
            {group.stats.inProgress > 0 ? (
              <Badge variant="primary">{group.stats.inProgress} en progreso</Badge>
            ) : null}
            {group.stats.pending > 0 ? (
              <Badge variant="neutral">{group.stats.pending} pendiente{group.stats.pending > 1 ? 's' : ''}</Badge>
            ) : null}
          </h3>
          <ul className={styles.itemList}>
            {group.items.map((item) => (
              <li
                key={item.id}
                className={
                  item.status === 'blocked'
                    ? `${styles.item} ${styles.itemBlocked}`
                    : styles.item
                }
              >
                <div className={styles.itemMain}>
                  <div className={styles.itemTitleRow}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <Badge variant={STATUS_BADGE[item.status]}>
                      {STATUS_OPTIONS.find((s) => s.value === item.status)?.label}
                    </Badge>
                    {item.daysInBacklog > 0 ? (
                      <Badge variant="warning">{item.daysInBacklog}d backlog</Badge>
                    ) : null}
                  </div>
                  <div className={styles.itemMeta}>
                    {item.ticketNumber ? <span>#{item.ticketNumber}</span> : null}
                    {item.notes ? <span>{item.notes}</span> : null}
                    {item.linkedTodoId ? <span>Todo vinculado</span> : null}
                  </div>
                  {item.status === 'blocked' && item.blockedReason ? (
                    <div className={styles.blockedReason}>🚧 {item.blockedReason}</div>
                  ) : null}
                </div>
                {isOpen ? (
                  <div className={styles.itemActions}>
                    <Button variant="ghost" size="sm" onClick={() => openEditItem(item)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={createTodo.isPending || !settings?.standupTodoFolderId}
                      onClick={() => createTodo.mutate(item.id)}
                    >
                      {item.linkedTodoId ? 'Ver todo' : 'A tareas'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleDeleteItem(item)}>
                      Eliminar
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {viewMode === 'kanban' && day ? (
        <DndContext sensors={dndSensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.kanbanBoard}>
            {kanbanColumns.map((column) => (
              <StandupKanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                items={column.items}
                memberNameById={memberNameById}
                onOpenDetail={(item) => setDetailItemId(item.id)}
                interactive={isOpen}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragItem ? (
              <StandupKanbanCard
                item={activeDragItem}
                memberName={
                  memberNameById.get(activeDragItem.memberId) ??
                  activeDragItem.member?.name ??
                  'Sin responsable'
                }
                onOpenDetail={() => {}}
                dragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      <StandupItemDrawer
        item={detailItem}
        memberName={
          detailItem
            ? memberNameById.get(detailItem.memberId) ?? detailItem.member?.name ?? 'Sin responsable'
            : ''
        }
        onClose={() => setDetailItemId(null)}
        onEdit={() => {
          if (!detailItem) return
          openEditItem(detailItem)
          setDetailItemId(null)
        }}
        onMove={handleDrawerMove}
        onCreateTodo={() => detailItem && createTodo.mutate(detailItem.id)}
        onDelete={handleDrawerDelete}
        canCreateTodo={Boolean(settings?.standupTodoFolderId)}
        creatingTodo={createTodo.isPending}
        interactive={isOpen}
      />

      <Modal
        open={itemModalOpen}
        onClose={() => !busy && setItemModalOpen(false)}
        title={editingItem ? 'Editar entrada' : 'Nueva entrada'}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setItemModalOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveItem} disabled={busy}>
              {editingItem ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <FormField id="standup-item-title" label="Título" error={formError ?? undefined}>
            <Input
              id="standup-item-title"
              value={formValues.title}
              onChange={(e) => setFormValues((prev) => ({ ...prev, title: e.target.value }))}
            />
          </FormField>
          <FormField id="standup-item-member" label="Responsable">
            <Select
              id="standup-item-member"
              value={formValues.memberId}
              options={activeMembers.map((m) => ({ value: m.id, label: m.name }))}
              onChange={(value) => setFormValues((prev) => ({ ...prev, memberId: value }))}
            />
          </FormField>
          <FormField id="standup-item-status" label="Estado">
            <Select
              id="standup-item-status"
              value={formValues.status}
              options={STATUS_OPTIONS}
              onChange={(value) =>
                setFormValues((prev) => ({
                  ...prev,
                  status: value as StandupItemStatus,
                }))
              }
            />
          </FormField>
          {formValues.status === 'blocked' ? (
            <FormField id="standup-item-blocked-reason" label="Motivo del bloqueo">
              <Input
                id="standup-item-blocked-reason"
                value={formValues.blockedReason}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, blockedReason: e.target.value }))
                }
              />
            </FormField>
          ) : null}
          <FormField id="standup-item-ticket" label="Ticket (opcional)">
            <Input
              id="standup-item-ticket"
              value={formValues.ticketNumber}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, ticketNumber: e.target.value }))
              }
            />
          </FormField>
          <FormField id="standup-item-notes" label="Notas">
            <Textarea
              id="standup-item-notes"
              value={formValues.notes}
              onChange={(e) => setFormValues((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Resumen del día"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setSummaryOpen(false)}>
              Cerrar
            </Button>
            <Button variant="primary" onClick={() => void handleCopySummary()} disabled={!summary}>
              Copiar
            </Button>
          </div>
        }
      >
        {summaryLoading && !summary ? <Skeleton height="6rem" /> : null}
        {summary ? <pre className={styles.summaryText}>{summary.text}</pre> : null}
      </Modal>

      <Modal
        open={carryOverOpen}
        onClose={() => setCarryOverOpen(false)}
        title="Traer de ayer"
        description="Selecciona ítems no completados del día anterior."
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setCarryOverOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={selectedCarryIds.length === 0 || carryOver.isPending}
              onClick={() =>
                carryOver.mutate(
                  { date: selectedDate, itemIds: selectedCarryIds },
                  { onSuccess: () => setCarryOverOpen(false) },
                )
              }
            >
              Traer seleccionados
            </Button>
          </div>
        }
      >
        <ul className={styles.carryList}>
          {candidates.map((item) => {
            const checked = selectedCarryIds.includes(item.id)
            return (
              <li key={item.id}>
                <Checkbox
                  id={`carry-${item.id}`}
                  checked={checked}
                  onChange={(e) =>
                    setSelectedCarryIds((prev) =>
                      e.target.checked
                        ? [...prev, item.id]
                        : prev.filter((id) => id !== item.id),
                    )
                  }
                  label={`${item.member?.name ?? 'Sin responsable'}: ${item.title}${
                    item.daysInBacklog > 0 ? ` (${item.daysInBacklog}d)` : ''
                  }`}
                />
              </li>
            )
          })}
        </ul>
      </Modal>
    </div>
  )
}
