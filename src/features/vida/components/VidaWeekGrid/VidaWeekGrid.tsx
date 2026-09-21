import type { CSSProperties } from 'react'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  templateItemTitle,
  type TemplateWeekBlock,
  type TemplateWeekGrid,
} from '@/features/vida/utils/vida-template.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaWeekGrid.module.scss'

type VidaWeekGridProps = {
  /** Toda la geometría ya calculada (`buildTemplateWeekGrid`). */
  grid: TemplateWeekGrid
  /** El día de la semana de hoy: se marca, se esté mirando el que se esté. */
  today: VidaDayOfWeek
  /** El día que la pantalla tiene abierto; la columna se resalta un punto más. */
  selectedDay?: VidaDayOfWeek
  /** Tocar un bloque abre **la misma hoja** que la tarjeta del día (criterio 16). */
  onOpenItem?: (item: VidaItem) => void
}

/**
 * **La semana entera**: el rail de horas y las siete columnas, cada cosa a su
 * hora y con el alto de su duración (criterios 42–47, marco C del render).
 *
 * Es la pieza que no tenía hermana en el repositorio, y por eso hereda de
 * `VidaDayBudget` la regla que sí existía: **la aritmética vive en el util y
 * aquí solo se traducen números a estilos**. `top` y `height` llegan en
 * porcentaje sobre la **ventana común a las siete columnas** (A5) —una sola,
 * porque siete columnas con siete escalas distintas no se pueden comparar, que
 * es lo único para lo que sirve esta vista—.
 *
 * **Lo que se lee y lo que no:** el rail de horas y las rayas son decoración y
 * van `aria-hidden` —un lienzo no se lee—, pero **cada bloque es un botón con
 * su rótulo completo** («Bañarme · lunes a las 7:00 · 15 min»), que es la otra
 * mitad de la regla que el repositorio ya aplica en `ChartPanel` y en la barra
 * de Hoy: la imagen se acompaña siempre de algo que se puede leer y tabular. La
 * cuenta de cada columna va en el rótulo de su `section`.
 *
 * Un ítem **desactivado no desaparece**: se queda en su hora, en trazo
 * discontinuo, con «no sale en Hoy» en lo que se oye (criterio 45).
 */
