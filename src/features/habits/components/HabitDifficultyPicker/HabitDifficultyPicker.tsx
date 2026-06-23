import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { DIFFICULTY_EMOJIS, DIFFICULTY_LABELS } from '@/features/habits/utils/habit-difficulty.utils'
import styles from './HabitDifficultyPicker.module.scss'

const DIFFICULTY_COLORS = ['#4ade80', '#a3e635', '#facc15', '#fb923c', '#ef4444'] as const
const DIFFICULTY_TEXT_COLORS = ['#166534', '#3f6212', '#854d0e', '#9a3412', '#991b1b'] as const
const MOBILE_MQ = '(max-width: 640px)'

type Props = {
  value: number | null
  onChange: (v: number | null) => void
}

export function HabitDifficultyPicker({ value, onChange }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  const [bumping, setBumping] = useState(false)
  const bumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    return () => {
      if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current)
    }
  }, [])

  const activeLevel = value ?? 2

  function handleChange(next: number) {
    onChange(next)
    setBumping(true)
    if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current)
    bumpTimeoutRef.current = setTimeout(() => setBumping(false), 150)
  }

  return (
    <div className={styles.root} role="group" aria-label="Dificultad">
      <div className={styles.display}>
        <span
          className={[styles.emoji, bumping ? styles.emojiBump : ''].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          {DIFFICULTY_EMOJIS[activeLevel]}
        </span>
        <span
          className={styles.label}
          style={{ color: DIFFICULTY_TEXT_COLORS[activeLevel] }}
        >
          {DIFFICULTY_LABELS[activeLevel]}
        </span>
      </div>

      {isMobile ? (
        <MobileStepper value={activeLevel} onChange={handleChange} />
      ) : (
        <DesktopSlider value={activeLevel} onChange={handleChange} />
      )}
    </div>
  )
}

function DesktopSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className={styles.sliderWrap}>
      <div className={styles.sliderRow}>
        <div className={styles.trackGradient} aria-hidden="true" />
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={4}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Nivel de dificultad"
          aria-valuetext={DIFFICULTY_LABELS[value]}
          style={{ '--thumb-color': DIFFICULTY_COLORS[value] } as CSSProperties}
        />
      </div>

      <div className={styles.ticks} role="group" aria-label="Seleccionar nivel de dificultad">
        {[0, 1, 2, 3, 4].map((i) => (
          <button
            key={i}
            type="button"
            className={[styles.tick, value === i ? styles.tickActive : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(i)}
            aria-label={DIFFICULTY_LABELS[i]}
            aria-pressed={value === i}
          >
            {DIFFICULTY_EMOJIS[i]}
          </button>
        ))}
      </div>
    </div>
  )
}

function MobileStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.stepBtn}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        aria-label="Más fácil"
      >
        −
      </button>

      <div className={styles.pips} aria-hidden="true">
        {DIFFICULTY_COLORS.map((color, i) => (
          <span
            key={i}
            className={[styles.pip, value === i ? styles.pipActive : ''].filter(Boolean).join(' ')}
            style={{ background: color }}
          />
        ))}
      </div>

      <button
        type="button"
        className={styles.stepBtn}
        onClick={() => onChange(Math.min(4, value + 1))}
        disabled={value === 4}
        aria-label="Más difícil"
      >
        +
      </button>
    </div>
  )
}
