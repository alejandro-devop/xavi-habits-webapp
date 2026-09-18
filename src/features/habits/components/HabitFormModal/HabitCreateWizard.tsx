import { useState } from 'react'
import { pickInitialHabitColor } from '@/features/habits/data/habit-colors'
import type { HabitTemplate } from '@/features/habits/data/habit-templates'
import {
  useHabitCategoriesQuery,
  useHabitMeasuresQuery,
  useHabitsQuery,
} from '@/features/habits/hooks/useHabits'
import { useCreateHabitMutation } from '@/features/habits/hooks/useHabits'
import { useHabitPurposesQuery } from '@/features/habits/hooks/useHabitPurposes'
import { formatMeasureDisplay } from '@/features/habits/utils/habit-measure-form.utils'
import {
  applyHabitTemplate,
  composeIntention,
  defaultFormValues,
  EMPTY_INTENTION,
  proposeIntentionAction,
  type HabitFormValues,
  type HabitIntention,
} from '@/features/habits/utils/habit-form.utils'
import { buildHabitCreatePayload } from '@/features/habits/utils/habit-form.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import { HabitWizardPreview, HabitWizardPreviewStrip } from './HabitWizardPreview'
import { HabitWizardStep1 } from './HabitWizardStep1'
import { HabitWizardStep2 } from './HabitWizardStep2'
import { HabitWizardStep3 } from './HabitWizardStep3'
import styles from './HabitCreateWizard.module.scss'

type WizardStep = 1 | 2 | 3

const STEP_META: Record<WizardStep, { title: string; description: string }> = {
  1: {
    title: '¿Qué quieres cambiar?',
    description: 'Empieza por algo pequeño que puedas hacer mañana mismo.',
  },
  2: {
    title: '¿Cómo sabrás que lo cumpliste?',
    description: 'Elige la forma que menos te haga pensar al final del día.',
  },
  3: {
    title: '¿Cuándo lo vas a hacer?',
    description: 'Un plan concreto se cumple mucho más que una buena intención.',
  },
}

type Props = { open: boolean; onClose: () => void }

