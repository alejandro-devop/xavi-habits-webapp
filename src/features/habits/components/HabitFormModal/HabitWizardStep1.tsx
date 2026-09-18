import type { HabitTemplate } from '@/features/habits/data/habit-templates'
import { HABIT_TEMPLATES } from '@/features/habits/data/habit-templates'
import type { HabitFormValues } from '@/features/habits/utils/habit-form.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { OptionCard } from './HabitWizardControls'
import styles from './HabitCreateWizard.module.scss'

type Props = {
  values: HabitFormValues
  patch: (partial: Partial<HabitFormValues>) => void
  nameError: string | null
  disabled: boolean
  onApplyTemplate: (template: HabitTemplate) => void
}

export function HabitWizardStep1({ values, patch, nameError, disabled, onApplyTemplate }: Props) {
  return (
    <>
      <div className={[styles.options, styles.optionsTwo].join(' ')}>
        <OptionCard
          icon="seedling"
          title="Construir algo nuevo"
          text="Algo que quieres hacer más a menudo."
          examples="Meditar, leer, salir a caminar"
          selected={!values.shouldAvoid}
          disabled={disabled}
          onSelect={() => patch({ shouldAvoid: false })}
        />
        <OptionCard
          icon="xmark"
          title="Dejar algo atrás"
          text="Algo que quieres hacer menos, o nada."
          examples="Redes por la mañana, azúcar, fumar"
          selected={values.shouldAvoid}
          tone="avoid"
          disabled={disabled}
          onSelect={() => patch({ shouldAvoid: true })}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label} id="habit-templates-label">
          Elige un punto de partida, o escríbelo tú
        </span>
        <div className={styles.templates} role="group" aria-labelledby="habit-templates-label">
          {HABIT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={styles.template}
              disabled={disabled}
              onClick={() => onApplyTemplate(template)}
            >
              <span className={styles.templateIcon} aria-hidden="true">
                <AppIcon name={template.icon ?? 'star'} />
              </span>
              <span className={styles.templateName}>{template.name}</span>
              <span className={styles.templateMeta}>{template.summary}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.identityRow}>
        <FormField id="habit-name" label="O dale un nombre" error={nameError}>
          <Input
            id="habit-name"
            value={values.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Ej. Meditación matutina"
            hasError={Boolean(nameError)}
            disabled={disabled}
          />
        </FormField>

        <div className={styles.colorField}>
          <input
            type="color"
            id="habit-color-picker"
            className={styles.colorSwatch}
            value={values.color ?? '#10b981'}
            onChange={(e) => patch({ color: e.target.value })}
            disabled={disabled}
            aria-label="Color del hábito"
          />
          <IconPicker
            value={values.icon}
            onChange={(icon) => patch({ icon })}
            placeholder="Elegir icono"
            clearable
            disabled={disabled}
          />
        </div>
      </div>
    </>
  )
}
