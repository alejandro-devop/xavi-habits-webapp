import { useState } from 'react'
import type { WeekdayStat } from '@/features/habits/utils/habit-panel.utils'
import { ChartLegend, ChartPanel } from './ChartPanel'
import styles from './charts.module.scss'

const WIDTH = 340
const HEIGHT = 190
const TOP = 26
const BASELINE = 150
const BAR_WIDTH = 30

type Props = {
  stats: WeekdayStat[]
  worst: WeekdayStat | null
  rangeLabel: string
}

/**
 * La pregunta es «¿cuál es el peor?», así que son barras y el color es una
 * rampa de un solo tono. El peor día se marca con color de estado **y** con su
 * etiqueta: nunca solo con el color.
 */
export function HabitWeekdayChart({ stats, worst, rangeLabel }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const slot = WIDTH / stats.length
  const centerOf = (index: number) => slot * index + slot / 2
  const hoveredStat = hovered === null ? null : stats[hovered]

  return (
    <ChartPanel
      title="Dónde se te cae"
      subtitle={`Cumplimiento por día de la semana, ${rangeLabel}`}
      legend={
        worst
          ? <ChartLegend
              items={[
                { label: 'Cumplimiento', variant: 'swatchSeries' },
                { label: `Peor día: ${worst.longLabel}`, variant: 'swatchAlert' },
              ]}
            />
          : <ChartLegend items={[{ label: 'Cumplimiento', variant: 'swatchSeries' }]} />
      }
      table={{
        caption: 'Cumplimiento por día de la semana',
        columns: ['Día', 'Días cumplidos', 'Fallados', 'Sin registro', 'Cumplimiento'],
        rows: stats.map((stat) => ({
          key: stat.longLabel,
          cells: [
            stat.longLabel,
            `${stat.covered} de ${stat.total}`,
            String(stat.failed),
            String(stat.untracked),
            stat.total > 0 ? `${stat.percent}%` : 'sin datos',
          ],
        })),
      }}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={
          worst
            ? `Cumplimiento por día de la semana. El peor es ${worst.longLabel}, al ${worst.percent}%.`
            : 'Cumplimiento por día de la semana.'
        }
        onMouseLeave={() => setHovered(null)}
      >
        {stats.map((stat, index) => {
          if (stat.total === 0) return null
          const isWorst = worst?.weekday === stat.weekday
          const height = Math.max(2, (stat.percent / 100) * (BASELINE - TOP))
          return (
            <rect
              key={stat.longLabel}
              className={isWorst ? styles.barAlert : styles.bar}
              opacity={isWorst ? 0.9 : 0.4 + (stat.percent / 100) * 0.5}
              x={centerOf(index) - BAR_WIDTH / 2}
              y={BASELINE - height}
              width={BAR_WIDTH}
              height={height}
              rx={4}
            />
          )
        })}

        <line className={styles.baseline} x1={0} y1={BASELINE} x2={WIDTH} y2={BASELINE} />

        {stats.map((stat, index) => {
          const isWorst = worst?.weekday === stat.weekday
          const height = stat.total === 0 ? 0 : Math.max(2, (stat.percent / 100) * (BASELINE - TOP))
          return (
            <g key={stat.longLabel}>
              <text
                className={`${styles.valueText} ${isWorst ? styles.valueTextAlert : ''}`}
                x={centerOf(index)}
                y={BASELINE - height - 6}
                textAnchor="middle"
              >
                {stat.total > 0 ? `${stat.percent}%` : '—'}
              </text>
              <text
                className={styles.axisText}
                x={centerOf(index)}
                y={BASELINE + 16}
                textAnchor="middle"
              >
                {stat.label}
              </text>
              {isWorst ? (
                <text
                  className={`${styles.tagText} ${styles.valueTextAlert}`}
                  x={centerOf(index)}
                  y={BASELINE + 30}
                  textAnchor="middle"
                >
                  peor día
                </text>
              ) : null}
              <rect
                className={styles.hitArea}
                x={slot * index}
                y={0}
                width={slot}
                height={BASELINE}
                onMouseEnter={() => setHovered(index)}
              />
            </g>
          )
        })}
      </svg>

      {hoveredStat ? (
        <div
          className={styles.tooltip}
          style={{
            left: `${(centerOf(hovered!) / WIDTH) * 100}%`,
            top: `${((BASELINE - (hoveredStat.percent / 100) * (BASELINE - TOP)) / HEIGHT) * 100}%`,
          }}
        >
          <span className={styles.tooltipTitle}>{hoveredStat.longLabel}</span>
          {hoveredStat.total > 0
            ? `${hoveredStat.covered} de ${hoveredStat.total} días · ${hoveredStat.percent}%`
            : 'Sin días en este rango'}
          {hoveredStat.failed > 0 ? ` · ${hoveredStat.failed} fallados` : ''}
        </div>
      ) : null}
    </ChartPanel>
  )
}
