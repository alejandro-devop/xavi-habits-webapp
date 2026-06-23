# Habit Month View + Difficulty Picker Redesign

> **Modelo recomendado para Cursor:** `claude-sonnet-4-5`
> Para el slider con CSS custom properties y la lógica responsive de detección de touch: `claude-opus-4`.

---

## Contexto

Este documento cubre dos mejoras independientes pero relacionadas:

1. **Nueva vista de mes** (`HabitMonthView`) — reemplaza el `HabitContributionGrid` en `HabitCalendarPage`. Cuadrícula navegable mes a mes con celdas interactivas que muestran estado del día, emoji de dificultad e ícono de nota.
2. **Rediseño de `HabitDifficultyPicker`** — de 5 botones emoji estáticos a un slider con gradiente de temperatura (desktop) y botones +/− (mobile). Default: nivel 2 (😐 Normal).

---

## Parte 1 — HabitDifficultyPicker

### Estado actual

**Archivo:** `src/features/habits/components/HabitDifficultyPicker/HabitDifficultyPicker.tsx`

```tsx
// Comportamiento actual: 5 botones toggle independientes
// Props: value: number | null, onChange: (v: number | null) => void
// Clicking el botón activo lo deselecciona (toggle → null)
// No tiene valor por defecto
```

**Archivo:** `src/features/habits/components/HabitDifficultyPicker/HabitDifficultyPicker.module.scss`

```scss
// 5 botones de 2.25rem × 2.25rem con borde y emoji
// Sin gradiente, sin distinción visual de temperatura
```

**Punto de uso principal:** `src/features/habits/components/HabitFollowUpForm/HabitFollowUpForm.tsx` línea 29 y 100:
```tsx
const [difficulty, setDifficulty] = useState<number | null>(existingFollowUp?.difficulty ?? null)
// ...
<HabitDifficultyPicker value={difficulty} onChange={setDifficulty} />
```

**Utilidades existentes** en `src/features/habits/utils/habit-difficulty.utils.ts`:
```ts
DIFFICULTY_EMOJIS = ['😊', '🙂', '😐', '😓', '💀']
DIFFICULTY_LABELS = ['Muy fácil', 'Fácil', 'Normal', 'Difícil', 'Extremo']
```

---

### 1.1 — Cambio en `HabitFollowUpForm`: default a nivel 2

Antes de rediseñar el picker, cambiar el estado inicial en el formulario para que siempre parta con nivel 2 seleccionado cuando es un registro nuevo.

**Archivo:** `src/features/habits/components/HabitFollowUpForm/HabitFollowUpForm.tsx`

```tsx
// ANTES — línea 29
const [difficulty, setDifficulty] = useState<number | null>(existingFollowUp?.difficulty ?? null)

// DESPUÉS — default a 2 (Normal) solo en creación, respetar el valor guardado al editar
const [difficulty, setDifficulty] = useState<number | null>(
  existingFollowUp?.difficulty ?? 2   // ← 2 = 😐 Normal, punto medio
)
```

**Importante:** el valor `2` como default solo aplica cuando el usuario va a crear un nuevo follow-up. Al editar uno existente, `existingFollowUp.difficulty` ya tiene el valor guardado y se respeta. El cambio es correcto tal como está porque el operador `??` usa el valor de la derecha solo cuando el de la izquierda es `null` o `undefined`.

---

### 1.2 — Rediseño del componente `HabitDifficultyPicker`

**Archivo a reescribir:** `src/features/habits/components/HabitDifficultyPicker/HabitDifficultyPicker.tsx`

#### Lógica de detección desktop vs mobile

Usar un media query con `window.matchMedia` o un custom hook para detectar si el dispositivo es touch/mobile. El breakpoint es `max-width: 640px` (mismo que el resto del proyecto).

