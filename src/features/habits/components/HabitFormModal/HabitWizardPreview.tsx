import type { CSSProperties } from 'react'
import type { HabitPurpose } from '@/features/habits/types/habit-purpose.types'
import type { HabitFormValues } from '@/features/habits/utils/habit-form.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './HabitWizardPreview.module.scss'

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

type PreviewProps = {
  values: HabitFormValues
  /** El ancla de la frase de intención, para la línea pequeña. */
  anchor: string
  measureLabel: string
  purpose: HabitPurpose | null
  /** Paso en curso, 1–3: marca la lista de comprobación. */
  step: number
  className?: string
}

/**
 * La misma lectura que tendrá la fila en Mi Día —cápsula, nombre, la línea
 * pequeña y el control circular—, pero sin nada que pulsar: aquí no hay hábito
 * todavía. Por eso el panel lo dice en voz alta.
 */
function previewMicrocopy(values: HabitFormValues, anchor: string, measureLabel: string): string {
  const pieces: string[] = []

  if (values.habitType === 'time') {
    const goal = values.timerGoal.trim()
    pieces.push(goal ? `${goal} min` : 'minutos, sin meta diaria')
  } else if (values.habitType === 'count') {
    const goal = values.dailyGoal.trim()
    pieces.push(goal ? `${goal} ${measureLabel}` : `${measureLabel}, sin meta diaria`)
  } else {
    pieces.push('Un toque para marcar')
  }

  if (anchor.trim()) pieces.push(`cuando ${anchor.trim()}`)

  const lifelines = Number(values.weeklyLifelines) || 0
  if (lifelines > 0) pieces.push(`♥ ${lifelines}`)

  return pieces.join(' · ')
}

function PreviewCapsule({ icon, className }: { icon: string | null; className?: string }) {
  return (
    <span className={[styles.capsule, className].filter(Boolean).join(' ')} aria-hidden="true">
      {icon ? <AppIcon name={icon} /> : '·'}
    </span>
  )
}

export function HabitWizardPreview({
  values,
  anchor,
  measureLabel,
  purpose,
  step,
  className,
}: PreviewProps) {
  const name = values.name.trim() || 'Tu hábito'
  const style = { '--habit-preview-color': values.color ?? undefined } as CSSProperties

  const checklist = [
    { label: 'Qué quieres cambiar', done: step > 1 },
    { label: 'Cómo se mide', done: step > 2 },
    { label: 'Cuándo y con qué margen', done: step > 3 },
  ]

  return (
    <aside className={className} style={style} aria-label="Vista previa del hábito">
      <span className={styles.label}>Así se verá en Mi día</span>

      <div className={styles.row}>
        <PreviewCapsule icon={values.icon} />
        <div className={styles.identity}>
          <div className={styles.name}>{name}</div>
          <p className={styles.meta}>{previewMicrocopy(values, anchor, measureLabel)}</p>
        </div>
        <span className={styles.toggle} aria-hidden="true" />
      </div>

      <div className={styles.days} aria-hidden="true">
        {WEEK_DAYS.map((day, index) => (
          <span key={`${day}-${index}`} className={styles.day}>
            {day}
          </span>
        ))}
      </div>

      <p className={styles.note}>
        Se actualiza mientras rellenas. <strong>Nada se guarda hasta el último paso.</strong>
      </p>

      {purpose ? (
        <p className={styles.note}>
          Al marcarlo verás: <strong>«Un día más siendo {purpose.name.toLocaleLowerCase('es')}.»</strong>
        </p>
      ) : null}

      <ol className={styles.checklist}>
        {checklist.map((item, index) => (
          <li
            key={item.label}
            className={[styles.check, item.done ? styles.checkDone : ''].join(' ')}
          >
            <i className={[styles.bullet, item.done ? styles.bulletDone : ''].join(' ')}>
              {item.done ? '✓' : index + 1}
            </i>
            {item.label}
          </li>
        ))}
      </ol>
    </aside>
  )
}

/** La tira que sustituye al panel cuando no cabe: solo icono y nombre. */
export function HabitWizardPreviewStrip({
  values,
  className,
}: {
  values: HabitFormValues
  className?: string
}) {
  const style = { '--habit-preview-color': values.color ?? undefined } as CSSProperties

  return (
    <div className={[styles.compact, className].filter(Boolean).join(' ')} style={style}>
      <PreviewCapsule icon={values.icon} className={styles.compactCapsule} />
      <div className={styles.identity}>
        <div className={styles.name}>{values.name.trim() || 'Tu hábito'}</div>
        <p className={styles.meta}>Vista previa en vivo · nada se guarda aún</p>
      </div>
    </div>
  )
}
