import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  commitTimeUnitDigits,
  isCompleteTimeUnit,
  sanitizeTimeUnitDigits,
} from '@/features/sleep/utils/time-spinner.utils'
import { Button } from '@/shared/ui/Button'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import { Textarea } from '@/shared/ui/Textarea'
import type { MoodOnWaking, SleepLog, SleepLogInput, SleepQuality } from '@/features/sleep/types/sleep.types'
import {
  calcDurationMinutes,
  formatSleepDuration,
  getTodayDate,
  isoToTime,
  sleepDateToInputValue,
  timeToIso,
} from '@/features/sleep/utils/sleep.utils'
import styles from './SleepLogModal.module.scss'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  sleepDate: string
  bedtime: string
  wakeTime: string
  quality: string
  moodOnWaking: string
  notes: string
}

interface WizardCtxValue {
  state: WizardState
  patch: (p: Partial<WizardState>) => void
  isEdit: boolean
  loading: boolean
  submitError: string | null
  onSubmit: (values: SleepLogInput) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WizardCtx = createContext<WizardCtxValue>({
  state: { sleepDate: '', bedtime: '22:00', wakeTime: '07:00', quality: '', moodOnWaking: '', notes: '' },
  patch: () => {},
  isEdit: false,
  loading: false,
  submitError: null,
  onSubmit: () => {},
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function getOffsetDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T12:00:00`)
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function buildInitial(log?: SleepLog, prefillDate?: string): WizardState {
  if (log) {
    return {
      sleepDate: sleepDateToInputValue(log.sleepDate),
      bedtime: isoToTime(log.bedtime),
      wakeTime: isoToTime(log.wakeTime),
      quality: log.quality ?? '',
      moodOnWaking: log.moodOnWaking ?? '',
      notes: log.notes ?? '',
    }
  }
  return {
    sleepDate: prefillDate ?? getTodayDate(),
    bedtime: '22:00',
    wakeTime: '07:00',
    quality: '',
    moodOnWaking: '',
    notes: '',
  }
}

// ─── TimeSpinner ──────────────────────────────────────────────────────────────

interface TimeSpinnerProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function TimeSpinner({ label, value, onChange }: TimeSpinnerProps) {
  const parts = value.split(':')
  const h = parseInt(parts[0] ?? '0', 10) || 0
  const m = parseInt(parts[1] ?? '0', 10) || 0
  const mInputRef = useRef<HTMLInputElement>(null)
  const [hourDraft, setHourDraft] = useState<string | null>(null)
  const [minuteDraft, setMinuteDraft] = useState<string | null>(null)

  function clearDrafts() {
    setHourDraft(null)
    setMinuteDraft(null)
  }

  function changeHour(delta: number) {
    clearDrafts()
    const next = ((h + delta) % 24 + 24) % 24
    onChange(`${pad2(next)}:${pad2(m)}`)
  }

  function changeMinute(delta: number) {
    clearDrafts()
    const snapped = Math.round(m / 5) * 5
    const next = ((snapped + delta * 5) % 60 + 60) % 60
    onChange(`${pad2(h)}:${pad2(next)}`)
  }

  function commitHour(digits: string, focusMinutes = false) {
    const nextHour = commitTimeUnitDigits(digits, 23)
    onChange(`${pad2(nextHour)}:${pad2(m)}`)
    setHourDraft(null)
    if (focusMinutes) mInputRef.current?.focus()
  }

  function commitMinute(digits: string) {
    const nextMinute = commitTimeUnitDigits(digits, 59)
    onChange(`${pad2(h)}:${pad2(nextMinute)}`)
    setMinuteDraft(null)
  }

  function handleHourChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = sanitizeTimeUnitDigits(e.target.value)
    setHourDraft(digits)
    if (isCompleteTimeUnit(digits, 23)) commitHour(digits, true)
  }

  function handleHourBlur() {
    if (hourDraft === null) return
    if (hourDraft === '') {
      setHourDraft(null)
      return
    }
    commitHour(hourDraft)
  }

  function handleMinuteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = sanitizeTimeUnitDigits(e.target.value)
    setMinuteDraft(digits)
    if (isCompleteTimeUnit(digits, 59)) commitMinute(digits)
  }

  function handleMinuteBlur() {
    if (minuteDraft === null) return
    if (minuteDraft === '') {
      setMinuteDraft(null)
      return
    }
    commitMinute(minuteDraft)
  }

  return (
    <div className={styles.spinner}>
      <p className={styles.spinnerLabel}>{label}</p>
      <div className={styles.spinnerRow}>
        <div className={styles.spinnerUnit}>
          <button type="button" className={styles.spinnerBtn} onClick={() => changeHour(1)} aria-label="Aumentar hora">
            ▲
          </button>
          <input
            className={styles.spinnerInput}
            value={hourDraft ?? pad2(h)}
            onChange={handleHourChange}
            onBlur={handleHourBlur}
            inputMode="numeric"
            maxLength={2}
            aria-label={`${label} — hora`}
            onFocus={(e) => {
              setHourDraft('')
              e.target.select()
            }}
          />
          <button type="button" className={styles.spinnerBtn} onClick={() => changeHour(-1)} aria-label="Disminuir hora">
            ▼
          </button>
        </div>
        <span className={styles.spinnerColon}>:</span>
        <div className={styles.spinnerUnit}>
          <button type="button" className={styles.spinnerBtn} onClick={() => changeMinute(1)} aria-label="Aumentar minuto">
            ▲
          </button>
          <input
            ref={mInputRef}
            className={styles.spinnerInput}
            value={minuteDraft ?? pad2(m)}
            onChange={handleMinuteChange}
            onBlur={handleMinuteBlur}
            inputMode="numeric"
            maxLength={2}
            aria-label={`${label} — minuto`}
            onFocus={(e) => {
              setMinuteDraft('')
              e.target.select()
            }}
          />
          <button type="button" className={styles.spinnerBtn} onClick={() => changeMinute(-1)} aria-label="Disminuir minuto">
            ▼
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Day ──────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { key: 'antenoche', label: 'Antenoche', emoji: '🌑', offset: 2 },
  { key: 'anoche', label: 'Anoche', emoji: '🌙', offset: 1 },
  { key: 'hoy', label: 'Hoy', emoji: '☀️', offset: 0 },
] as const

function Step1Day() {
  const { state, patch } = useContext(WizardCtx)
  const [showCustom, setShowCustom] = useState(false)

  const quickDates = DAY_OPTIONS.map((o) => ({ ...o, date: getOffsetDate(o.offset) }))

  function selectQuick(date: string) {
    patch({ sleepDate: date })
    setShowCustom(false)
  }

  function openCustom() {
    setShowCustom(true)
    const isQuick = quickDates.some((o) => o.date === state.sleepDate)
    if (isQuick) patch({ sleepDate: '' })
  }

  const isCustomActive = showCustom || (!quickDates.some((o) => o.date === state.sleepDate) && state.sleepDate !== '')

  return (
    <div className={styles.dayStep}>
      <div className={styles.dayGrid}>
        {quickDates.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={[
              styles.dayBtn,
              state.sleepDate === opt.date && !isCustomActive ? styles.dayBtnActive : '',
            ].join(' ')}
            onClick={() => selectQuick(opt.date)}
          >
            <span className={styles.dayEmoji}>{opt.emoji}</span>
            <span className={styles.dayLabel}>{opt.label}</span>
            <span className={styles.dayDate}>{formatShortDate(opt.date)}</span>
          </button>
        ))}
      </div>

      {isCustomActive ? (
        <div className={styles.customDate}>
          <label className={styles.customDateLabel}>Otra fecha</label>
          <input
            type="date"
            className={styles.customDateInput}
            value={state.sleepDate}
            max={getTodayDate()}
            onChange={(e) => patch({ sleepDate: e.target.value })}
            autoFocus
          />
        </div>
      ) : (
        <button type="button" className={styles.customDateToggle} onClick={openCustom}>
          Otra fecha…
        </button>
      )}
    </div>
  )
}

function Step1Footer() {
  const { state } = useContext(WizardCtx)
  const { push } = useModalStep()

  const canProceed = Boolean(state.sleepDate)

  function goNext() {
    if (!canProceed) return
    push({
      title: '¿A qué hora dormiste?',
      description: formatShortDate(state.sleepDate),
      content: <Step2Times />,
      footer: <Step2Footer />,
    })
  }

  return (
    <div className={styles.footerRow}>
      <Button variant="primary" disabled={!canProceed} onClick={goNext}>
        Siguiente →
      </Button>
    </div>
  )
}

// ─── Step 2: Times ────────────────────────────────────────────────────────────

function Step2Times() {
  const { state, patch } = useContext(WizardCtx)

  const durationMin =
    state.bedtime && state.wakeTime && state.sleepDate
      ? calcDurationMinutes(
          timeToIso(state.sleepDate, state.bedtime),
          timeToIso(state.sleepDate, state.wakeTime),
        )
      : null

  return (
    <div className={styles.timesStep}>
      <div className={styles.spinnerPair}>
        <TimeSpinner label="Me dormí a las" value={state.bedtime} onChange={(v) => patch({ bedtime: v })} />
        <TimeSpinner label="Me desperté a las" value={state.wakeTime} onChange={(v) => patch({ wakeTime: v })} />
      </div>

      {durationMin != null && durationMin > 0 && (
        <p className={styles.durationBadge}>🌙 {formatSleepDuration(durationMin)} de sueño</p>
      )}
    </div>
  )
}

function Step2Footer({ isBase = false }: { isBase?: boolean }) {
  const { state } = useContext(WizardCtx)
  const { push, pop } = useModalStep()
  const [error, setError] = useState('')

  function validate(): boolean {
    if (!state.bedtime || !state.wakeTime) {
      setError('Ingresa ambas horas')
      return false
    }
    const slDate = state.sleepDate || getTodayDate()
    const dMin = calcDurationMinutes(
      timeToIso(slDate, state.bedtime),
      timeToIso(slDate, state.wakeTime),
    )
    if (dMin < 30) {
      setError('La duración parece muy corta — mínimo 30 min')
      return false
    }
    if (dMin > 16 * 60) {
      setError('La duración supera 16 horas. ¿Es correcta la hora de despertar?')
      return false
    }
    setError('')
    return true
  }

  function goNext() {
    if (!validate()) return
    push({
      title: '¿Cómo fue tu sueño?',
      description: 'Todos los campos son opcionales',
      content: <Step3Details />,
      footer: <Step3Footer />,
    })
  }

  return (
    <>
      {error && <p className={styles.footerError}>{error}</p>}
      <div className={styles.footerRow}>
        {!isBase && (
          <Button variant="ghost" onClick={pop}>
            ← Volver
          </Button>
        )}
        <Button variant="primary" onClick={goNext}>
          Siguiente →
        </Button>
      </div>
    </>
  )
}

// ─── Step 3: Details ──────────────────────────────────────────────────────────

const QUALITY_OPTIONS = [
  { value: 'poor', label: 'Mala', emoji: '😴' },
  { value: 'fair', label: 'Regular', emoji: '😐' },
  { value: 'good', label: 'Buena', emoji: '😊' },
  { value: 'excellent', label: 'Excelente', emoji: '🌟' },
] as const

const MOOD_OPTIONS = [
  { value: 'tired', label: 'Cansado', emoji: '😪' },
  { value: 'groggy', label: 'Aturdido', emoji: '🥱' },
  { value: 'refreshed', label: 'Descansado', emoji: '😌' },
  { value: 'energized', label: 'Energizado', emoji: '⚡' },
] as const

function Step3Details() {
  const { state, patch } = useContext(WizardCtx)

  function toggle(field: 'quality' | 'moodOnWaking', value: string) {
    patch({ [field]: state[field] === value ? '' : value })
  }

  return (
    <div className={styles.detailsStep}>
      <div className={styles.optionSection}>
        <p className={styles.optionLabel}>Calidad del sueño</p>
        <div className={styles.optionGrid}>
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={[styles.optionBtn, state.quality === opt.value ? styles.optionBtnActive : ''].join(' ')}
              onClick={() => toggle('quality', opt.value)}
            >
              <span className={styles.optionEmoji}>{opt.emoji}</span>
              <span className={styles.optionText}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.optionSection}>
        <p className={styles.optionLabel}>Estado al despertar</p>
        <div className={styles.optionGrid}>
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={[styles.optionBtn, state.moodOnWaking === opt.value ? styles.optionBtnActive : ''].join(' ')}
              onClick={() => toggle('moodOnWaking', opt.value)}
            >
              <span className={styles.optionEmoji}>{opt.emoji}</span>
              <span className={styles.optionText}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.notesSection}>
        <p className={styles.optionLabel}>Notas</p>
        <Textarea
          value={state.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="¿Algo que quieras recordar de esta noche?"
          rows={3}
        />
      </div>
    </div>
  )
}

function Step3Footer() {
  const { state, onSubmit, loading, isEdit, submitError } = useContext(WizardCtx)
  const { pop } = useModalStep()

  function handleSubmit() {
    onSubmit({
      sleepDate: state.sleepDate,
      bedtime: timeToIso(state.sleepDate, state.bedtime),
      wakeTime: timeToIso(state.sleepDate, state.wakeTime),
      bedtimeStartTime: state.bedtime,
      quality: state.quality ? (state.quality as SleepQuality) : null,
      moodOnWaking: state.moodOnWaking ? (state.moodOnWaking as MoodOnWaking) : null,
      notes: state.notes.trim() || null,
    })
  }

  return (
    <>
      {submitError && <p className={styles.footerError}>{submitError}</p>}
      <div className={styles.footerRow}>
        <Button variant="ghost" onClick={pop} disabled={loading}>
          ← Volver
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading} isLoading={loading}>
          {isEdit ? 'Guardar cambios' : 'Guardar registro'}
        </Button>
      </div>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface SleepLogModalProps {
  open: boolean
  onClose: () => void
  initialLog?: SleepLog
  prefillDate?: string
  loading?: boolean
  submitError?: string | null
  onSubmit: (values: SleepLogInput) => void
}

export function SleepLogModal({
  open,
  onClose,
  initialLog,
  prefillDate,
  loading = false,
  submitError = null,
  onSubmit,
}: SleepLogModalProps) {
  const [state, setState] = useState<WizardState>(() => buildInitial(initialLog, prefillDate))

  useEffect(() => {
    if (open) setState(buildInitial(initialLog, prefillDate))
  }, [open, initialLog, prefillDate])

  function patch(p: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...p }))
  }

  const isEdit = Boolean(initialLog)
  const ctxValue: WizardCtxValue = { state, patch, isEdit, loading, submitError, onSubmit }

  if (isEdit) {
    return (
      <WizardCtx.Provider value={ctxValue}>
        <SteppedModal
          open={open}
          onClose={onClose}
          title="Editar registro"
          description={initialLog ? formatShortDate(sleepDateToInputValue(initialLog.sleepDate)) : undefined}
          size="sm"
          footer={<Step2Footer isBase />}
        >
          <Step2Times />
        </SteppedModal>
      </WizardCtx.Provider>
    )
  }

  return (
    <WizardCtx.Provider value={ctxValue}>
      <SteppedModal
        open={open}
        onClose={onClose}
        title="¿Cuándo dormiste?"
        size="sm"
        footer={<Step1Footer />}
      >
        <Step1Day />
      </SteppedModal>
    </WizardCtx.Provider>
  )
}