```tsx
import { useEffect, useState } from 'react'
import { DIFFICULTY_EMOJIS, DIFFICULTY_LABELS } from '@/features/habits/utils/habit-difficulty.utils'
import styles from './HabitDifficultyPicker.module.scss'

// Colores de temperatura para los 5 niveles (de frío a caliente)
const DIFFICULTY_COLORS = ['#4ade80', '#a3e635', '#facc15', '#fb923c', '#ef4444'] as const

// Colores de texto sobre el fondo (para el label)
const DIFFICULTY_TEXT_COLORS = ['#166534', '#3f6212', '#854d0e', '#9a3412', '#991b1b'] as const

type Props = {
  value: number | null
  onChange: (v: number | null) => void
}

export function HabitDifficultyPicker({ value, onChange }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // El nivel activo para mostrar — usar 2 (Normal) como display cuando no hay valor
  const activeLevel = value ?? 2

  return (
    <div className={styles.root} role="group" aria-label="Dificultad">
      <div className={styles.display}>
        <span className={styles.emoji} aria-hidden="true">
          {DIFFICULTY_EMOJIS[activeLevel]}
        </span>
        <span
          className={styles.label}
          style={{ color: DIFFICULTY_TEXT_COLORS[activeLevel] }}
        >
          {DIFFICULTY_LABELS[activeLevel]}
        </span>
      </div>

      {isMobile
        ? <MobileStepper value={activeLevel} onChange={onChange} />
        : <DesktopSlider value={activeLevel} onChange={onChange} />
      }
    </div>
  )
}
```

#### Sub-componente DesktopSlider

```tsx
function DesktopSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number | null) => void
}) {
  return (
    <div className={styles.sliderWrap}>
      {/* Track de temperatura como fondo decorativo */}
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
        // Thumb color dinámico vía CSS custom property
        style={{ '--thumb-color': DIFFICULTY_COLORS[value] } as React.CSSProperties}
      />

      {/* Emojis de referencia debajo del slider */}
      <div className={styles.ticks} aria-hidden="true">
        {DIFFICULTY_EMOJIS.map((emoji, i) => (
          <span
            key={i}
            className={[styles.tick, value === i ? styles.tickActive : ''].join(' ')}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  )
}
```

#### Sub-componente MobileStepper

```tsx
function MobileStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number | null) => void
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

      {/* Pips de color indicando posición */}
      <div className={styles.pips} aria-hidden="true">
        {DIFFICULTY_COLORS.map((color, i) => (
          <span
            key={i}
            className={[styles.pip, value === i ? styles.pipActive : ''].join(' ')}
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
```

---

### 1.3 — Reescribir `HabitDifficultyPicker.module.scss`

**Archivo a reescribir completamente:** `src/features/habits/components/HabitDifficultyPicker/HabitDifficultyPicker.module.scss`

