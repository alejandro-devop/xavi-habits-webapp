import type { SleepLog } from '@/features/sleep/types/sleep.types'
import { buildLogsByDay, formatDuration, getQualityColor, QUALITY_LABELS } from '@/features/sleep/utils/sleep-month.utils'
import styles from './SleepBarChart.module.scss'

interface SleepBarChartProps {
  logs: SleepLog[]
  year: number
  month: number
}

const CHART_WIDTH = 640
const CHART_HEIGHT = 180
const PADDING = { top: 12, right: 8, bottom: 28, left: 36 }
const MAX_HOURS = 10
const GOAL_HOURS = 8

export function SleepBarChart({ logs, year, month }: SleepBarChartProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const logsByDay = buildLogsByDay(logs)

  const cw = CHART_WIDTH - PADDING.left - PADDING.right
  const ch = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const barSlot = cw / daysInMonth
  const barW = Math.max(barSlot - 2, 2)

  const yFraction = (hours: number) => hours / MAX_HOURS
  const goalY = PADDING.top + ch * (1 - yFraction(GOAL_HOURS))

  const yLabels = [0, 4, 8, 10]

  return (
    <div className={styles.wrapper}>
      <div className={styles.legend}>
        {Object.entries(QUALITY_LABELS).map(([key, label]) => (
          <span key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: getQualityColor(key as never) }} />
            {label}
          </span>
        ))}
        <span className={styles.legendItem}>
          <span className={styles.legendLine} />
          Meta 8h
        </span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
        aria-label={`Gráfico de sueño ${daysInMonth} días. ${logs.length} noches registradas.`}
        role="img"
      >
        {yLabels.map((h) => {
          const y = PADDING.top + ch * (1 - yFraction(h))
          return (
            <g key={h}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="currentColor"
                opacity={0.4}
              >
                {h}h
              </text>
            </g>
          )
        })}

        <line
          x1={PADDING.left}
          x2={CHART_WIDTH - PADDING.right}
          y1={goalY}
          y2={goalY}
          stroke="#007aff"
          strokeOpacity={0.35}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const log = logsByDay.get(day)
          const x = PADDING.left + i * barSlot + (barSlot - barW) / 2
          const label = day % 5 === 1 || day === daysInMonth ? day : null

          if (!log) {
            return (
              <g key={day}>
                {label !== null && (
                  <text
                    x={x + barW / 2}
                    y={CHART_HEIGHT - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    opacity={0.35}
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          }

          const hours = log.durationMinutes / 60
          const barH = ch * Math.min(yFraction(hours), 1)
          const barY = PADDING.top + ch - barH
          const color = getQualityColor(log.quality)

          return (
            <g key={day}>
              <title>
                Día {day}: {formatDuration(log.durationMinutes)}
                {log.quality ? ` · ${QUALITY_LABELS[log.quality]}` : ''}
              </title>
              <rect
                x={x}
                y={barY}
                width={barW}
                height={barH}
                fill={color}
                opacity={0.85}
                rx={2}
              />
              {label !== null && (
                <text
                  x={x + barW / 2}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.4}
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
