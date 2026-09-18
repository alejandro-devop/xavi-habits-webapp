import { useState } from 'react'
import type { GoalPoint } from '@/features/habits/utils/habit-panel.utils'
import { formatAmount } from '@/features/habits/utils/habit-panel.utils'
import { ChartLegend, ChartPanel } from './ChartPanel'
import styles from './charts.module.scss'

const WIDTH = 640
const HEIGHT = 160
const LEFT = 44
const RIGHT = 628
const TOP = 32
const BASELINE = 118

type Props = {
  points: GoalPoint[]
  goal: number
  unit: string
  /** `15 sep`, para el eje y el tooltip. */
  formatDate: (date: string) => string
}

/**
 * Un solo eje vertical: la cantidad. El objetivo es una línea de referencia
 * rotulada, no un segundo eje.
 */
export function HabitGoalChart({ points, goal, unit, formatDate }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const maxValue = points.reduce((max, point) => Math.max(max, point.value), 0)
  const axisMax = Math.max(goal, maxValue) || 1
  const slot = (RIGHT - LEFT) / points.length
  const barWidth = Math.min(20, Math.max(4, slot - 6))
  const centerOf = (index: number) => LEFT + slot * index + slot / 2
  const yFor = (value: number) => BASELINE - (Math.min(value, axisMax) / axisMax) * (BASELINE - TOP)
  const hoveredPoint = hovered === null ? null : points[hovered]

  const ticks = axisMax > goal ? [0, goal, axisMax] : [0, goal]

  return (
    <ChartPanel
      title="Cuánto, frente a tu objetivo"
      subtitle={`Cantidad por día · objetivo ${formatAmount(goal)} ${unit} · últimos ${points.length} días`}
      legend={
        <ChartLegend
          items={[
            { label: 'Llegaste al objetivo', variant: 'swatchSeries' },
            { label: 'Te quedaste corto', variant: 'swatchAlert' },
            { label: 'Sin registro', variant: 'swatchNeutral' },
            { label: `Objetivo: ${formatAmount(goal)} ${unit}`, variant: 'swatchAccent' },
          ]}
        />
      }
      table={{
        caption: 'Cantidad diaria frente al objetivo',
        columns: ['Día', 'Cantidad', 'Objetivo', 'Resultado'],
        rows: points.map((point) => ({
          key: point.date,
          cells: [
            formatDate(point.date),
            point.tracked ? `${formatAmount(point.value)} ${unit}` : 'sin registro',
            `${formatAmount(goal)} ${unit}`,
            point.tracked ? (point.met ? 'llegaste' : 'te quedaste corto') : '—',
          ],
        })),
      }}
    >
      <svg
        className={`${styles.svg} ${styles.wide}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Cantidad diaria frente al objetivo de ${formatAmount(goal)} ${unit}. ${points.filter((point) => point.met).length} de ${points.length} días llegaron.`}
        onMouseLeave={() => setHovered(null)}
      >
        {ticks.map((tick) => (
          <text
            key={tick}
            className={styles.axisText}
            x={LEFT - 6}
            y={yFor(tick) + 3}
            textAnchor="end"
          >
            {formatAmount(tick)}
          </text>
        ))}

        {points.map((point, index) => {
          if (!point.tracked) {
            return (
              <rect
                key={point.date}
                className={styles.barNeutral}
                x={centerOf(index) - barWidth / 2}
                y={BASELINE - 3}
                width={barWidth}
                height={3}
                rx={1.5}
              />
            )
          }
          const y = yFor(point.value)
          return (
            <rect
              key={point.date}
              className={point.met ? styles.bar : styles.barAlert}
              opacity={point.met ? 0.85 : 0.7}
              x={centerOf(index) - barWidth / 2}
              y={y}
              width={barWidth}
              height={Math.max(2, BASELINE - y)}
              rx={4}
            />
          )
        })}

        <line
          x1={LEFT}
          y1={yFor(goal)}
          x2={RIGHT}
          y2={yFor(goal)}
          stroke="var(--chart-accent)"
          strokeWidth={2}
          strokeDasharray="5 4"
          opacity={0.7}
        />
        {/* Arriba del todo: sobre la línea se pisaría con las barras altas. */}
        <text
          className={`${styles.valueText} ${styles.valueTextAccent}`}
          x={RIGHT}
          y={TOP - 14}
          textAnchor="end"
        >
          ┈ objetivo {formatAmount(goal)} {unit}
        </text>

        <line className={styles.baseline} x1={LEFT} y1={BASELINE} x2={RIGHT} y2={BASELINE} />

        <text className={styles.axisText} x={LEFT} y={BASELINE + 20}>
          {formatDate(points[0].date)}
        </text>
        <text className={styles.axisText} x={RIGHT} y={BASELINE + 20} textAnchor="end">
          {formatDate(points[points.length - 1].date)}
        </text>

        {points.map((point, index) => (
          <rect
            key={`hit-${point.date}`}
            className={styles.hitArea}
            x={LEFT + slot * index}
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
            left: `${(centerOf(hovered!) / WIDTH) * 100}%`,
            top: `${((hoveredPoint.tracked ? yFor(hoveredPoint.value) : BASELINE) / HEIGHT) * 100}%`,
          }}
        >
          <span className={styles.tooltipTitle}>{formatDate(hoveredPoint.date)}</span>
          {hoveredPoint.tracked
            ? `${formatAmount(hoveredPoint.value)} de ${formatAmount(goal)} ${unit}`
            : 'Sin registro'}
        </div>
      ) : null}
    </ChartPanel>
  )
}
