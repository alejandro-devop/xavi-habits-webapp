import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import type { HabitFormValues, HabitIntention } from '@/features/habits/utils/habit-form.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { FormField } from '@/shared/ui/FormField'
import { Textarea } from '@/shared/ui/Textarea'
import { NewPurposeButton } from './HabitFormStepButtons'
import { Chip } from './HabitWizardControls'
import { HabitIntentionSentence } from './HabitIntentionSentence'
import styles from './HabitCreateWizard.module.scss'

const LIFELINE_OPTIONS = [
  { value: '0', label: 'Ninguno' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
]

type Props = {
  values: HabitFormValues
  patch: (partial: Partial<HabitFormValues>) => void
  intention: HabitIntention
  onIntentionChange: (partial: Partial<HabitIntention>) => void
  purposes: HabitPurpose[]
  disabled: boolean
  descriptionMode: 'intention' | 'free'
  freeText: string
  onFreeTextChange: (value: string) => void
  onUseIntention: () => void
}

export function HabitWizardStep3({
  values,
  patch,
  intention,
  onIntentionChange,
  purposes,
  disabled,
  descriptionMode,
  freeText,
  onFreeTextChange,
  onUseIntention,
}: Props) {
  return (
    <>
      <p className={styles.guide}>
        Tómate diez segundos antes de responder. Imagina mañana: ¿qué estás haciendo justo{' '}
        <em>antes</em> de este hábito? Ese momento que ya existe en tu día es el ancla — el primer
        café, cerrar el portátil, apagar la luz. Engancha el hábito ahí y dejas de depender de
        acordarte.
      </p>

      {descriptionMode === 'intention' ? (
        <HabitIntentionSentence
          intention={intention}
          onChange={onIntentionChange}
          disabled={disabled}
        />
      ) : (
        <div className={styles.field}>
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
          <button type="button" className={styles.fieldActionLink} onClick={onUseIntention}>
            Usar la frase de intención en su lugar
          </button>
        </div>
      )}

      <div className={styles.field}>
        <span className={styles.label} id="habit-lifelines-label">
          ¿Cuántos días puedes fallar sin romper la racha?
        </span>
        <div className={styles.inline} role="group" aria-labelledby="habit-lifelines-label">
          {LIFELINE_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              tone="violet"
              selected={values.weeklyLifelines === option.value}
              disabled={disabled}
              onClick={() => patch({ weeklyLifelines: option.value })}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        <p className={[styles.hint, styles.hintViolet].join(' ')}>
          <span aria-hidden="true">♥</span>
          <span>
            Son tus <strong>salvavidas</strong>. Un mal día no borra tres semanas de trabajo: gastas
            uno y la racha sigue viva.
          </span>
        </p>
      </div>

      <div className={styles.field}>
        <span className={styles.label} id="habit-purpose-label">
          ¿A quién te acerca este hábito?{' '}
          <span className={styles.labelHint}>— opcional, puedes decidirlo más adelante</span>
        </span>
        <div className={styles.inline} role="group" aria-labelledby="habit-purpose-label">
          {purposes.map((purpose) => (
            <Chip
              key={purpose.id}
              selected={values.purposeId === purpose.id}
              disabled={disabled}
              onClick={() =>
                patch({ purposeId: values.purposeId === purpose.id ? null : purpose.id })
              }
            >
              {purpose.icon ? (
                <span className={styles.chipIcon} aria-hidden="true">
                  <AppIcon name={purpose.icon} size="sm" />
                </span>
              ) : null}
              {purpose.name}
            </Chip>
          ))}
          <NewPurposeButton
            disabled={disabled}
            shouldAvoid={values.shouldAvoid}
            className={styles.chip}
            onCreated={(id) => patch({ purposeId: id })}
          >
            ＋ Otro
          </NewPurposeButton>
        </div>
      </div>
    </>
  )
}
