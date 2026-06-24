import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Habit } from '@/features/habits/types/habit.types'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import {
  buildHabitCreatePayload,
  buildHabitEditPayload,
  defaultFormValues,
  type HabitFormValues,
} from '@/features/habits/utils/habit-form.utils'
import {
  useCreateHabitMutation,
  useHabitCategoriesQuery,
  useHabitMeasuresQuery,
  useUpdateHabitMutation,
} from '@/features/habits/hooks/useHabits'
import { useHabitPurposesQuery } from '@/features/habits/hooks/useHabitPurposes'
import { CreateHabitCategoryStep } from '@/features/habits/components/CreateHabitCategoryStep'
import { CreateHabitMeasureStep } from '@/features/habits/components/CreateHabitMeasureStep'
import { CreateHabitPurposeStep } from '@/features/habits/components/CreateHabitPurposeStep'
import { formatMeasureDisplay, formatMeasureLabel } from '@/features/habits/utils/habit-measure-form.utils'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import { Select } from '@/shared/ui/Select'
import { Switch } from '@/shared/ui/Switch'
import { IconPicker } from '@/shared/ui/IconPicker'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import styles from './HabitFormModal.module.scss'

export type HabitFormModalProps =
  | { mode: 'create'; habit?: undefined; open: boolean; onClose: () => void }
  | { mode: 'edit'; habit: Habit; open: boolean; onClose: () => void }

const HABIT_TYPE_OPTIONS = [
  { value: 'boolean', label: 'Sí / No' },
  { value: 'count', label: 'Contador' },
  { value: 'time', label: 'Tiempo' },
]

// Must be rendered inside SteppedModal to access ModalStepContext
function NewCategoryButton({
  disabled,
  onCreated,
}: {
  disabled: boolean
  onCreated: (categoryId: string) => void
}) {
  const { push } = useModalStep()

  return (
    <button
      type="button"
      className={styles.fieldActionLink}
      disabled={disabled}
      onClick={() =>
        push({
          title: 'Nueva categoría',
          description: 'Añade una categoría para organizar este hábito.',
          content: <CreateHabitCategoryStep onCreated={onCreated} />,
        })
      }
    >
      + Nueva categoría
    </button>
  )
}

function NewPurposeButton({
  disabled,
  shouldAvoid,
  onCreated,
}: {
  disabled: boolean
  shouldAvoid: boolean
  onCreated: (purposeId: string) => void
}) {
  const { push } = useModalStep()
  const placement = shouldAvoid ? 'avoid' : 'want'

  return (
    <button
      type="button"
      className={styles.fieldActionLink}
      disabled={disabled}
      onClick={() =>
        push({
          title: 'Nuevo propósito',
          description: 'Crea un propósito y asígnalo a este hábito.',
          content: <CreateHabitPurposeStep placement={placement} onCreated={onCreated} />,
        })
      }
    >
      + Nuevo propósito
    </button>
  )
}

function NewMeasureButton({
  disabled,
  onCreated,
}: {
  disabled: boolean
  onCreated: (measureId: string) => void
}) {
  const { push } = useModalStep()

  return (
    <button
      type="button"
      className={styles.fieldActionLink}
      disabled={disabled}
      onClick={() =>
        push({
          title: 'Nueva medida',
          description: 'Crea una unidad para este hábito (vasos, km, páginas…).',
          content: <CreateHabitMeasureStep onCreated={onCreated} />,
        })
      }
    >
      + Nueva medida
    </button>
  )
}

