import { useState } from 'react'
import { Link } from 'react-router'
import type { Habit } from '@/features/habits/types/habit.types'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { useHabitCategoriesQuery, useHabitMeasuresQuery } from '@/features/habits/hooks/useHabits'
import { useUpdateHabitMutation } from '@/features/habits/hooks/useHabits'
import { useHabitPurposesQuery } from '@/features/habits/hooks/useHabitPurposes'
import {
  formatMeasureDisplay,
  formatMeasureLabel,
} from '@/features/habits/utils/habit-measure-form.utils'
import {
  buildHabitEditPayload,
  defaultFormValues,
  readDescription,
  writeDescription,
  proposeIntentionAction,
  type HabitDescriptionState,
  type HabitFormValues,
  type HabitIntention,
} from '@/features/habits/utils/habit-form.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import { Switch } from '@/shared/ui/Switch'
import { Textarea } from '@/shared/ui/Textarea'
import { NewCategoryButton, NewMeasureButton, NewPurposeButton } from './HabitFormStepButtons'
import { HabitIntentionSentence } from './HabitIntentionSentence'
import styles from './HabitFormModal.module.scss'

/** Sin jerga tampoco aquí: las mismas tres frases del wizard. */
const HABIT_TYPE_OPTIONS = [
  { value: 'boolean', label: 'Lo hice o no lo hice' },
  { value: 'count', label: 'Cuento cuánto' },
  { value: 'time', label: 'Mido el tiempo' },
]

type Props = { habit: Habit; open: boolean; onClose: () => void }

/**
 * Editar no es un wizard: es el formulario plano de siempre, con todo a la
 * vista. Lo único que cambia es la descripción, que se descompone en la frase
 * de intención cuando encaja, y se deja intacta cuando no.
 */
