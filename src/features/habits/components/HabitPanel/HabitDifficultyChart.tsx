import { useState } from 'react'
import { DIFFICULTY_LABELS } from '@/features/habits/utils/habit-difficulty.utils'
import type { DifficultyPoint } from '@/features/habits/utils/habit-panel.utils'
import { ChartPanel } from './ChartPanel'
import styles from './charts.module.scss'

const WIDTH = 340
const HEIGHT = 156
const LEFT = 64
const RIGHT = 330
const TOP = 20
const BASELINE = 110

/** La escala real del código es 0–4, no 1–5. Manda `habit-difficulty.utils`. */
const MAX_DIFFICULTY = 4
const TICKS = [4, 2, 0]

type Props = {
  points: DifficultyPoint[]
}

function format(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

/**
 * Su propio panel: la dificultad jamás va montada sobre el cumplimiento, porque
 * eso obligaría a dos ejes verticales en el mismo gráfico.
 */
export function HabitDifficultyChart({ points }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const total = points.length
  const lastIndex = total - 1
  const hardestIndex = points.reduce(
    (max, point, index) => (point.average > points[max].average ? index : max),
    0,
  )

  const xFor = (index: number) =>
    total <= 1 ? (LEFT + RIGHT) / 2 : LEFT + (index * (RIGHT - LEFT)) / (total - 1)
  const yFor = (value: number) => BASELINE - (value / MAX_DIFFICULTY) * (BASELINE - TOP)

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xFor(index)},${yFor(point.average)}`)
    .join(' ')
  const hoveredPoint = hovered === null ? null : points[hovered]
  const slot = total > 1 ? (RIGHT - LEFT) / (total - 1) : RIGHT - LEFT

  return (
    <ChartPanel
      title="Cómo se te hizo"
      subtitle="Dificultad media que registraste, por semana. Escala de 0 (muy fácil) a 4 (extremo)."
      table={{
        caption: 'Dificultad media por semana',
        columns: ['Semana', 'Dificultad media (0–4)', 'Días registrados'],
        rows: points.map((point) => ({
          key: point.weekStart,
          cells: [point.label, format(point.average), String(point.samples)],
        })),
      }}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Dificultad media por semana, de ${format(points[0].average)} a ${format(points[lastIndex].average)} sobre 4.`}
        onMouseLeave={() => setHovered(null)}
      >
        {TICKS.map((tick) => (
          <g key={tick}>
            <line
              className={tick === 0 ? styles.baseline : styles.gridline}
              x1={LEFT}
              y1={yFor(tick)}
              x2={RIGHT}
              y2={yFor(tick)}
            />
            <text className={styles.axisText} x={LEFT - 6} y={yFor(tick) + 3} textAnchor="end">
              {tick} · {DIFFICULTY_LABELS[tick]}
            </text>
          </g>
        ))}

        {total > 1 ? <path className={styles.seriesAccent} d={linePath} /> : null}

        {hovered !== null ? (
          <line
            className={styles.crosshair}
            x1={xFor(hovered)}
            y1={TOP}
            x2={xFor(hovered)}
            y2={BASELINE}
          />
        ) : null}

        {hardestIndex !== lastIndex ? (
          <>
            <circle
              className={styles.dotAccent}
              cx={xFor(hardestIndex)}
              cy={yFor(points[hardestIndex].average)}
              r={4}
            />
            <text
              className={`${styles.valueText} ${styles.valueTextAccent}`}
              x={xFor(hardestIndex)}
              y={Math.max(yFor(points[hardestIndex].average) - 8, 10)}
              textAnchor="middle"
            >
              {format(points[hardestIndex].average)} · lo más duro
            </text>
          </>
        ) : null}

        <circle
          className={styles.dotAccent}
          cx={xFor(lastIndex)}
          cy={yFor(points[lastIndex].average)}
          r={5}
        />
        <text
          className={`${styles.valueText} ${styles.valueTextAccent}`}
          x={RIGHT}
          y={Math.max(yFor(points[lastIndex].average) - 10, 10)}
          textAnchor="end"
        >
          {format(points[lastIndex].average)} la última semana
        </text>

        <text className={styles.axisText} x={LEFT} y={BASELINE + 20}>
          {points[0].label}
        </text>
        <text className={styles.axisText} x={RIGHT} y={BASELINE + 20} textAnchor="end">
          {points[lastIndex].label}
        </text>

        {points.map((point, index) => (
          <rect
            key={point.weekStart}
            className={styles.hitArea}
            x={xFor(index) - slot / 2}
            y={0}
            width={slot}
            height={BASELINE}
            onMouseEnter={() => setHovered(index)}
          />
        ))}
      </svg>

      {hoveredPoint ? (
        <div
          className={styles.tooltip}
          style={{
            left: `${(xFor(hovered!) / WIDTH) * 100}%`,
            top: `${(yFor(hoveredPoint.average) / HEIGHT) * 100}%`,
          }}
        >
          <span className={styles.tooltipTitle}>Semana del {hoveredPoint.label}</span>
          {format(hoveredPoint.average)} de 4 ·{' '}
          {DIFFICULTY_LABELS[Math.round(hoveredPoint.average)] ?? '—'}
          <br />
          {hoveredPoint.samples} {hoveredPoint.samples === 1 ? 'día' : 'días'} con dificultad
        </div>
      ) : null}
    </ChartPanel>
  )
}