export function VidaWeekGrid({ grid, today, selectedDay, onOpenItem }: VidaWeekGridProps) {
  return (
    <div className={styles.root}>
      {/* El único sitio que se desplaza en horizontal es **este contenedor**,
          nunca el cuerpo de la página (criterio 54). */}
      <div className={styles.scroller} tabIndex={0} role="group" aria-label="Tu semana entera">
        <div className={styles.grid}>
          <div className={styles.corner} aria-hidden />

          {grid.columns.map((column) => (
            <div
              key={`head-${column.day}`}
              className={styles.head}
              data-today={column.day === today ? 'true' : undefined}
              data-selected={column.day === selectedDay ? 'true' : undefined}
              aria-hidden
            >
              <b className={styles.headDay}>{VIDA_DAY_SHORT_LABELS[column.day]}</b>
              <small className={styles.headCount}>
                {column.count} · {formatDurationFromMinutes(column.plannedMinutes)}
              </small>
            </div>
          ))}

          {/* El rail: las horas en punto, cada dos horas. Decorativo: lo que se
              oye de cada bloque ya lleva su hora dentro. */}
          <div className={styles.hours} aria-hidden>
            {grid.hourMarks.map((mark) => (
              <i key={mark.minutes} className={styles.hour} style={{ top: `${mark.topPercent}%` }}>
                {mark.label}
              </i>
            ))}
          </div>

          {grid.columns.map((column) => (
            <section
              key={`col-${column.day}`}
              className={styles.column}
              data-today={column.day === today ? 'true' : undefined}
              data-selected={column.day === selectedDay ? 'true' : undefined}
              aria-label={`${VIDA_DAY_LABELS[column.day]}${
                column.day === today ? ', hoy' : ''
              } · ${column.count} ${column.count === 1 ? 'cosa' : 'cosas'} · ${formatDurationFromMinutes(
                column.plannedMinutes,
              )}`}
            >
              {grid.hourMarks.map((mark) => (
                <span
                  key={`ln-${column.day}-${mark.minutes}`}
                  className={styles.line}
                  style={{ top: `${mark.topPercent}%` }}
                  aria-hidden
                />
              ))}

              {column.blocks.map((block) => (
                <Block
                  key={block.item.id}
                  block={block}
                  onOpenItem={onOpenItem}
                />
              ))}
            </section>
          ))}

          <div className={[styles.foot, styles.footLabel].join(' ')} aria-hidden>
            sin hora
          </div>

          {/* Debajo de cada columna, los suyos. **Una columna sin ellos no
              pinta nada** (criterio 44). */}
          {grid.columns.map((column) => (
            <div key={`foot-${column.day}`} className={styles.foot}>
              {column.untimed.map((item) => {
                const label = `${templateItemTitle(item)} · ${
                  VIDA_DAY_LABELS[column.day]
                } · sin hora`
                const content = (
                  <>
                    <AppIcon
                      name={item.activity?.category?.icon ?? UNCATEGORIZED_GROUP_ICON}
                      size="xs"
                      decorative
                    />
                    <span className={styles.pillName}>{templateItemTitle(item)}</span>
                  </>
                )
                return onOpenItem ? (
                  <button
                    key={item.id}
                    type="button"
                    className={[styles.pill, styles.pillButton].join(' ')}
                    aria-label={label}
                    onClick={() => onOpenItem(item)}
                  >
                    {content}
                  </button>
                ) : (
                  <span key={item.id} className={styles.pill} title={label}>
                    {content}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* La leyenda (criterio 45): un color por categoría **de las que
          aparecen**, y lo que significa el trazo punteado. */}
      <ul className={styles.legend}>
        {grid.categories.map((category) => (
          <li key={category.id} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={
                category.color
                  ? ({ '--vida-category-color': category.color } as CSSProperties)
                  : undefined
              }
              aria-hidden
            />
            {category.name}
          </li>
        ))}
        <li className={styles.legendItem}>
          <span className={[styles.swatch, styles.swatchOff].join(' ')} aria-hidden />
          trazo punteado = desactivada · no sale en Hoy
        </li>
      </ul>
    </div>
  )
}

function Block({
  block,
  onOpenItem,
}: {
  block: TemplateWeekBlock
  onOpenItem?: (item: VidaItem) => void
}) {
  const item = block.item
  const category = item.activity?.category ?? null
  const isInactive = item.isActive === false
  // Los carriles reparten el ancho para que **dos que se pisan se vean los
  // dos** (criterio 47): ninguno se oculta ni se recorta hasta desaparecer.
  const style = {
    top: `${block.topPercent}%`,
    height: `${block.heightPercent}%`,
    left: `calc(${(block.lane / block.laneCount) * 100}% + 0.15rem)`,
    width: `calc(${100 / block.laneCount}% - 0.3rem)`,
    ...(category?.color ? { '--vida-category-color': category.color } : {}),
  } as CSSProperties

  const inner = (
    <>
      {/* La hora encima del nombre **solo si cabe** (`showTime`): en un bloque
          corto las dos líneas se recortarían y no se leería ninguna. La hora
          sigue en el rail y en el rótulo que se lee. */}
      {block.showTime ? (
        <span className={styles.blockTime} aria-hidden>
          {formatTimeForDisplay(minutesToTime(block.startMinutes))}
          {block.durationMinutes !== null
            ? ` · ${formatDurationFromMinutes(block.durationMinutes)}`
            : ''}
        </span>
      ) : null}
      <span className={styles.blockName} aria-hidden>
        {templateItemTitle(item)}
      </span>
    </>
  )

  if (!onOpenItem) {
    return (
      <div className={styles.block} style={style} data-inactive={isInactive ? 'true' : undefined}>
        <span className={styles.srOnly}>{block.label}</span>
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={[styles.block, styles.blockButton].join(' ')}
      style={style}
      data-inactive={isInactive ? 'true' : undefined}
      // El rótulo completo: qué, qué día, a qué hora y cuánto. Una cuadrícula
      // de bloques iguales no se puede navegar con «botón».
      aria-label={`Abrir ${block.label}`}
      title={block.label}
      onClick={() => onOpenItem(item)}
    >
      {inner}
    </button>
  )
}