```scss
/* Contenedor raíz */
.root {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

/* Fila: emoji grande + label de texto */
.display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.emoji {
  font-size: 2.25rem;   /* 36px — protagonista visual */
  line-height: 1;
  transition: transform 0.15s ease;
  user-select: none;

  /* Animación de bump al cambiar nivel */
  &:global(.bump) {
    transform: scale(1.25);
  }
}

.label {
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s ease;
  min-width: 6rem;   /* evita layout shift al cambiar entre labels */
}

/* ── DESKTOP SLIDER ── */

.sliderWrap {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
  position: relative;
}

.trackGradient {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  right: 0;
  height: 0.5rem;
  border-radius: 999px;
  /* Verde fácil → Amarillo normal → Naranja difícil → Rojo extremo */
  background: linear-gradient(to right, #4ade80, #facc15, #fb923c, #ef4444);
  pointer-events: none;
  /* Posicionado detrás del input */
  z-index: 0;
}

.slider {
  /* Reset completo del input range */
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 1.25rem;   /* área de toque */
  background: transparent;
  cursor: pointer;
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 0;

  /* Thumb — WebKit */
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1.375rem;    /* 22px */
    height: 1.375rem;
    border-radius: 50%;
    background: var(--color-surface, #fff);
    border: 2.5px solid var(--thumb-color, #888);  /* color dinámico vía CSS prop */
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
    transition: border-color 0.15s ease, transform 0.1s ease;
    cursor: grab;
  }

  &:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: scale(1.15);
  }

  /* Thumb — Firefox */
  &::-moz-range-thumb {
    width: 1.375rem;
    height: 1.375rem;
    border-radius: 50%;
    background: var(--color-surface, #fff);
    border: 2.5px solid var(--thumb-color, #888);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
    cursor: grab;
  }

  /* Track transparente — el gradiente lo cubre .trackGradient */
  &::-webkit-slider-runnable-track {
    background: transparent;
    height: 0.5rem;
    border-radius: 999px;
  }

  &::-moz-range-track {
    background: transparent;
    height: 0.5rem;
    border-radius: 999px;
  }

  /* Focus ring accesible */
  &:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
  }
}

/* Fila de emojis de referencia debajo del track */
.ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 0.25rem;  /* alinea con los extremos del thumb */
}

.tick {
  font-size: 1rem;
  opacity: 0.4;
  transition: opacity 0.15s ease;
  line-height: 1;
  user-select: none;
}

.tickActive {
  opacity: 1;
}

/* ── MOBILE STEPPER ── */

.stepper {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  width: 100%;
}

.stepBtn {
  /* Mínimo touch target recomendado: 44×44px */
  width: 2.75rem;   /* 44px */
  height: 2.75rem;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-raised, var(--color-surface));
  font-size: 1.375rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: background 0.1s ease, transform 0.1s ease;
  flex-shrink: 0;
  user-select: none;
  font-family: inherit;

  &:active:not(:disabled) {
    transform: scale(0.9);
    background: var(--color-surface-hover, var(--color-surface));
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
  }
}

/* Pips de color — 5 círculos que indican la posición actual */
.pips {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.pip {
  width: 0.625rem;   /* 10px */
  height: 0.625rem;
  border-radius: 50%;
  opacity: 0.3;
  transition: transform 0.15s ease, opacity 0.15s ease;
  flex-shrink: 0;
}

.pipActive {
  opacity: 1;
  transform: scale(1.4);
}
```

---

### 1.4 — Animación de bump al cambiar nivel (opcional)

Para animar el emoji cuando cambia el nivel, el componente puede usar un estado `bumping`:

```tsx
// Dentro de HabitDifficultyPicker, añadir:
const [bumping, setBumping] = useState(false)

function handleChange(v: number | null) {
  onChange(v)
  setBumping(true)
  setTimeout(() => setBumping(false), 150)
}

// En el JSX:
<span
  className={[styles.emoji, bumping ? styles.emojiBump : ''].join(' ')}
  aria-hidden="true"
>
```

Agregar al SCSS:
```scss
.emojiBump {
  transform: scale(1.25);
}
```

---

### 1.5 — Criterios de aceptación del picker

- [ ] Al abrir `HabitFollowUpForm` en modo creación, el picker muestra `😐 Normal` (nivel 2) por defecto
- [ ] Al abrir en modo edición, muestra el nivel guardado en `existingFollowUp.difficulty`
- [ ] En desktop (≥641px): se ve un slider con track de gradiente verde→amarillo→naranja→rojo
- [ ] El thumb del slider cambia su color de borde al nivel activo (`--thumb-color`)
- [ ] Debajo del slider hay 5 emojis; el activo tiene `opacity: 1`, los demás `opacity: 0.4`
- [ ] El slider es navegable con teclado (← → cambian de nivel de uno en uno)
- [ ] El label de texto cambia de color al color semántico del nivel activo
- [ ] En mobile (≤640px): se ven botones − y + de al menos 44×44px
- [ ] El botón − está deshabilitado en nivel 0; el botón + está deshabilitado en nivel 4
- [ ] Los 5 pips de color muestran la posición actual (pip activo escalado, los demás con `opacity: 0.3`)
- [ ] El emoji hace un pequeño bump (scale 1.25) al cambiar de nivel
- [ ] El componente no rompe en modo oscuro (usar solo CSS custom properties del proyecto)

---

## Parte 2 — Vista de mes (`HabitMonthView`)