export function HabitCreateWizard({ open, onClose }: Props) {
  // Los colores que ya están en uso. La lista activa es la misma que pide Mis
  // Hábitos, así que casi siempre viene de la caché y no cuesta una petición.
  const activeHabitsQuery = useHabitsQuery({ status: 'active' })
  const usedColors = (activeHabitsQuery.data?.habits ?? []).map((habit) => habit.color)

  /**
   * El sorteo pasa por aquí y solo por aquí: dentro del estado inicial y del
   * reset, nunca en el cuerpo del componente. Si `Math.random()` se colara en
   * el render, el color parpadearía con cada tecla del nombre.
   *
   * `defaultFormValues` se queda pura: el color entra desde fuera.
   */
  function initialValues(): HabitFormValues {
    return { ...defaultFormValues(), color: pickInitialHabitColor(usedColors) }
  }

  const [step, setStep] = useState<WizardStep>(1)
  const [values, setValues] = useState<HabitFormValues>(initialValues)
  const [nameError, setNameError] = useState<string | null>(null)
  const [intention, setIntention] = useState<HabitIntention>({ ...EMPTY_INTENTION })
  // Mientras nadie toque el hueco de la acción, se propone a partir del nombre.
  const [actionTouched, setActionTouched] = useState(false)
  const [descriptionMode, setDescriptionMode] = useState<'intention' | 'free'>('intention')
  const [freeText, setFreeText] = useState('')
  const [pendingMeasureName, setPendingMeasureName] = useState<string | null>(null)
  const [pendingCategoryName, setPendingCategoryName] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  const { data: categories = [] } = useHabitCategoriesQuery()
  const { data: measures = [] } = useHabitMeasuresQuery()
  const { data: purposes = [], isLoading: purposesLoading } = useHabitPurposesQuery()
  const createMutation = useCreateHabitMutation()
  const { confirm } = useConfirmDialog()

  function reset() {
    setStep(1)
    setValues(initialValues())
    setNameError(null)
    setIntention({ ...EMPTY_INTENTION })
    setActionTouched(false)
    setDescriptionMode('intention')
    setFreeText('')
    setPendingMeasureName(null)
    setPendingCategoryName(null)
    setAdvancedOpen(false)
    createMutation.reset()
  }

  // Ajuste de estado durante el render, no en un efecto: al abrirse, el wizard
  // empieza limpio sin una pasada extra de renderizado.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) reset()
  }

  const isMutating = createMutation.isPending
  const selectedMeasure = measures.find((m) => m.id === values.measureId) ?? null
  const measureLabel = formatMeasureDisplay(selectedMeasure)

  const proposedAction = proposeIntentionAction(values, measureLabel)
  const effectiveIntention: HabitIntention = {
    ...intention,
    action: actionTouched ? intention.action : proposedAction,
  }

  const filteredPurposes = purposes.filter((p) =>
    values.shouldAvoid ? p.placement === 'avoid' : p.placement === 'want',
  )
  const selectedPurpose = filteredPurposes.find((p) => p.id === values.purposeId) ?? null

  function patch(partial: Partial<HabitFormValues>) {
    setValues((prev) => ({ ...prev, ...partial }))
    if (partial.name !== undefined && nameError) setNameError(null)
  }

  function patchIntention(partial: Partial<HabitIntention>) {
    if (partial.action !== undefined) setActionTouched(true)
    setIntention({ ...effectiveIntention, ...partial })
  }

  async function handleApplyTemplate(template: HabitTemplate) {
    const currentName = values.name.trim()
    if (currentName && currentName !== template.name) {
      const ok = await confirm({
        title: '¿Sustituir lo que ya escribiste?',
        description: `Vas a cambiar «${currentName}» por «${template.name}». Después puedes seguir editándolo todo.`,
        confirmLabel: 'Sustituir',
        cancelLabel: 'Dejarlo como está',
      })
      if (!ok) return
    }

    const result = applyHabitTemplate(values, template, { measures, categories })
    setValues(result.values)
    setNameError(null)
    setPendingMeasureName(result.pendingMeasureName)
    setPendingCategoryName(result.pendingCategoryName)
    setIntention((prev) => ({ ...prev, action: result.intentionAction }))
    setActionTouched(true)
  }

  async function handleToggleDescriptionMode(useFreeText: boolean) {
    const nextMode = useFreeText ? 'free' : 'intention'
    if (nextMode === descriptionMode) return

    const losing = useFreeText ? composeIntention(effectiveIntention) : freeText.trim()
    if (losing) {
      const ok = await confirm({
        title: '¿Cambiar de descripción?',
        description: useFreeText
          ? 'La frase de intención se sustituye por el texto que escribas. Solo se guarda una de las dos.'
          : 'El texto que escribiste se sustituye por la frase de intención. Solo se guarda una de las dos.',
        confirmLabel: 'Cambiar',
        cancelLabel: 'Cancelar',
      })
      if (!ok) return
    }
    setDescriptionMode(nextMode)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleNext() {
    if (step === 1) {
      if (!values.name.trim()) {
        setNameError('Ponle un nombre para seguir. Es lo único obligatorio.')
        return
      }
      setStep(2)
      return
    }
    if (step === 2) setStep(3)
  }

  function handleSubmit() {
    const description =
      descriptionMode === 'intention' ? composeIntention(effectiveIntention) : freeText
    const payload = buildHabitCreatePayload({ ...values, description })
    createMutation.mutate(payload, { onSuccess: handleClose })
  }

  const meta = STEP_META[step]

  const stepContent =
    step === 1 ? (
      <HabitWizardStep1
        values={values}
        patch={patch}
        nameError={nameError}
        disabled={isMutating}
        categories={categories}
        pendingCategoryName={pendingCategoryName}
        onApplyTemplate={(template) => void handleApplyTemplate(template)}
      />
    ) : step === 2 ? (
      <HabitWizardStep2
        values={values}
        patch={patch}
        disabled={isMutating}
        measures={measures}
        measureLabel={measureLabel}
        pendingMeasureName={pendingMeasureName}
        advancedOpen={advancedOpen}
        onToggleAdvanced={() => setAdvancedOpen((prev) => !prev)}
        descriptionMode={descriptionMode}
        freeText={freeText}
        onFreeTextChange={setFreeText}
        onToggleDescriptionMode={(useFreeText) => void handleToggleDescriptionMode(useFreeText)}
      />
    ) : (
      <HabitWizardStep3
        values={values}
        patch={patch}
        intention={effectiveIntention}
        onIntentionChange={patchIntention}
        purposes={filteredPurposes}
        disabled={isMutating || purposesLoading}
        descriptionMode={descriptionMode}
        freeText={freeText}
        onFreeTextChange={setFreeText}
        onUseIntention={() => void handleToggleDescriptionMode(false)}
      />
    )

  return (
    <SteppedModal
      open={open}
      onClose={handleClose}
      title={meta.title}
      description={meta.description}
      size="xl"
      ds="aura"
      mobileSheet
    >
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.progress}>
            <div className={styles.dots} aria-hidden="true">
              {([1, 2, 3] as WizardStep[]).map((dot) => (
                <span
                  key={dot}
                  className={[
                    styles.dot,
                    dot < step ? styles.dotDone : '',
                    dot === step ? styles.dotCurrent : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              ))}
            </div>
            <span className={styles.stepCounter}>Paso {step} de 3</span>
          </div>

          <p className={styles.srOnly} role="status" aria-live="polite">
            Paso {step} de 3: {meta.title}
          </p>

          <HabitWizardPreviewStrip values={values} className={styles.mobilePreview} />

          {stepContent}

          {createMutation.isError ? (
            <Alert variant="danger">
              No se pudo crear el hábito. Revisa la conexión y vuelve a intentarlo.
            </Alert>
          ) : null}

          <div className={styles.footer}>
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                disabled={isMutating}
              >
                ← Atrás
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isMutating}>
                Cancelar
              </Button>
            )}

            {step === 3 ? (
              <>
                <button
                  type="button"
                  className={[styles.skip, styles.footerEnd].join(' ')}
                  onClick={handleSubmit}
                  disabled={isMutating}
                >
                  Omitir y crear
                </button>
                <Button
                  type="button"
                  className={styles.footerPrimary}
                  onClick={handleSubmit}
                  isLoading={isMutating}
                  disabled={isMutating}
                >
                  Crear hábito ✓
                </Button>
              </>
            ) : (
              <Button
                type="button"
                className={[styles.footerEnd, styles.footerPrimary].join(' ')}
                onClick={handleNext}
                disabled={isMutating}
              >
                Siguiente →
              </Button>
            )}
          </div>
        </div>

        <HabitWizardPreview
          values={values}
          anchor={effectiveIntention.anchor}
          measureLabel={measureLabel}
          purpose={selectedPurpose}
          step={step}
          className={styles.aside}
        />
      </div>
    </SteppedModal>
  )
}
