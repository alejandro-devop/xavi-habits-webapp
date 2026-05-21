import {
  formatDurationConversionHint,
  hoursMinutesToTotalMinutes,
  minutesToHoursMinutes,
} from '@/features/activities/utils/activity-time.utils'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import styles from './DurationHoursMinutesFields.module.scss'

type DurationHoursMinutesFieldsProps = {
  idPrefix: string
  totalMinutes: number
  onChange: (totalMinutes: number) => void
  disabled?: boolean
  error?: string
}

export function DurationHoursMinutesFields({
  idPrefix,
  totalMinutes,
  onChange,
  disabled = false,
  error,
}: DurationHoursMinutesFieldsProps) {
  const { hours, minutes } = minutesToHoursMinutes(totalMinutes)
  const hint = formatDurationConversionHint(totalMinutes)

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <FormField id={`${idPrefix}-hours`} label="Horas">
          <Input
            id={`${idPrefix}-hours`}
            type="number"
            min={0}
            value={String(hours)}
            onChange={(e) =>
              onChange(hoursMinutesToTotalMinutes(Number(e.target.value) || 0, minutes))
            }
            disabled={disabled}
          />
        </FormField>
        <FormField id={`${idPrefix}-minutes`} label="Minutos">
          <Input
            id={`${idPrefix}-minutes`}
            type="number"
            min={0}
            max={59}
            value={String(minutes)}
            onChange={(e) =>
              onChange(hoursMinutesToTotalMinutes(hours, Number(e.target.value) || 0))
            }
            disabled={disabled}
          />
        </FormField>
      </div>
      <p className={styles.hint} aria-live="polite">
        Total: <strong>{hint}</strong>
      </p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