### Contexto del estado actual

**`HabitCalendarPage`** (`src/features/habits/pages/HabitCalendarPage.tsx`) renderiza `HabitContributionGrid` — un grid estilo GitHub con celdas de `1rem × 1rem` (16px), scroll horizontal, sin labels de mes y sin interacción. En mobile las celdas son intocables y el scroll horizontal rompe el contexto visual.

**`HabitContributionGrid`** (`src/features/habits/components/HabitContributionGrid/HabitContributionGrid.tsx`) — se mantiene sin cambios para el tab "Historial completo" en `HabitDetailPage`. No tocar este componente.

---

### 2.1 — Crear componente `HabitMonthView`

Crear archivo nuevo: `src/features/habits/components/HabitMonthView/HabitMonthView.tsx`

```tsx
import { useState } from 'react'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Modal } from '@/shared/ui/Modal'
import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { DIFFICULTY_EMOJIS } from '@/features/habits/utils/habit-difficulty.utils'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import styles from './HabitMonthView.module.scss'

type Props = {
  habit: Habit
  followUpByDate: Map<string, HabitFollowUp>   /* misma prop que HabitContributionGrid */
  today: string                                 /* 'YYYY-MM-DD' */
}

const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function HabitMonthView({ habit, followUpByDate, today }: Props) {
  const [year, setYear]   = useState(() => Number(today.slice(0, 4)))
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)))  /* 1-12 */
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  /* Primer día del mes (0=domingo … 6=sábado, convertir a lunes=0) */
  const firstDayRaw   = new Date(year, month - 1, 1).getDay()   /* 0=Sun */
  const firstDayMon   = (firstDayRaw + 6) % 7                   /* 0=Mon */
  const daysInMonth   = new Date(year, month, 0).getDate()

  /* Etiqueta de mes y año */
  const monthLabel = new Date(year, month - 1, 1)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    const todayYear  = Number(today.slice(0, 4))
    const todayMonth = Number(today.slice(5, 7))
    /* No navegar más allá del mes actual */
    if (year === todayYear && month === todayMonth) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const todayYear  = Number(today.slice(0, 4))
  const todayMonth = Number(today.slice(5, 7))
  const isCurrentMonth = year === todayYear && month === todayMonth

  /* Construir array de celdas: null = placeholder, string = 'YYYY-MM-DD' */
  const cells: Array<string | null> = [
    ...Array(firstDayMon).fill(null),                     /* placeholders al inicio */
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }),
  ]
  /* Rellenar hasta múltiplo de 7 */
  while (cells.length % 7 !== 0) cells.push(null)

  function handleCellClick(date: string) {
    if (date > today) return    /* días futuros no son clickeables */
    setSelectedDate(date)
  }

  const selectedFollowUp = selectedDate ? followUpByDate.get(selectedDate) : undefined

  return (
    <div className={styles.root}>
      {/* Navegación de mes */}
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prevMonth}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={nextMonth}
          disabled={isCurrentMonth}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {/* Headers de días de la semana */}
      <div className={styles.dayHeaders}>
        {DAY_HEADERS.map((d) => (
          <span key={d} className={styles.dayHeader}>{d}</span>
        ))}
      </div>

      {/* Grid de celdas */}
      <div className={styles.grid}>
        {cells.map((date, i) => {
          if (date === null) {
            return <div key={`ph-${i}`} className={styles.placeholder} />
          }

          const followUp   = followUpByDate.get(date)
          const isFuture   = date > today
          const isToday    = date === today
          const hasnotes   = Boolean(followUp?.notes?.trim())
          const difficulty = followUp?.difficulty ?? null
          const isLifeline = followUp?.isLifeline ?? false

          /* Clase de estado */
          let stateClass = ''
          if (followUp?.isAccomplished) stateClass = styles.cellOk
          else if (followUp?.isFailed)  stateClass = styles.cellFail
          else if (isLifeline)          stateClass = styles.cellLife

          const dayNum = Number(date.slice(8))

          return (
            <button
              key={date}
              type="button"
              className={[
                styles.cell,
                stateClass,
                isToday   ? styles.cellToday   : '',
                isFuture  ? styles.cellFuture  : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleCellClick(date)}
              disabled={isFuture}
              aria-label={`${date}${followUp ? ' — registrado' : ''}`}
              aria-pressed={Boolean(followUp)}
            >
              {/* Número de día y posible ícono de nota */}
              <span className={styles.cellTop}>
                <span className={styles.dayNum}>{dayNum}</span>
                {hasnotes && (
                  <AppIcon
                    name="message-circle"
                    size="xs"
                    className={styles.noteIcon}
                    aria-hidden="true"
                  />
                )}
              </span>

              {/* Emoji de dificultad o salvavidas en el fondo inferior */}
              {!isFuture && !followUp?.isFailed && (
                <span className={styles.cellBottom} aria-hidden="true">
                  {isLifeline
                    ? '🛡'
                    : difficulty !== null
                      ? DIFFICULTY_EMOJIS[difficulty]
                      : null
                  }
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchOk].join(' ')} />
          Logrado
        </div>
        <div className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchFail].join(' ')} />
          Fallido
        </div>
        <div className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchLife].join(' ')} />
          Salvavidas
        </div>
        <div className={styles.legendItem}>
          <span className={[styles.legendSwatch, styles.swatchEmpty].join(' ')} />
          Sin registro
        </div>
        <div className={styles.legendItem}>
          <AppIcon name="message-circle" size="xs" aria-hidden="true" />
          Tiene nota
        </div>
        <div className={styles.legendItem}>
          <span>😊→💀</span>
          Dificultad
        </div>
      </div>

      {/* Modal de registro/edición — reutiliza HabitFollowUpForm */}
      {selectedDate && (
        <Modal
          open={Boolean(selectedDate)}
          onClose={() => setSelectedDate(null)}
          title={selectedDate}
          size="sm"
        >
          <HabitFollowUpForm
            habit={habit}
            date={selectedDate}
            existingFollowUp={selectedFollowUp}
            onSuccess={() => setSelectedDate(null)}
          />
        </Modal>
      )}
    </div>
  )
}
```

