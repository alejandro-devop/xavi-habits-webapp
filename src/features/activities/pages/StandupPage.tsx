import { useEffect, useMemo, useState } from 'react'
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
  { value: 'completed', label: 'Completada' },
]

const STATUS_BADGE: Record<StandupItemStatus, 'neutral' | 'primary' | 'success'> = {
  pending: 'neutral',
  in_progress: 'primary',
  completed: 'success',
}

const emptyForm = (memberId = ''): StandupItemFormValues => ({
  title: '',
  notes: '',
  ticketNumber: '',
  memberId,
  status: 'in_progress',
})

export function StandupPage() {
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const today = getCurrentLocalDate()
  const [selectedDate, setSelectedDate] = useState(today)
  const [memberName, setMemberName] = useState('')
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StandupItem | null>(null)
  const [formValues, setFormValues] = useState<StandupItemFormValues>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [carryOverOpen, setCarryOverOpen] = useState(false)
  const [selectedCarryIds, setSelectedCarryIds] = useState<string[]>([])

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
    return [...map.entries()].map(([memberId, memberItems]) => ({
      memberId,
      memberName:
        members.find((m) => m.id === memberId)?.name ??
        memberItems[0]?.member?.name ??
        'Sin responsable',
      items: memberItems,
    }))
  }, [items, members])

  useEffect(() => {
    if (carryOverOpen) {
      setSelectedCarryIds(candidates.map((c) => c.id))
    }
  }, [carryOverOpen, candidates])

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

    if (editingItem) {
      updateItem.mutate(
        {
          id: editingItem.id,
          title: formValues.title.trim(),
          notes: formValues.notes.trim() || null,
          ticketNumber: formValues.ticketNumber.trim() || null,
          memberId: formValues.memberId,
          status: formValues.status,
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
      },
      { onSuccess: () => setItemModalOpen(false) },
    )
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

      {itemsByMember.map((group) => (
        <section key={group.memberId} className={styles.group}>
          <h3 className={styles.groupTitle}>{group.memberName}</h3>
          <ul className={styles.itemList}>
            {group.items.map((item) => (
              <li key={item.id} className={styles.item}>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Eliminar entrada',
                          description: `¿Eliminar “${item.title}”?`,
                          confirmLabel: 'Eliminar',
                          variant: 'danger',
                        })
                        if (ok) deleteItem.mutate(item.id)
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

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
