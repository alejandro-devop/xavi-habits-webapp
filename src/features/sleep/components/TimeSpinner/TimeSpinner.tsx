import { useRef, useState } from 'react'
import {
  appendDraftDigit,
  commitTimeUnitDigits,
  isCompleteTimeUnit,
  nextDraftDigits,
} from '@/features/sleep/utils/time-spinner.utils'
import styles from './TimeSpinner.module.scss'

type TimeUnit = 'hour' | 'minute'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export interface TimeSpinnerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function TimeSpinner({ label, value, onChange }: TimeSpinnerProps) {
  const parts = value.split(':')
  const h = parseInt(parts[0] ?? '0', 10) || 0
  const m = parseInt(parts[1] ?? '0', 10) || 0
  const minuteInputRef = useRef<HTMLInputElement>(null)
  const editingRef = useRef<TimeUnit | null>(null)
  const draftRef = useRef('')
  const skipNextChangeRef = useRef(false)
  const [editingUnit, setEditingUnit] = useState<TimeUnit | null>(null)
  const [draftDigits, setDraftDigits] = useState('')

  function syncDraft(unit: TimeUnit | null, draft: string) {
    editingRef.current = unit
    draftRef.current = draft
    setEditingUnit(unit)
    setDraftDigits(draft)
  }

  function stopEditing() {
    syncDraft(null, '')
  }

  function displayFor(unit: TimeUnit): string {
    if (editingUnit === unit) return draftDigits
    return pad2(unit === 'hour' ? h : m)
  }

  function commit(unit: TimeUnit, digits: string, focusMinutes = false) {
    const max = unit === 'hour' ? 23 : 59
    const num = commitTimeUnitDigits(digits, max)
    if (unit === 'hour') {
      onChange(`${pad2(num)}:${pad2(m)}`)
    } else {
      onChange(`${pad2(h)}:${pad2(num)}`)
    }
    stopEditing()
    if (focusMinutes) minuteInputRef.current?.focus()
  }

  function beginEditing(unit: TimeUnit, e: React.FocusEvent<HTMLInputElement>) {
    syncDraft(unit, '')
    requestAnimationFrame(() => e.target.select())
  }

  function applyDraft(unit: TimeUnit, next: string, focusMinutes = false) {
    syncDraft(unit, next)
    const max = unit === 'hour' ? 23 : 59
    if (isCompleteTimeUnit(next, max)) {
      commit(unit, next, focusMinutes)
    }
  }

  function currentDraft(unit: TimeUnit): string {
    return editingRef.current === unit ? draftRef.current : ''
  }

  function handleInput(unit: TimeUnit, incoming: string) {
    const next = nextDraftDigits(currentDraft(unit), incoming)
    applyDraft(unit, next, unit === 'hour')
  }

  function handleKeyDown(unit: TimeUnit, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key.length === 1 && /\d/.test(e.key)) {
      e.preventDefault()
      skipNextChangeRef.current = true
      const next = appendDraftDigit(currentDraft(unit), e.key)
      applyDraft(unit, next, unit === 'hour')
      return
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      skipNextChangeRef.current = true
      if (editingRef.current !== unit) return
      applyDraft(unit, draftRef.current.slice(0, -1))
    }
  }

  function handleChange(unit: TimeUnit, incoming: string) {
    if (skipNextChangeRef.current) {
      skipNextChangeRef.current = false
      return
    }
    handleInput(unit, incoming)
  }

  function handlePaste(unit: TimeUnit, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    handleInput(unit, e.clipboardData.getData('text'))
  }

  function handleBlur(unit: TimeUnit) {
    if (editingRef.current !== unit) return
    if (draftRef.current === '') {
      stopEditing()
      return
    }
    commit(unit, draftRef.current)
  }

  function changeHour(delta: number) {
    stopEditing()
    const next = ((h + delta) % 24 + 24) % 24
    onChange(`${pad2(next)}:${pad2(m)}`)
  }

  function changeMinute(delta: number) {
    stopEditing()
    const snapped = Math.round(m / 5) * 5
    const next = ((snapped + delta * 5) % 60 + 60) % 60
    onChange(`${pad2(h)}:${pad2(next)}`)
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
            value={displayFor('hour')}
            onChange={(e) => handleChange('hour', e.target.value)}
            onKeyDown={(e) => handleKeyDown('hour', e)}
            onPaste={(e) => handlePaste('hour', e)}
            onFocus={(e) => beginEditing('hour', e)}
            onBlur={() => handleBlur('hour')}
            inputMode="numeric"
            maxLength={2}
            aria-label={`${label} — hora`}
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
            ref={minuteInputRef}
            className={styles.spinnerInput}
            value={displayFor('minute')}
            onChange={(e) => handleChange('minute', e.target.value)}
            onKeyDown={(e) => handleKeyDown('minute', e)}
            onPaste={(e) => handlePaste('minute', e)}
            onFocus={(e) => beginEditing('minute', e)}
            onBlur={() => handleBlur('minute')}
            inputMode="numeric"
            maxLength={2}
            aria-label={`${label} — minuto`}
          />
          <button type="button" className={styles.spinnerBtn} onClick={() => changeMinute(-1)} aria-label="Disminuir minuto">
            ▼
          </button>
        </div>
      </div>
    </div>
  )
}