---

### 2.2 — Crear `HabitMonthView.module.scss`

Crear archivo nuevo: `src/features/habits/components/HabitMonthView/HabitMonthView.module.scss`

```scss
@use '@/app/styles/mixins/responsive' as *;

.root {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

/* Barra de navegación de mes */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.navBtn {
  border: 0.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-md);
  padding: 0.25rem 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.1s ease;
  font-family: inherit;
  line-height: 1;

  &:hover:not(:disabled) {
    background: var(--color-surface-raised);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.monthLabel {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  text-transform: capitalize;
}

/* Headers L M X J V S D */
.dayHeaders {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.2rem;
  margin-bottom: 0.125rem;
}

.dayHeader {
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  padding: 0.25rem 0;
}

/* Grid de celdas */
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.2rem;
}

/* Placeholder (días fuera del mes) */
.placeholder {
  aspect-ratio: 1;
}

/* Celda base */
.cell {
  aspect-ratio: 1;
  border-radius: 0.3125rem;   /* 5px */
  background: var(--color-surface-raised);
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.2rem 0.25rem;
  transition: opacity 0.1s ease;
  font-family: inherit;

  /* Mobile: mínimo de touch target efectivo */
  min-height: 2.25rem;   /* 36px — las celdas se adaptan al ancho disponible */

  &:hover:not(:disabled) {
    opacity: 0.8;
  }

  &:focus-visible {
    outline: 2px solid var(--color-focus-ring, var(--color-primary));
    outline-offset: 2px;
  }
}

/* Estados */
.cellOk {
  background: var(--color-success-subtle, #dcfce7);
  .dayNum  { color: var(--color-success-text, #166534); }
  .noteIcon { color: var(--color-success-text, #166534); }
}

.cellFail {
  background: var(--color-danger-subtle, #fee2e2);
  .dayNum  { color: var(--color-danger-text, #991b1b); }
  .noteIcon { color: var(--color-danger-text, #991b1b); }
}

.cellLife {
  background: var(--color-info-subtle, #dbeafe);
  .dayNum  { color: var(--color-info-text, #1e40af); }
  .noteIcon { color: var(--color-info-text, #1e40af); }
}

/* Hoy */
.cellToday {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

/* Días futuros — no clickeables */
.cellFuture {
  opacity: 0.35;
  cursor: not-allowed;
  background: transparent;
  border: 0.5px dashed var(--color-border);
}

/* Interior de la celda */
.cellTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1;
}

.dayNum {
  font-size: 0.625rem;   /* 10px en desktop */
  font-weight: 500;
  color: var(--color-text-secondary);
  line-height: 1;

  @include lg {
    font-size: 0.6875rem;  /* 11px en pantallas grandes */
  }
}

.noteIcon {
  /* AppIcon size="xs" — hereda el font-size del parent */
  font-size: 0.5625rem;   /* 9px */
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.cellBottom {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  line-height: 1;
  font-size: 0.625rem;  /* 10px — emoji de dificultad */
}

/* Leyenda */
.legend {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 0.5px solid var(--color-border);
  margin-top: 0.25rem;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.legendSwatch {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 0.125rem;
  flex-shrink: 0;
}

.swatchOk   { background: var(--color-success-subtle, #dcfce7); border: 1px solid var(--color-success-text, #166534); }
.swatchFail { background: var(--color-danger-subtle, #fee2e2);  border: 1px solid var(--color-danger-text, #991b1b); }
.swatchLife { background: var(--color-info-subtle, #dbeafe);    border: 1px solid var(--color-info-text, #1e40af); }
.swatchEmpty{ background: var(--color-surface-raised);           border: 0.5px solid var(--color-border); }
```

