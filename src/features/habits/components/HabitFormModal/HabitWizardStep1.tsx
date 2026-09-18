import type { HabitTemplate } from '@/features/habits/data/habit-templates'
import { HABIT_TEMPLATES } from '@/features/habits/data/habit-templates'
import { HabitColorPicker } from '@/features/habits/components/HabitColorPicker'
import type { HabitCategory } from '@/features/habits/types/habit.types'
import type { HabitFormValues } from '@/features/habits/utils/habit-form.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { FormField } from '@/shared/ui/FormField'
import { IconPicker } from '@/shared/ui/IconPicker'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { NewCategoryButton } from './HabitFormStepButtons'
import { OptionCard } from './HabitWizardControls'
import styles from './HabitCreateWizard.module.scss'

type Props = {
  values: HabitFormValues
  patch: (partial: Partial<HabitFormValues>) => void
  nameError: string | null
  disabled: boolean
  categories: HabitCategory[]
  /** Nombre que sugiere la plantilla y que el usuario todavía no tiene. */
  pendingCategoryName: string | null
  onApplyTemplate: (template: HabitTemplate) => void
}

export function HabitWizardStep1({
  values,
  patch,
  nameError,
  disabled,
  categories,
  pendingCategoryName,
  onApplyTemplate,
}: Props) {
  const categoryOptions = [
    { value: '', label: 'Sin categoría' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

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
          <IconPicker
            value={values.icon}
            onChange={(icon) => patch({ icon })}
            placeholder="Elegir icono"
            clearable
            disabled={disabled}
          />
        </div>
      </div>

      {/*
        El color viene sorteado: aquí solo se cambia si no gusta. Ocho muestras
        en su propia fila, que junto al nombre y al icono no cabían a 375px.
      */}
      <div className={styles.field}>
        <span className={styles.label}>
          Color <span className={styles.labelHint}>· ya te elegimos uno</span>
        </span>
        <HabitColorPicker
          value={values.color}
          onChange={(color) => patch({ color })}
          disabled={disabled}
          label="Color del hábito"
        />
      </div>

      {/*
        La categoría vivía plegada en «Ajustes avanzados» del paso 2 y era muy
        fácil pasarla por alto creando el primer hábito. Sube aquí, junto al
        nombre, que es donde se la busca. Sigue siendo opcional.
      */}
      <div className={styles.field}>
        <Select
          id="habit-category"
          label="Categoría"
          options={categoryOptions}
          value={values.categoryId}
          onChange={(v) => patch({ categoryId: v })}
          disabled={disabled}
        />
        {pendingCategoryName ? (
          <p className={styles.suggestion}>
            La plantilla sugiere «{pendingCategoryName}» y todavía no la tienes.
          </p>
        ) : null}
        <NewCategoryButton
          disabled={disabled}
          initialName={pendingCategoryName ?? undefined}
          label={pendingCategoryName ? `+ Crear «${pendingCategoryName}»` : '+ Nueva categoría'}
          onCreated={(id) => patch({ categoryId: id })}
        />
      </div>
    </>
  )
}