export function HabitFormModal({ mode, habit, open, onClose }: HabitFormModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [values, setValues] = useState<HabitFormValues>(() => defaultFormValues(habit))
  const [nameError, setNameError] = useState<string | null>(null)

  const { data: categories = [] } = useHabitCategoriesQuery()
  const { data: measures = [] } = useHabitMeasuresQuery()
  const { data: purposes = [] } = useHabitPurposesQuery()
  const createMutation = useCreateHabitMutation()
  const updateMutation = useUpdateHabitMutation()

  useEffect(() => {
    if (open) {
      setValues(defaultFormValues(habit))
      setNameError(null)
      setStep(1)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasFollowUps = mode === 'edit' && habit.days > 0
  const isMutating = createMutation.isPending || updateMutation.isPending

  const patch = (partial: Partial<HabitFormValues>) => {
    setValues((prev) => ({ ...prev, ...partial }))
    if (partial.name !== undefined && nameError) setNameError(null)
  }

  const categoryOptions = [
    { value: '', label: 'Sin categoría' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const measureOptions = [
    { value: '', label: 'Sin medida' },
    ...measures.map((m) => ({ value: m.id, label: formatMeasureLabel(m) })),
  ]

  const selectedMeasure = measures.find((m) => m.id === values.measureId) ?? null
  const goalUnitLabel = formatMeasureDisplay(selectedMeasure)

  function handleClose() {
    setValues(defaultFormValues(habit))
    setNameError(null)
    setStep(1)
    onClose()
  }

  function handleGoToStep2() {
    if (!values.name.trim()) {
      setNameError('El nombre es obligatorio.')
      return
    }
    setStep(2)
  }

  function handleSubmit() {
    if (mode === 'create') {
      const payload = buildHabitCreatePayload(values)
      createMutation.mutate(payload, { onSuccess: handleClose })
    } else {
      const payload = buildHabitEditPayload(values, habit)
      updateMutation.mutate(payload, { onSuccess: handleClose })
    }
  }

  const STEP_META = {
    1: { title: 'Datos básicos', description: 'Nombre y tipo del hábito.' },
    2: { title: 'Apariencia', description: 'Personaliza el aspecto y categoría.' },
    3: { title: 'Configuración', description: 'Define fechas, salvavidas y meta diaria.' },
  }

  const step1Content = (
    <div className={styles.stepContent}>
      {hasFollowUps && (
        <p className={styles.lockedNotice}>
          Las fechas y el tipo no se pueden modificar porque ya hay registros.
        </p>
      )}
      <FormField id="habit-name" label="Nombre" error={nameError}>
        <Input
          id="habit-name"
          value={values.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Ej. Meditar 10 minutos"
          hasError={Boolean(nameError)}
          autoFocus
          disabled={isMutating}
        />
      </FormField>
      <FormField id="habit-description" label="Descripción">
        <Textarea
          id="habit-description"
          value={values.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Opcional"
          rows={2}
          disabled={isMutating}
        />
      </FormField>
      <Select
        id="habit-type"
        label="Tipo"
        options={HABIT_TYPE_OPTIONS}
        value={values.habitType}
        onChange={(v) => patch({ habitType: v as HabitFormValues['habitType'] })}
        disabled={hasFollowUps || isMutating}
      />
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
        Los hábitos ocultos no se muestran cuando «Ocultar hábitos ocultos» está activo en Ajustes.
      </p>
    </div>
  )

  const step2Content = (
    <div className={styles.stepContent}>
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
            value={values.color ?? '#6366f1'}
            onChange={(e) => patch({ color: e.target.value })}
            disabled={isMutating}
            aria-label="Selector de color"
          />
          <Input
            value={values.color ?? ''}
            onChange={(e) => patch({ color: e.target.value || null })}
            placeholder="#6366f1"
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
          <NewCategoryButton
            disabled={isMutating}
            onCreated={(id) => patch({ categoryId: id })}
          />
          <Link
            to={habitsPaths.categories}
            className={styles.fieldActionLink}
            onClick={handleClose}
          >
            Gestionar categorías
          </Link>
        </div>
      </div>
      {values.habitType !== 'boolean' && (
        <div className={styles.categoryField}>
          <Select
            id="habit-measure"
            label="Medida (opcional)"
            options={measureOptions}
            value={values.measureId}
            onChange={(v) => patch({ measureId: v })}
            disabled={isMutating}
          />
          <div className={styles.categoryActions}>
            <NewMeasureButton
              disabled={isMutating}
              onCreated={(id) => patch({ measureId: id })}
            />
            <Link
              to={habitsPaths.measures}
              className={styles.fieldActionLink}
              onClick={handleClose}
            >
              Gestionar medidas
            </Link>
          </div>
        </div>
      )}
    </div>
  )

  const filteredPurposes = purposes.filter((p) =>
    values.shouldAvoid ? p.placement === 'avoid' : p.placement === 'want',
  )
  const purposeColumnLabel = values.shouldAvoid ? 'Quiero dejar de ser' : 'Quiero ser'

  const purposeOptions = [
    { value: '', label: 'Sin propósito' },
    ...filteredPurposes.map((p) => ({
      value: p.id,
      label: p.icon ? `${p.icon} ${p.name}` : p.name,
    })),
  ]

  const step3Content = (
    <div className={styles.stepContent}>
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
      {values.habitType === 'count' && (
        <FormField id="habit-daily-goal" label={`Meta diaria (${goalUnitLabel})`}>
          <Input
            id="habit-daily-goal"
            type="number"
            min={1}
            value={values.dailyGoal}
            onChange={(e) => patch({ dailyGoal: e.target.value })}
            placeholder="Ej. 5"
            disabled={isMutating}
          />
        </FormField>
      )}
      {values.habitType === 'time' && (
        <FormField id="habit-timer-goal" label="Meta diaria (minutos)">
          <Input
            id="habit-timer-goal"
            type="number"
            min={1}
            value={values.timerGoal}
            onChange={(e) => patch({ timerGoal: e.target.value })}
            placeholder="Ej. 30"
            disabled={isMutating}
          />
        </FormField>
      )}
      {hasFollowUps && (
        <p className={styles.lockedNotice}>
          Las fechas y el tipo no se pueden modificar porque ya hay registros.
        </p>
      )}
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
            No tienes propósitos en &quot;{purposeColumnLabel}&quot; aún.
          </p>
        )}
        <NewPurposeButton
          disabled={isMutating}
          shouldAvoid={values.shouldAvoid}
          onCreated={(id) => patch({ purposeId: id })}
        />
      </div>
    </div>
  )

  const footer1 = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={handleClose} disabled={isMutating}>
        Cancelar
      </Button>
      <Button type="button" onClick={handleGoToStep2} disabled={isMutating}>
        Siguiente →
      </Button>
    </div>
  )

  const footer2 = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={isMutating}>
        ← Anterior
      </Button>
      <Button type="button" onClick={() => setStep(3)} disabled={isMutating}>
        Siguiente →
      </Button>
    </div>
  )

  const footer3 = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={() => setStep(2)} disabled={isMutating}>
        ← Anterior
      </Button>
      <Button type="button" onClick={handleSubmit} isLoading={isMutating} disabled={isMutating}>
        {mode === 'create' ? 'Crear hábito' : 'Guardar cambios'}
      </Button>
    </div>
  )

  const currentContent = step === 1 ? step1Content : step === 2 ? step2Content : step3Content
  const currentFooter = step === 1 ? footer1 : step === 2 ? footer2 : footer3
  const { title, description } = STEP_META[step]

  return (
    <SteppedModal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      size="lg"
      footer={currentFooter}
    >
      {currentContent}
    </SteppedModal>
  )
}
