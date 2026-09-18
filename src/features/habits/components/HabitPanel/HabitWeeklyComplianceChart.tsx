import { useId, useState } from 'react'
import type { WeeklyPoint } from '@/features/habits/utils/habit-panel.utils'
import { ChartPanel } from './ChartPanel'
import styles from './charts.module.scss'

const WIDTH = 640
const HEIGHT = 184
const LEFT = 40
const RIGHT = 624
const TOP = 18
const BOTTOM = 150

type Props = {
  points: WeeklyPoint[]
  rangeLabel: string
}

function xFor(index: number, total: number): number {
  if (total <= 1) return (LEFT + RIGHT) / 2
  return LEFT + (index * (RIGHT - LEFT)) / (total - 1)
}

function yFor(percent: number): number {
  return BOTTOM - (percent / 100) * (BOTTOM - TOP)
}

function formatDifficulty(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

/**
 * La pregunta es «¿cómo cambia?»: por eso es una línea. El peor punto va
 * anotado con su cifra, no dejado a la vista del que mire.
 */
export function HabitWeeklyComplianceChart({ points, rangeLabel }: Props) {
  const gradientId = useId()
  const [hovered, setHovered] = useState<number | null>(null)

  const total = points.length
  const lastIndex = total - 1
  const worstIndex = points.reduce(
    (worst, point, index) => (point.percent < points[worst].percent ? index : worst),
    0,
  )

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xFor(index, total)},${yFor(point.percent)}`)
    .join(' ')
  const areaPath = `${linePath} L${xFor(lastIndex, total)},${BOTTOM} L${xFor(0, total)},${BOTTOM} Z`

  const hoveredPoint = hovered === null ? null : points[hovered]
  const slot = total > 1 ? (RIGHT - LEFT) / (total - 1) : RIGHT - LEFT

  // La anotación del bajón se pega al borde si el peor punto cae en un extremo.
  const worstX = xFor(worstIndex, total)
  const worstAnchor = worstX < LEFT + 60 ? 'start' : worstX > RIGHT - 60 ? 'end' : 'middle'
  const worstLabelX = worstAnchor === 'start' ? LEFT : worstAnchor === 'end' ? RIGHT : worstX

  return (
    <ChartPanel
      title="Cumplimiento semana a semana"
      subtitle={`Porcentaje de días cumplidos en cada semana de los ${rangeLabel}`}
      table={{
        caption: 'Cumplimiento semana a semana',
        columns: ['Semana', 'Días cumplidos', 'Fallados', 'Sin registro', 'Cumplimiento'],
        rows: points.map((point) => ({
          key: point.weekStart,
          cells: [
            point.label,
            `${point.covered} de ${point.total}`,
            String(point.failed),
            String(point.untracked),
            `${point.percent}%`,
          ],
        })),
      }}
    >
      <svg
        className={`${styles.svg} ${styles.wide}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Cumplimiento semanal, de ${points[0].percent}% en la primera semana a ${points[lastIndex].percent}% en la última. El peor punto es ${points[worstIndex].percent}%.`}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-series)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--chart-series)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[100, 50, 0].map((tick) => (
          <g key={tick}>
            <line
              className={tick === 0 ? styles.baseline : styles.gridline}
              x1={LEFT}
              y1={yFor(tick)}
              x2={RIGHT}
              y2={yFor(tick)}
            />
            <text className={styles.axisText} x={LEFT - 6} y={yFor(tick) + 3} textAnchor="end">
              {tick}%
            </text>
          </g>
        ))}

        {total > 1 ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
        {total > 1 ? <path className={styles.series} d={linePath} /> : null}

        {hovered !== null ? (
          <line
            className={styles.crosshair}
            x1={xFor(hovered, total)}
            y1={TOP}
            x2={xFor(hovered, total)}
            y2={BOTTOM}
          />
        ) : null}

        {worstIndex !== lastIndex ? (
          <>
            <circle
              className={styles.dotAlert}
              cx={xFor(worstIndex, total)}
              cy={yFor(points[worstIndex].percent)}
              r={5}
            />
            <text
              className={`${styles.valueText} ${styles.valueTextAlert}`}
              x={worstLabelX}
              y={Math.min(yFor(points[worstIndex].percent) + 18, BOTTOM - 4)}
              textAnchor={worstAnchor}
            >
              ▼ el bajón · {points[worstIndex].percent}%
            </text>
          </>
        ) : null}

        <circle
          className={worstIndex === lastIndex ? styles.dotAlert : styles.dot}
          cx={xFor(lastIndex, total)}
          cy={yFor(points[lastIndex].percent)}
          r={5}
        />
        <text
          className={`${styles.valueText} ${worstIndex === lastIndex ? styles.valueTextAlert : styles.valueTextStrong}`}
          x={RIGHT}
          y={Math.max(yFor(points[lastIndex].percent) - 10, TOP - 4)}
          textAnchor="end"
        >
          {points[lastIndex].percent}% la última semana
        </text>

        <text className={styles.axisText} x={LEFT} y={BOTTOM + 20}>
          {points[0].label}
        </text>
        <text className={styles.axisText} x={RIGHT} y={BOTTOM + 20} textAnchor="end">
          {points[lastIndex].label}
        </text>

        {points.map((point, index) => (
          <rect
            key={point.weekStart}
            className={styles.hitArea}
            x={xFor(index, total) - slot / 2}
            y={TOP}
            width={slot}
            height={BOTTOM - TOP}
            onMouseEnter={() => setHovered(index)}
          />
        ))}
      </svg>

      {hoveredPoint ? (
        <div
          className={styles.tooltip}
          style={{
            left: `${(xFor(hovered!, total) / WIDTH) * 100}%`,
            top: `${(yFor(hoveredPoint.percent) / HEIGHT) * 100}%`,
          }}
        >
          <span className={styles.tooltipTitle}>Semana del {hoveredPoint.label}</span>
          {hoveredPoint.covered} de {hoveredPoint.total} días · {hoveredPoint.percent}%
          {hoveredPoint.lifelines > 0 ? ` · ${hoveredPoint.lifelines} salvavidas` : ''}
          {hoveredPoint.avgDifficulty !== null ? (
            <>
              <br />
              Dificultad media: {formatDifficulty(hoveredPoint.avgDifficulty)} de 4
            </>
          ) : null}
        </div>
      ) : null}
    </ChartPanel>
  )
}