export function HabitEditForm({ habit, open, onClose }: Props) {
  const [values, setValues] = useState<HabitFormValues>(() => defaultFormValues(habit))
  const [description, setDescription] = useState<HabitDescriptionState>(() =>
    readDescription(habit.description),
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const [wasOpen, setWasOpen] = useState(open)

  const { data: categories = [] } = useHabitCategoriesQuery()
  const { data: measures = [] } = useHabitMeasuresQuery()
  const { data: purposes = [] } = useHabitPurposesQuery()
  const updateMutation = useUpdateHabitMutation()
  const { confirm } = useConfirmDialog()

  function reset() {
    setValues(defaultFormValues(habit))
    setDescription(readDescription(habit.description))
    setNameError(null)
    updateMutation.reset()
  }

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) reset()
  }

  const hasFollowUps = habit.days > 0
  const isMutating = updateMutation.isPending
  const selectedMeasure = measures.find((m) => m.id === values.measureId) ?? null
  const goalUnitLabel = formatMeasureDisplay(selectedMeasure)

  const categoryOptions = [
    { value: '', label: 'Sin categoría' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const measureOptions = [
    { value: '', label: 'Sin medida' },
    ...measures.map((m) => ({ value: m.id, label: formatMeasureLabel(m) })),
  ]

  const filteredPurposes = purposes.filter((p) =>
    values.shouldAvoid ? p.placement === 'avoid' : p.placement === 'want',
  )
  const purposeOptions = [
    { value: '', label: 'Sin propósito' },
    ...filteredPurposes.map((p) => ({ value: p.id, label: p.name })),
  ]

  function patch(partial: Partial<HabitFormValues>) {
    setValues((prev) => ({ ...prev, ...partial }))
    if (partial.name !== undefined && nameError) setNameError(null)
  }

  function patchIntention(partial: Partial<HabitIntention>) {
    setDescription((prev) => ({ ...prev, intention: { ...prev.intention, ...partial } }))
  }

  /** Convertir texto libre en intención: nunca en silencio. */
  async function handleConvertToIntention() {
    const ok = await confirm({
      title: '¿Convertir la descripción en una intención?',
      description:
        'El texto que tienes ahora se sustituye por la frase «Cuando…, haré… en…». Si prefieres conservarlo, cópialo antes.',
      confirmLabel: 'Convertir',
      cancelLabel: 'Dejarlo como está',
    })
    if (!ok) return

    setDescription({
      mode: 'intention',
      intention: { anchor: '', action: proposeIntentionAction(values, goalUnitLabel), place: '' },
      freeText: '',
    })
  }

  async function handleBackToFreeText() {
    const ok = await confirm({
      title: '¿Volver a una descripción libre?',
      description: 'La frase de intención se sustituye por el texto que escribas.',
      confirmLabel: 'Cambiar',
      cancelLabel: 'Cancelar',
    })
    if (!ok) return
    setDescription({ mode: 'free', intention: description.intention, freeText: '' })
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit() {
    if (!values.name.trim()) {
      setNameError('El nombre es obligatorio.')
      return
    }
    const payload = buildHabitEditPayload(
      { ...values, description: writeDescription(description) },
      habit,
    )
    updateMutation.mutate(payload, { onSuccess: handleClose })
  }

  const footer = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={handleClose} disabled={isMutating}>
        Cancelar
      </Button>
      <Button type="button" onClick={handleSubmit} isLoading={isMutating} disabled={isMutating}>
        Guardar cambios
      </Button>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={handleClose}
      title="Editar hábito"
      description="Todos los campos, a la vista."
      size="lg"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.stepContent}>
        {hasFollowUps ? (
          <p className={styles.lockedNotice}>
            Las fechas y la forma de medirlo no se pueden modificar porque ya hay registros.
          </p>
        ) : null}

        <FormField id="habit-name" label="Nombre" error={nameError}>
          <Input
            id="habit-name"
            value={values.name}
            onChange={(e) => patch({ name: e.target.value })}
            hasError={Boolean(nameError)}
            disabled={isMutating}
          />
        </FormField>

        {description.mode === 'intention' ? (
          <div className={styles.categoryField}>
            <span className={styles.colorLabel}>Tu intención</span>
            <HabitIntentionSentence
              intention={description.intention}
              onChange={patchIntention}
              disabled={isMutating}
            />
            <button
              type="button"
              className={styles.fieldActionLink}
              onClick={() => void handleBackToFreeText()}
            >
              Escribir una descripción libre
            </button>
          </div>
        ) : (
          <div className={styles.categoryField}>
            <FormField id="habit-description" label="Descripción">
              <Textarea
                id="habit-description"
                value={description.freeText}
                onChange={(e) =>
                  setDescription((prev) => ({ ...prev, freeText: e.target.value }))
                }
                placeholder="Opcional"
                rows={3}
                disabled={isMutating}
              />
            </FormField>
            <button
              type="button"
              className={styles.fieldActionLink}
              onClick={() => void handleConvertToIntention()}
            >
              Convertirlo en intención
            </button>
          </div>
        )}

        <Select
          id="habit-type"
          label="Cómo sabes que lo cumpliste"
          options={HABIT_TYPE_OPTIONS}
          value={values.habitType}
          onChange={(v) => patch({ habitType: v as HabitFormValues['habitType'] })}
          disabled={hasFollowUps || isMutating}
        />

        {values.habitType === 'count' ? (
          <div className={styles.categoryField}>
            <FormField id="habit-daily-goal" label={`Objetivo diario (${goalUnitLabel})`}>
              <Input
                id="habit-daily-goal"
                type="number"
                min={1}
                value={values.dailyGoal}
                onChange={(e) => patch({ dailyGoal: e.target.value })}
                disabled={isMutating}
              />
            </FormField>
            <Select
              id="habit-measure"
              label="Medida (opcional)"
              options={measureOptions}
              value={values.measureId}
              onChange={(v) => patch({ measureId: v })}
              disabled={isMutating}
            />
            <div className={styles.categoryActions}>
              <NewMeasureButton disabled={isMutating} onCreated={(id) => patch({ measureId: id })} />
              <Link
                to={habitsPaths.measures}
                className={styles.fieldActionLink}
                onClick={handleClose}
              >
                Gestionar medidas
              </Link>
            </div>
          </div>
        ) : null}

        {values.habitType === 'time' ? (
          <FormField id="habit-timer-goal" label="Objetivo diario (minutos)">
            <Input
              id="habit-timer-goal"
              type="number"
              min={1}
              value={values.timerGoal}
              onChange={(e) => patch({ timerGoal: e.target.value })}
              disabled={isMutating}
            />
          </FormField>
        ) : null}

        <FormField id="habit-icon" label="Icono">
          <IconPicker
            value={values.icon}
            onChange={(icon) => patch({ icon })}
            placeholder="Elegir icono (opcional)"
            clearable
            disabled={isMutating}
          />
        </FormField>

        <div className={styles.colorRow}>
          <label className={styles.colorLabel} htmlFor="habit-color-picker">
            Color
          </label>
          <div className={styles.colorInputs}>
            <input
              type="color"
              id="habit-color-picker"
              className={styles.colorSwatch}
              value={values.color ?? '#10b981'}
              onChange={(e) => patch({ color: e.target.value })}
              disabled={isMutating}
              aria-label="Selector de color"
            />
            <Input
              value={values.color ?? ''}
              onChange={(e) => patch({ color: e.target.value || null })}
              placeholder="#10b981"
              disabled={isMutating}
            />
          </div>
        </div>

        <div className={styles.categoryField}>
          <Select
            id="habit-category"
            label="Categoría"
            options={categoryOptions}
            value={values.categoryId}
            onChange={(v) => patch({ categoryId: v })}
            disabled={isMutating}
          />
          <div className={styles.categoryActions}>
            <NewCategoryButton disabled={isMutating} onCreated={(id) => patch({ categoryId: id })} />
            <Link
              to={habitsPaths.categories}
              className={styles.fieldActionLink}
              onClick={handleClose}
            >
              Gestionar categorías
            </Link>
          </div>
        </div>

        <FormField id="habit-lifelines" label="Salvavidas por semana">
          <Input
            id="habit-lifelines"
            type="number"
            min={0}
            value={values.weeklyLifelines}
            onChange={(e) => patch({ weeklyLifelines: e.target.value })}
            disabled={isMutating}
          />
        </FormField>

        <div className={styles.dateRow}>
          <FormField id="habit-start-date" label="Fecha de inicio">
            <Input
              id="habit-start-date"
              type="date"
              value={values.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
              disabled={hasFollowUps || isMutating}
            />
          </FormField>
          <FormField id="habit-end-date" label="Fecha de fin">
            <Input
              id="habit-end-date"
              type="date"
              value={values.endDate}
              onChange={(e) => patch({ endDate: e.target.value })}
              disabled={hasFollowUps || isMutating}
            />
          </FormField>
        </div>

        <div className={styles.purposeField}>
          {filteredPurposes.length > 0 ? (
            <Select
              id="habit-purpose"
              label="Propósito (opcional)"
              options={purposeOptions}
              value={values.purposeId ?? ''}
              onChange={(v) => patch({ purposeId: v || null })}
              disabled={isMutating}
            />
          ) : (
            <p className={styles.purposeEmpty}>
              No tienes propósitos en «{values.shouldAvoid ? 'Quiero dejar de ser' : 'Quiero ser'}»
              aún.
            </p>
          )}
          <NewPurposeButton
            disabled={isMutating}
            shouldAvoid={values.shouldAvoid}
            onCreated={(id) => patch({ purposeId: id })}
          />
        </div>

        <Switch
          id="habit-should-avoid"
          label="Es algo a evitar"
          checked={values.shouldAvoid}
          onChange={(e) => patch({ shouldAvoid: e.target.checked })}
          disabled={isMutating}
        />

        <Switch
          id="habit-hidden"
          label="Ocultar de la interfaz"
          checked={values.hidden}
          onChange={(e) => patch({ hidden: e.target.checked })}
          disabled={isMutating}
        />
        <p className={styles.privacyHint}>
          Los hábitos ocultos no se muestran cuando «Ocultar hábitos ocultos» está activo en
          Ajustes.
        </p>

        {updateMutation.isError ? (
          <Alert variant="danger">
            No se pudieron guardar los cambios. Revisa la conexión y vuelve a intentarlo.
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
}
