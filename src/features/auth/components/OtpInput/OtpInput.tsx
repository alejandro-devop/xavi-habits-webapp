import { useCallback, useId, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { OTP_LENGTH } from '@/features/auth/utils/password.validation'
import styles from './OtpInput.module.scss'

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string | null
}

export function OtpInput({ value, onChange, disabled, error }: OtpInputProps) {
  const groupId = useId()
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '')

  const updateValue = useCallback(
    (nextDigits: string[]) => {
      onChange(nextDigits.join('').slice(0, OTP_LENGTH))
    },
    [onChange],
  )

  const focusIndex = (index: number) => {
    inputRefs.current[index]?.focus()
  }

  const handleChange = (index: number, digit: string) => {
    const sanitized = digit.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = sanitized
    updateValue(next)
    if (sanitized && index < OTP_LENGTH - 1) {
      focusIndex(index + 1)
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      focusIndex(index - 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? '')
    updateValue(next)
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.group}
        role="group"
        aria-labelledby={`${groupId}-label`}
        aria-describedby={error ? `${groupId}-error` : undefined}
      >
        <span id={`${groupId}-label`} className={styles.label}>
          Código de verificación
        </span>
        <div className={styles.inputs}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              className={styles.cell}
              value={digit}
              disabled={disabled}
              aria-label={`Dígito ${index + 1} de ${OTP_LENGTH}`}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
            />
          ))}
        </div>
      </div>
      {error ? (
        <span id={`${groupId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
