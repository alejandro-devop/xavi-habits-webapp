import { useRef, useState } from 'react'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Modal } from '@/shared/ui/Modal/Modal'
import { Button } from '@/shared/ui/Button/Button'
import {
  useTodoFoldersQuery,
  useTodoTagsQuery,
  useUpdateTodoTagMutation,
  useRemoveTodoTagMutation,
  useUpdateTodoFolderMutation,
  useRemoveTodoFolderMutation,
  useTodoDailyTemplatesQuery,
  useCreateTodoDailyTemplateMutation,
  useUpdateTodoDailyTemplateMutation,
  useRemoveTodoDailyTemplateMutation,
} from '@/features/todos/hooks/useTodos'
import type { TodoDailyTemplate, TodoFolder, TodoPriority, TodoTag } from '@/features/todos/types/todo.types'
import styles from './TodosSettings.module.scss'

const TAG_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#A855F7',
]

const FOLDER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

type ColorPickerProps = {
  colors: string[]
  current: string
  onChange: (color: string) => void
}

function ColorPicker({ colors, current, onChange }: ColorPickerProps) {
  return (
    <div className={styles.colorPicker}>
      {colors.map((c) => (
        <span
          key={c}
          className={[styles.swatch, c === current ? styles.active : ''].join(' ')}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}

type TagRowProps = {
  tag: TodoTag
  pickerOpen: boolean
  onTogglePicker: () => void
}

function TagRow({ tag, pickerOpen, onTogglePicker }: TagRowProps) {
  const updateTag = useUpdateTodoTagMutation()
  const removeTag = useRemoveTodoTagMutation()
  const { confirm } = useConfirmDialog()
  const [name, setName] = useState(tag.name)

  const commitName = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === tag.name) { setName(tag.name); return }
    updateTag.mutate({ id: tag.id, name: trimmed })
  }

  const handleColorChange = (color: string) => {
    updateTag.mutate({ id: tag.id, color })
    onTogglePicker()
  }

  const handleRemove = () => {
    void confirm({
      title: `¿Eliminar etiqueta "${tag.name}"?`,
      description: 'Se quitará de todas las tareas que la usen.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: () => removeTag.mutate(tag.id),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className={styles.item}>
        <button
          type="button"
          className={styles.colorBtn}
          style={{ background: tag.color }}
          onClick={onTogglePicker}
          aria-label="Cambiar color"
        />
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          maxLength={25}
        />
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => void handleRemove()}
          aria-label={`Eliminar etiqueta ${tag.name}`}
        >
          ×
        </button>
      </div>
      {pickerOpen ? (
        <ColorPicker colors={TAG_COLORS} current={tag.color} onChange={handleColorChange} />
      ) : null}
    </div>
  )
}

type FolderRowProps = {
  folder: TodoFolder
  pickerOpen: boolean
  onTogglePicker: () => void
}

function FolderRow({ folder, pickerOpen, onTogglePicker }: FolderRowProps) {
  const updateFolder = useUpdateTodoFolderMutation()
  const removeFolder = useRemoveTodoFolderMutation()
  const { confirm } = useConfirmDialog()
  const [name, setName] = useState(folder.name)

  const commitName = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === folder.name) { setName(folder.name); return }
    updateFolder.mutate({ id: folder.id, name: trimmed })
  }

  const handleColorChange = (color: string) => {
    updateFolder.mutate({ id: folder.id, color })
    onTogglePicker()
  }

  const handleRemove = () => {
    void confirm({
      title: `¿Eliminar carpeta "${folder.name}"?`,
      description: 'Las tareas dentro no se eliminarán, solo quedarán sin carpeta.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: () => removeFolder.mutate(folder.id),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className={styles.item}>
        <button
          type="button"
          className={styles.colorBtn}
          style={{ background: folder.color }}
          onClick={onTogglePicker}
          aria-label="Cambiar color"
        />
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          maxLength={100}
        />
        {folder.todoCount > 0 ? (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            {folder.todoCount} tarea{folder.todoCount !== 1 ? 's' : ''}
          </span>
        ) : null}
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => void handleRemove()}
          aria-label={`Eliminar carpeta ${folder.name}`}
        >
          ×
        </button>
      </div>
      {pickerOpen ? (
        <ColorPicker colors={FOLDER_COLORS} current={folder.color} onChange={handleColorChange} />
      ) : null}
    </div>
  )
}

// ─── Days helpers ─────────────────────────────────────────────────────────────

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_LABELS: Record<number, string> = { 0: 'D', 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S' }

function DaysChips({ days }: { days: number[] }) {
  return (
    <div className={styles.daysRow}>
      {DAY_ORDER.map((d) => (
        <span key={d} className={[styles.dayChip, days.includes(d) ? styles.dayChipActive : ''].join(' ')}>
          {DAY_LABELS[d]}
        </span>
      ))}
    </div>
  )
}

function DaysPicker({
  selected,
  onChange,
}: {
  selected: number[]
  onChange: (days: number[]) => void
}) {
  const toggle = (day: number) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day))
    } else {
      onChange([...selected, day])
    }
  }
  return (
    <div className={styles.daysRow}>
      {DAY_ORDER.map((d) => (
        <button
          key={d}
          type="button"
          className={[styles.dayChip, selected.includes(d) ? styles.dayChipActive : ''].join(' ')}
          onClick={() => toggle(d)}
        >
          {DAY_LABELS[d]}
        </button>
      ))}
    </div>
  )
}

