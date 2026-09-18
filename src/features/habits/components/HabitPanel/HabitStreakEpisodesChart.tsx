import { useState } from 'react'
import type { StreakEpisode } from '@/features/habits/utils/habit-panel.utils'
import { MAX_STREAK_EPISODES } from '@/features/habits/utils/habit-panel.utils'
import { ChartLegend, ChartPanel } from './ChartPanel'
import styles from './charts.module.scss'

const WIDTH = 640
const HEIGHT = 150
const TOP = 42
const BASELINE = 108
const MAX_BAR_WIDTH = 70

type Props = {
  episodes: StreakEpisode[]
}

function plural(length: number): string {
  return length === 1 ? '1 día' : `${length} días`
}

/**
 * Cada barra es un episodio con principio y fin; los huecos entre barras son
 * las roturas. El récord se distingue en violeta **y** va rotulado.
 */
export function HabitStreakEpisodesChart({ episodes }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const truncated = episodes.length > MAX_STREAK_EPISODES
  const visible = truncated ? episodes.slice(-MAX_STREAK_EPISODES) : episodes
  const longest = visible.reduce((max, episode) => Math.max(max, episode.length), 1)

  const slot = WIDTH / visible.length
  const barWidth = Math.min(MAX_BAR_WIDTH, Math.max(8, slot - 14))
  const centerOf = (index: number) => slot * index + slot / 2
  const heightOf = (length: number) => Math.max(3, (length / longest) * (BASELINE - TOP))
  const hoveredEpisode = hovered === null ? null : visible[hovered]

  return (
    <ChartPanel
      title="Tus rachas, una a una"
      subtitle={
        truncated
          ? `Cada barra es una racha completa. Los huecos son las veces que se rompió. Se muestran las últimas ${MAX_STREAK_EPISODES} de ${episodes.length}.`
          : 'Cada barra es una racha completa. Los huecos son las veces que se rompió.'
      }
      legend={
        <ChartLegend
          items={[
            { label: 'Racha', variant: 'swatchSeries' },
            { label: 'Récord del rango', variant: 'swatchAccent' },
          ]}
        />
      }
      table={{
        caption: 'Rachas del rango',
        columns: ['Racha', 'Desde', 'Hasta', 'Duración', 'Nota'],
        rows: visible.map((episode) => ({
          key: episode.startDate,
          cells: [
            episode.label,
            episode.startDate,
            episode.endDate,
            plural(episode.length),
            [episode.isRecord ? 'récord' : '', episode.isCurrent ? 'en curso' : '']
              .filter(Boolean)
              .join(' · ') || '—',
          ],
        })),
      }}
    >
      <svg
        className={`${styles.svg} ${styles.wide}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${visible.length} rachas. La más larga del rango dura ${plural(longest)}.`}
        onMouseLeave={() => setHovered(null)}
      >
        <line className={styles.baseline} x1={0} y1={BASELINE} x2={WIDTH} y2={BASELINE} />

        {visible.map((episode, index) => {
          const height = heightOf(episode.length)
          const top = BASELINE - height
          const tag = episode.isRecord ? 'récord' : episode.isCurrent ? 'en curso' : null
          return (
            <g key={episode.startDate}>
              <rect
                className={episode.isRecord ? styles.barAccent : styles.bar}
                opacity={episode.isRecord || episode.isCurrent ? 0.85 : 0.4 + (episode.length / longest) * 0.35}
                x={centerOf(index) - barWidth / 2}
                y={top}
                width={barWidth}
                height={height}
                rx={4}
              />
              <text
                className={`${styles.valueText} ${episode.isRecord ? styles.valueTextAccent : ''}`}
                x={centerOf(index)}
                y={top - 8}
                textAnchor="middle"
              >
                {episode.length}
              </text>
              {tag ? (
                <text
                  className={`${styles.tagText} ${episode.isRecord ? styles.valueTextAccent : styles.valueTextStrong}`}
                  x={centerOf(index)}
                  y={top - 26}
                  textAnchor="middle"
                >
                  {tag}
                </text>
              ) : null}
              <text
                className={`${styles.axisText} ${styles.denseAxis}`}
                x={centerOf(index)}
                y={BASELINE + 18}
                textAnchor="middle"
              >
                {episode.label}
              </text>
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

      {hoveredEpisode ? (
        <div
          className={styles.tooltip}
          style={{
            left: `${(centerOf(hovered!) / WIDTH) * 100}%`,
            top: `${((BASELINE - heightOf(hoveredEpisode.length)) / HEIGHT) * 100}%`,
          }}
        >
          <span className={styles.tooltipTitle}>{plural(hoveredEpisode.length)} seguidos</span>
          Del {hoveredEpisode.startDate} al {hoveredEpisode.endDate}
          {hoveredEpisode.isRecord ? ' · récord' : ''}
          {hoveredEpisode.isCurrent ? ' · en curso' : ''}
        </div>
      ) : null}
    </ChartPanel>
  )
}
