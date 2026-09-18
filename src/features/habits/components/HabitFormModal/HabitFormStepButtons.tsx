import { CreateHabitCategoryStep } from '@/features/habits/components/CreateHabitCategoryStep'
import { CreateHabitMeasureStep } from '@/features/habits/components/CreateHabitMeasureStep'
import { CreateHabitPurposeStep } from '@/features/habits/components/CreateHabitPurposeStep'
import { useModalStep } from '@/shared/ui/SteppedModal'
import styles from './HabitFormStepButtons.module.scss'

// Estos botones tienen que renderizarse dentro de un SteppedModal: leen el
// contexto de pasos para apilar el formulario de creación al vuelo.

type NewCategoryButtonProps = {
  disabled: boolean
  onCreated: (categoryId: string) => void
  /** Nombre sugerido por una plantilla: el paso abre ya escrito. */
  initialName?: string
  label?: string
}

export function NewCategoryButton({
  disabled,
  onCreated,
  initialName,
  label = '+ Nueva categoría',
}: NewCategoryButtonProps) {
  const { push } = useModalStep()

  return (
    <button
      type="button"
      className={styles.link}
      disabled={disabled}
      onClick={() =>
        push({
          title: 'Nueva categoría',
          description: 'Añade una categoría para organizar este hábito.',
          content: <CreateHabitCategoryStep initialName={initialName} onCreated={onCreated} />,
        })
      }
    >
      {label}
    </button>
  )
}

type NewPurposeButtonProps = {
  disabled: boolean
  shouldAvoid: boolean
  onCreated: (purposeId: string) => void
  children?: string
  /** Para pintarlo como píldora en lugar de enlace. */
  className?: string
}

export function NewPurposeButton({
  disabled,
  shouldAvoid,
  onCreated,
  children = '+ Nuevo propósito',
  className,
}: NewPurposeButtonProps) {
  const { push } = useModalStep()
  const placement = shouldAvoid ? 'avoid' : 'want'

  return (
    <button
      type="button"
      className={className ?? styles.link}
      disabled={disabled}
      onClick={() =>
        push({
          title: 'Nuevo propósito',
          description: 'Crea un propósito y asígnalo a este hábito.',
          content: <CreateHabitPurposeStep placement={placement} onCreated={onCreated} />,
        })
      }
    >
      {children}
    </button>
  )
}

type NewMeasureButtonProps = {
  disabled: boolean
  onCreated: (measureId: string) => void
  /** Nombre sugerido por una plantilla: el paso abre ya escrito. */
  initialName?: string
  label?: string
}

export function NewMeasureButton({
  disabled,
  onCreated,
  initialName,
  label = '+ Nueva medida',
}: NewMeasureButtonProps) {
  const { push } = useModalStep()

  return (
    <button
      type="button"
      className={styles.link}
      disabled={disabled}
      onClick={() =>
        push({
          title: 'Nueva medida',
          description: 'Crea una unidad para este hábito (vasos, km, páginas…).',
          content: <CreateHabitMeasureStep initialName={initialName} onCreated={onCreated} />,
        })
      }
    >
      {label}
    </button>
  )
}
