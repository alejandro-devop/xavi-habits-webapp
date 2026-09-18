import type { HabitMeasure, HabitType } from '@/features/habits/types/habit.types'
import { formatMeasureLabel } from '@/features/habits/utils/habit-measure-form.utils'
import type { HabitFormValues } from '@/features/habits/utils/habit-form.utils'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Switch } from '@/shared/ui/Switch'
import { Textarea } from '@/shared/ui/Textarea'
import { NewMeasureButton } from './HabitFormStepButtons'
import { OptionCard } from './HabitWizardControls'
import styles from './HabitCreateWizard.module.scss'

type Props = {
  values: HabitFormValues
  patch: (partial: Partial<HabitFormValues>) => void
  disabled: boolean
  measures: HabitMeasure[]
  measureLabel: string
  pendingMeasureName: string | null
  advancedOpen: boolean
  onToggleAdvanced: () => void
  descriptionMode: 'intention' | 'free'
  freeText: string
  onFreeTextChange: (value: string) => void
  onToggleDescriptionMode: (useFreeText: boolean) => void
}

export function HabitWizardStep2({
  values,
  patch,
  disabled,
  measures,
  measureLabel,
  pendingMeasureName,
  advancedOpen,
  onToggleAdvanced,
  descriptionMode,
  freeText,
  onFreeTextChange,
  onToggleDescriptionMode,
}: Props) {
  const measureOptions = [
    { value: '', label: 'Sin medida' },
    ...measures.map((m) => ({ value: m.id, label: formatMeasureLabel(m) })),
  ]

  const selectType = (habitType: HabitType) => patch({ habitType })

  return (
    <>
      <div className={styles.options} role="group" aria-label="Cómo sabrás que lo cumpliste">
        <OptionCard
          icon="check"
          title="Lo hice o no lo hice"
          text="Un toque y listo. La forma más simple, y la que mejor funciona al principio."
          examples="Meditar · Hacer la cama · Llamar a mamá"
          selected={values.habitType === 'boolean'}
          disabled={disabled}
          onSelect={() => selectType('boolean')}
        />
        <OptionCard
          icon="bars-progress"
          title="Cuento cuánto"
          text="Apuntas una cantidad y hay un objetivo diario."
          examples="2,5 litros de agua · 8.000 pasos · 30 páginas"
          selected={values.habitType === 'count'}
          disabled={disabled}
          onSelect={() => selectType('count')}
        />
        <OptionCard
          icon="stopwatch"
          title="Mido el tiempo"
          text="Apuntas minutos y hay un objetivo diario."
          examples="30 min de guitarra · 45 min de estudio"
          selected={values.habitType === 'time'}
          disabled={disabled}
          onSelect={() => selectType('time')}
        />
      </div>

      {values.habitType === 'count' ? (
        <div className={styles.field}>
          <FormField id="habit-daily-goal" label={`Objetivo diario (${measureLabel})`}>
            <Input
              id="habit-daily-goal"
              type="number"
              min={1}
              value={values.dailyGoal}
              onChange={(e) => patch({ dailyGoal: e.target.value })}
              placeholder="Ej. 8"
              disabled={disabled}
            />
          </FormField>
          <Select
            id="habit-measure"
            label="¿En qué lo cuentas?"
            options={measureOptions}
            value={values.measureId}
            onChange={(v) => patch({ measureId: v })}
            disabled={disabled}
          />
          {pendingMeasureName ? (
            <p className={styles.suggestion}>
              La plantilla sugiere «{pendingMeasureName}» y todavía no la tienes. Créala con un
              toque, o elige otra.
            </p>
          ) : null}
          <NewMeasureButton
            disabled={disabled}
            initialName={pendingMeasureName ?? undefined}
            label={pendingMeasureName ? `+ Crear «${pendingMeasureName}»` : '+ Nueva medida'}
            onCreated={(id) => patch({ measureId: id })}
          />
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
            placeholder="Ej. 30"
            disabled={disabled}
          />
        </FormField>
      ) : null}

      <p className={styles.hint}>
        <span aria-hidden="true">💡</span>
        <span>
          Puedes cambiarlo más adelante sin perder el historial. Si dudas, quédate con{' '}
          <strong>lo hice o no lo hice</strong>.
        </span>
      </p>

      <button
        type="button"
        className={styles.advancedToggle}
        aria-expanded={advancedOpen}
        aria-controls="habit-advanced-panel"
        onClick={onToggleAdvanced}
      >
        <span aria-hidden="true">⚙️</span>
        Ajustes avanzados — fechas de inicio y fin, ocultar de la interfaz
        <span className={styles.advancedCaret} aria-hidden="true">
          {advancedOpen ? '▴' : '▾'}
        </span>
      </button>

      {advancedOpen ? (
        <div className={styles.advancedPanel} id="habit-advanced-panel">
          <div className={styles.dateRow}>
            <FormField id="habit-start-date" label="Fecha de inicio">
              <Input
                id="habit-start-date"
                type="date"
                value={values.startDate}
                onChange={(e) => patch({ startDate: e.target.value })}
                disabled={disabled}
              />
            </FormField>
            <FormField id="habit-end-date" label="Fecha de fin">
              <Input
                id="habit-end-date"
                type="date"
                value={values.endDate}
                onChange={(e) => patch({ endDate: e.target.value })}
                disabled={disabled}
              />
            </FormField>
          </div>

          <Switch
            id="habit-hidden"
            label="Ocultar de la interfaz"
            checked={values.hidden}
            onChange={(e) => patch({ hidden: e.target.checked })}
            disabled={disabled}
          />

          <Switch
            id="habit-free-description"
            label="Escribir una descripción libre en vez de la frase de intención"
            description="Solo puede haber una de las dos: la que elijas es la que se guarda."
            checked={descriptionMode === 'free'}
            onChange={(e) => onToggleDescriptionMode(e.target.checked)}
            disabled={disabled}
          />

          {descriptionMode === 'free' ? (
            <FormField id="habit-description" label="Descripción">
              <Textarea
                id="habit-description"
                value={freeText}
                onChange={(e) => onFreeTextChange(e.target.value)}
                placeholder="Opcional"
                rows={3}
                disabled={disabled}
              />
            </FormField>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