---

### 2.3 — Reemplazar `HabitCalendarPage` para usar el nuevo componente

**Archivo:** `src/features/habits/pages/HabitCalendarPage.tsx`

```tsx
// ANTES — renderizaba HabitContributionGrid
import { HabitContributionGrid } from '@/features/habits/components/HabitContributionGrid'
import { HabitCalendarLegend } from '@/features/habits/components/HabitCalendarLegend'

// DESPUÉS — renderiza HabitMonthView
import { HabitMonthView } from '@/features/habits/components/HabitMonthView'
import { getTodayString } from '@/features/habits/utils/habit-type.utils'
```

```tsx
// El return de HabitCalendarPage queda:
return (
  <div className={styles.root}>
    <h2 className={styles.title}>{habit.name}</h2>
    <HabitMonthView
      habit={habit}
      followUpByDate={followUpByDate}
      today={today}
    />
  </div>
)
```

Eliminar los imports de `HabitContributionGrid` y `HabitCalendarLegend` — ya no se usan en esta página (la leyenda está dentro de `HabitMonthView`).

**Nota:** `HabitContributionGrid` sigue usándose en `HabitDetailPage` (tab "Historial completo"). No eliminar el componente `HabitContributionGrid`.

---

### 2.4 — Exportar `HabitMonthView` desde el barrel de habits

Crear archivo: `src/features/habits/components/HabitMonthView/index.ts`

```ts
export { HabitMonthView } from './HabitMonthView'
```

---

### 2.5 — Verificar tipo `HabitFollowUp`

El componente `HabitMonthView` accede a estos campos de `HabitFollowUp`:
- `followUp.isAccomplished` — boolean
- `followUp.isFailed` — boolean
- `followUp.isLifeline` — boolean
- `followUp.notes` — string | null
- `followUp.difficulty` — number | null

Verificar que todos existen en `src/features/habits/types/habit.types.ts`. Si `notes` o `difficulty` no están en el tipo, agregarlos. No cambiar el tipo de la API — solo el tipo local si hace falta.

---

### 2.6 — Verificar que `AppIcon` acepta `name="message-circle"`