// ─── Template form modal (create + edit) ─────────────────────────────────────

const PRIORITY_LABELS: Record<TodoPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

type TemplateFormModalProps = {
  open: boolean
  onClose: () => void
  folders: TodoFolder[]
  template?: TodoDailyTemplate
}

function TemplateFormModal({ open, onClose, folders, template }: TemplateFormModalProps) {
  const createTemplate = useCreateTodoDailyTemplateMutation()
  const updateTemplate = useUpdateTodoDailyTemplateMutation()
  const isEdit = Boolean(template)

  const [title, setTitle] = useState(template?.title ?? '')
  const [priority, setPriority] = useState<TodoPriority>(template?.priority ?? 'medium')
  const [folderId, setFolderId] = useState<string>(template?.folderId ?? '')
  const [days, setDays] = useState<number[]>(template?.days ?? [1, 2, 3, 4, 5])

  // Sync fields when template changes (e.g. reopening for a different item)
  const prevTemplateId = useRef(template?.id)
  if (template?.id !== prevTemplateId.current) {
    prevTemplateId.current = template?.id
    setTitle(template?.title ?? '')
    setPriority(template?.priority ?? 'medium')
    setFolderId(template?.folderId ?? '')
    setDays(template?.days ?? [1, 2, 3, 4, 5])
  }

  const isPending = createTemplate.isPending || updateTemplate.isPending

  const handleClose = () => {
    onClose()
  }

  const handleSave = () => {
    const trimmed = title.trim()
    if (!trimmed || days.length === 0) return

    if (isEdit && template) {
      updateTemplate.mutate(
        { id: template.id, title: trimmed, priority, folderId: folderId || null, days },
        { onSuccess: handleClose },
      )
    } else {
      createTemplate.mutate(
        { title: trimmed, priority, folderId: folderId || null, days },
        { onSuccess: handleClose },
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar actividad' : 'Nueva actividad diaria'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!title.trim() || days.length === 0 || isPending}
          >
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <label className={styles.fieldLabel}>Título</label>
        <input
          className={styles.modalInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          placeholder="Ej. Meditación, Ejercicio…"
          maxLength={200}
          autoFocus
        />

        <label className={styles.fieldLabel}>Prioridad</label>
        <select
          className={styles.modalSelect}
          value={priority}
          onChange={(e) => setPriority(e.target.value as TodoPriority)}
        >
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>

        {folders.length > 0 ? (
          <>
            <label className={styles.fieldLabel}>Carpeta</label>
            <select
              className={styles.modalSelect}
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">Sin carpeta</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </>
        ) : null}

        <label className={styles.fieldLabel}>Días de la semana</label>
        <DaysPicker selected={days} onChange={setDays} />
        {days.length === 0 ? (
          <span className={styles.fieldError}>Selecciona al menos un día</span>
        ) : null}
      </div>
    </Modal>
  )
}

// ─── Template row ─────────────────────────────────────────────────────────────

type TemplateRowProps = {
  template: TodoDailyTemplate
  folderName?: string
  folders: TodoFolder[]
}

function TemplateRow({ template, folderName, folders }: TemplateRowProps) {
  const removeTemplate = useRemoveTodoDailyTemplateMutation()
  const { confirm } = useConfirmDialog()
  const [showEdit, setShowEdit] = useState(false)

  const handleRemove = () => {
    void confirm({
      title: `¿Eliminar "${template.title}"?`,
      description: 'Se eliminará de tu rutina diaria.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: () => removeTemplate.mutate(template.id),
    })
  }

  return (
    <>
      <div className={styles.templateCard}>
        <div className={styles.item}>
          <span className={styles.templateTitle}>{template.title}</span>
          <span className={styles.priorityChip}>{PRIORITY_LABELS[template.priority]}</span>
          {folderName ? <span className={styles.folderLabel}>{folderName}</span> : null}
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => setShowEdit(true)}
            aria-label={`Editar ${template.title}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => void handleRemove()}
            aria-label={`Eliminar ${template.title}`}
          >
            ×
          </button>
        </div>
        <div className={styles.daysPreview}>
          <DaysChips days={template.days} />
        </div>
      </div>

      <TemplateFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        folders={folders}
        template={template}
      />
    </>
  )
}

export function TodosSettings() {
  const { data: tags = [] } = useTodoTagsQuery()
  const { data: folders = [] } = useTodoFoldersQuery()
  const { data: templates = [] } = useTodoDailyTemplatesQuery()
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false)

  const togglePicker = (id: string) =>
    setOpenPickerId((prev) => (prev === id ? null : id))

  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f.name]))

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <span className={styles.sectionTitle}>Carpetas</span>
        <div className={styles.list}>
          {folders.length === 0 ? (
            <p className={styles.empty}>Sin carpetas creadas.</p>
          ) : (
            folders.map((folder) => (
              <FolderRow
                key={folder.id}
                folder={folder}
                pickerOpen={openPickerId === `folder-${folder.id}`}
                onTogglePicker={() => togglePicker(`folder-${folder.id}`)}
              />
            ))
          )}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.sectionTitle}>Etiquetas</span>
        <div className={styles.list}>
          {tags.length === 0 ? (
            <p className={styles.empty}>Sin etiquetas creadas.</p>
          ) : (
            tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                pickerOpen={openPickerId === `tag-${tag.id}`}
                onTogglePicker={() => togglePicker(`tag-${tag.id}`)}
              />
            ))
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Mi Rutina Diaria</span>
          <Button variant="ghost" size="sm" onClick={() => setShowNewTemplateModal(true)}>
            + Nueva actividad
          </Button>
        </div>
        <div className={styles.list}>
          {templates.length === 0 ? (
            <p className={styles.empty}>Sin actividades configuradas.</p>
          ) : (
            templates.map((template) => (
              <TemplateRow
                key={template.id}
                template={template}
                folderName={template.folderId ? folderMap[template.folderId] : undefined}
                folders={folders}
              />
            ))
          )}
        </div>
      </section>

      <TemplateFormModal
        open={showNewTemplateModal}
        onClose={() => setShowNewTemplateModal(false)}
        folders={folders}
      />
    </div>
  )
}
