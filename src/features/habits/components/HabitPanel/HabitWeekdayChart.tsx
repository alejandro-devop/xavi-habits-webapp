import { useState } from 'react'
import type { WeekdayStat } from '@/features/habits/utils/habit-panel.utils'
import { MIN_TRACKED_PER_WEEKDAY } from '@/features/habits/utils/habit-panel.utils'
import { ChartLegend, ChartPanel } from './ChartPanel'
import styles from './charts.module.scss'

const WIDTH = 340
const HEIGHT = 190
const TOP = 26
const BASELINE = 150
const BAR_WIDTH = 30

type Props = {
  stats: WeekdayStat[]
  /** El día con más fallos del tramo, o `null` cuando el panel calla. */
  most: WeekdayStat | null
  /** La frase de debajo, ya compuesta: el hecho o lo que falta para decirlo. */
  note: string | null
  rangeLabel: string
}

/**
 * La pregunta es «¿dónde se falla?», así que las barras cuentan **fallos**, no
 * porcentaje de cumplimiento: el porcentaje esconde el tamaño y pintaba igual
 * cinco fallos de diez que uno de dos. Cada barra lleva su cuenta encima.
 *
 * El día señalado se marca con color de estado **y** con su etiqueta: nunca
 * solo con el color. Los días que no llegan al umbral se dibujan apagados, y
 * la frase de debajo dice por qué.
 */
export function HabitWeekdayChart({ stats, most, note, rangeLabel }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const slot = WIDTH / stats.length
  const centerOf = (index: number) => slot * index + slot / 2
  const hoveredStat = hovered === null ? null : stats[hovered]
  // La escala es la del máximo dibujado; con cero fallos no se divide por cero.
  const maxFailed = stats.reduce((top, stat) => Math.max(top, stat.failed), 0)
  const heightOf = (failed: number) =>
    maxFailed === 0 ? 0 : (failed / maxFailed) * (BASELINE - TOP)

  return (
    <ChartPanel
      title="Dónde se te cae"
      subtitle={`Días fallados, por día de la semana · ${rangeLabel}`}
      legend={
        most ? (
          <ChartLegend
            items={[
              { label: 'Días fallados', variant: 'swatchSeries' },
              { label: most.longLabel, variant: 'swatchAlert' },
            ]}
          />
        ) : (
          <ChartLegend items={[{ label: 'Días fallados', variant: 'swatchSeries' }]} />
        )
      }
      table={{
        caption: 'Días fallados, cumplidos y sin registro por día de la semana',
        columns: ['Día', 'Fallados', 'Cumplidos', 'Sin registro', 'Apariciones con registro'],
        rows: stats.map((stat) => ({
          key: stat.longLabel,
          cells: [
            stat.longLabel,
            String(stat.failed),
            String(stat.covered),
            String(stat.untracked),
            String(stat.tracked),
          ],
        })),
      }}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={
          most
            ? `Días fallados por día de la semana. Donde más se falla es ${most.longLabel}: ${most.failed} de ${most.tracked} apariciones con registro.`
            : 'Días fallados por día de la semana.'
        }
        onMouseLeave={() => setHovered(null)}
      >
        {stats.map((stat, index) => {
          if (stat.tracked === 0 || stat.failed === 0) return null
          const isMost = most?.weekday === stat.weekday
          const isComparable = stat.tracked >= MIN_TRACKED_PER_WEEKDAY
          const height = Math.max(2, heightOf(stat.failed))
          return (
            <rect
              key={stat.longLabel}
              className={isMost ? styles.barAlert : styles.bar}
              opacity={isMost ? 0.9 : isComparable ? 0.6 : 0.3}
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
          const isMost = most?.weekday === stat.weekday
          const height = stat.failed === 0 ? 0 : Math.max(2, heightOf(stat.failed))
          return (
            <g key={stat.longLabel}>
              <text
                className={`${styles.valueText} ${isMost ? styles.valueTextAlert : ''}`}
                x={centerOf(index)}
                y={BASELINE - height - 6}
                textAnchor="middle"
              >
                {stat.tracked > 0 ? String(stat.failed) : '—'}
              </text>
              <text
                className={styles.axisText}
                x={centerOf(index)}
                y={BASELINE + 16}
                textAnchor="middle"
              >
                {stat.label}
              </text>
              {isMost ? (
                <text
                  className={`${styles.tagText} ${styles.valueTextAlert}`}
                  x={centerOf(index)}
                  y={BASELINE + 30}
                  textAnchor="middle"
                >
                  más fallos
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

      {note ? <p className={styles.subtitle}>{note}</p> : null}

      {hoveredStat ? (
        <div
          className={styles.tooltip}
          style={{
            left: `${(centerOf(hovered!) / WIDTH) * 100}%`,
            top: `${((BASELINE - heightOf(hoveredStat.failed)) / HEIGHT) * 100}%`,
          }}
        >
          <span className={styles.tooltipTitle}>{hoveredStat.longLabel}</span>
          {hoveredStat.tracked > 0
            ? `${hoveredStat.failed} fallados de ${hoveredStat.tracked} con registro`
            : 'Sin ningún registro en este rango'}
          {hoveredStat.untracked > 0 ? ` · ${hoveredStat.untracked} sin registro` : ''}
        </div>
      ) : null}
    </ChartPanel>
  )
}