El componente usa `<AppIcon name="message-circle" size="xs" />`. Verificar que:
1. `"message-circle"` es un `AppIconName` válido en `src/shared/icons/`.
2. El size `"xs"` existe en el componente `AppIcon`.

Si `"xs"` no existe, usar `"sm"` y ajustar el tamaño con `className` en el SCSS. Si `"message-circle"` no existe como nombre de icono, usar el nombre equivalente disponible en el proyecto (buscar en `src/shared/icons/`).

---

## Orden de implementación recomendado

1. **`HabitFollowUpForm`** — cambiar default de difficulty a `2`. Un solo cambio de una línea. Verificar en el formulario de registro.

2. **`HabitDifficultyPicker`** — reescribir el componente y su SCSS. Verificar en desktop (slider) y en mobile (botones). No cambia la API (`value`, `onChange`) — es retrocompatible.

3. **`HabitMonthView`** — crear los dos archivos nuevos (`HabitMonthView.tsx` y `HabitMonthView.module.scss`). Verificar celdas, navegación de mes, modal de edición.

4. **`HabitCalendarPage`** — actualizar para usar `HabitMonthView`. Verificar que los datos del query (`followUpByDate`) llegan correctamente al nuevo componente.

---

## Criterios de aceptación — Vista de mes

### Navegación
- [ ] Al abrir la página muestra el mes actual
- [ ] El botón `›` está deshabilitado cuando se está en el mes actual
- [ ] El botón `‹` navega al mes anterior sin límite (siempre activo)
- [ ] El label de mes se muestra en español capitalizado (ej: "Junio 2026")

### Celdas
- [ ] Los días del mes se muestran en la cuadrícula L-M-X-J-V-S-D
- [ ] Los días anteriores al primer día del mes son `placeholder` (vacíos, sin click)
- [ ] Días con registro logrado: fondo verde (`--color-success-subtle`)
- [ ] Días con registro fallido: fondo rojo (`--color-danger-subtle`)
- [ ] Días con salvavidas: fondo azul (`--color-info-subtle`)
- [ ] Días sin registro: fondo neutro (`--color-surface-raised`)
- [ ] Días futuros: borde dashed, opacidad 0.35, no clickeables
- [ ] Hoy: borde de `outline` con color primario
- [ ] El número de día aparece en la esquina superior izquierda de la celda

### Indicadores de detalle
- [ ] El ícono de nota (`message-circle`) aparece en la esquina superior derecha SOLO cuando `followUp.notes` tiene contenido (no vacío ni solo espacios)
- [ ] El emoji de dificultad aparece en la esquina inferior derecha de la celda cuando `followUp.difficulty !== null` y el día fue logrado
- [ ] Los días fallidos NO muestran emoji de dificultad (el color rojo es suficiente)
- [ ] Los días con salvavidas muestran 🛡 en lugar del emoji de dificultad
- [ ] El ícono de nota hereda el color del estado (verde/rojo/azul) según el tipo de registro

### Interacción
- [ ] Click/tap en un día pasado o hoy abre el `HabitFollowUpForm` en un `Modal`
- [ ] Si ya hay un registro para ese día, el formulario lo carga en modo edición
- [ ] Si no hay registro, el formulario abre en modo creación
- [ ] Al guardar o cancelar, el Modal se cierra
- [ ] Después de guardar, el mapa `followUpByDate` se actualiza (React Query invalida el cache)

### Responsive
- [ ] En mobile (≤640px) las celdas tienen al menos `36px` de alto (cumplen el mínimo de touch target)
- [ ] El emoji de dificultad es legible en mobile (mínimo 6px font-size = 9.6px en pantalla física con pixel ratio 1.6)
- [ ] La leyenda hace wrap en mobile sin romper el layout
- [ ] La navegación de mes (‹ › + label) cabe en una línea en mobile

### General
- [ ] `HabitContributionGrid` sigue funcionando sin cambios en `HabitDetailPage`
- [ ] No hay errores de TypeScript en ninguno de los archivos nuevos o modificados
- [ ] Tema claro y oscuro funcionan correctamente (todas las variables son CSS custom properties)
