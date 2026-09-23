import type { CSSProperties } from 'react'
import type { VidaGoalArc as VidaGoalArcData } from '@/features/vida/utils/vida-goals.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaGoalArc.module.scss'

type VidaGoalArcProps = {
  arc: VidaGoalArcData
  /** Un día que ya terminó: se pinta en pasado y sin proyección (criterio 497). */
  isPastDay: boolean
}

/** El icono de la meta cuando el catálogo no le puso ninguno. */
const FALLBACK_GOAL_ICON = 'circle-dot'

/**
 * **El arco de una meta** (FEAT-016, criterios 489–497), el panel 1 del render
 * aprobado (`docs/vida/assets/18-vida-arcos-familia.html:123-135`).
 *
 * Un **semicírculo con la hora en grande dentro**, no una barra ni un donut.
 * La geometría está copiada del render: `viewBox="0 0 220 124"`, dos veces el
 * mismo `path` —pista y trazo— con `pathLength="100"`, y el avance como
 * `stroke-dasharray`. Es el mismo truco de proporción por variable que usa
 * `VidaDayBudget` con sus anchos, aplicado a un arco.
 *
 * **Tonto como su vecino**: recibe el arco ya calculado y no llama a ningún
 * hook. Y **la meta es un dato**: el nombre, el icono, el color y los minutos
 * salen de `arc.goal`. Aquí dentro no hay ninguna constante «Trabajo» ni
 * ningún 480, y por eso el día que haya tres metas esto no se rediseña.
 *
 * **El SVG no es la única forma de leerlo, y solo se lee una vez** (la
 * costumbre de `ChartPanel` y su tabla oculta): el dibujo es **decorativo**
 * (`aria-hidden`) y la frase entera vive en **un solo** `<p>` de texto real.
 * Hasta la tajada 3 de FEAT-016 iban las dos cosas —el `role="img"` con su
 * `aria-label` y el mismo `<p>` a la vista—, así que la frase se oía dos veces
 * y se veía repetida bajo un arco que ya la dice dentro.
 *
 * **Ese `<p>` se ve o no según `arc.variant`, y sigue siendo uno solo**
 * (FEAT-019, criterios 560 y 564). Cuando el arco dice **lo que falta**
 * (`'missing'`) dentro ya no hay ninguna hora, así que la de parada —«A este
 * ritmo paras a las 17:55.»— se ve de verdad debajo, que es el sitio que le da
 * el render 20, panel 1. En `'passed'` y `'logged'` el arco ya dice una hora
 * dentro y la frase vuelve a ser solo para lectores de pantalla, como en el
 * render 18. **Lo que no se hace nunca es añadir un segundo `<p>`**: es
 * exactamente lo que se cerró en FEAT-016.
 *
 * Ese `<p>` **no lleva `role="alert"`** ni el ámbar o el rojo que el módulo
 * reserva para avisos, tampoco pasada la meta: el dato, sin reproche
 * (criterio 493).
 */
export function VidaGoalArc({ arc, isPastDay }: VidaGoalArcProps) {
  /** El estado que estrena FEAT-019: dentro del arco va lo que falta. */
  const isMissing = arc.variant === 'missing'
  const style = arc.goal.color
    ? ({ '--vida-goal-color': arc.goal.color } as CSSProperties)
    : undefined

  return (
    <article
      className={styles.card}
      data-past={isPastDay ? '' : undefined}
      style={style}
      aria-labelledby={`vida-goal-${arc.goal.id}`}
    >
      <p className={styles.head}>
        <span className={styles.label} id={`vida-goal-${arc.goal.id}`}>
          <span className={styles.capsule} aria-hidden>
            <AppIcon name={arc.goal.icon ?? FALLBACK_GOAL_ICON} size="sm" decorative />
          </span>
          {arc.goal.name}
        </span>
        <span className={styles.count}>
          <strong className={styles.countValue}>{arc.workedLabel}</strong> de {arc.targetLabel}
        </span>
      </p>

      <div className={styles.arc}>
        {/* Decorativo: lo que dice ya está en texto real justo debajo. */}
        <svg viewBox="0 0 220 124" aria-hidden>
          <path
            className={styles.trackPath}
            d="M22 106 A 88 88 0 0 1 198 106"
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="100"
          />
          {arc.share > 0 ? (
            <path
              className={styles.valuePath}
              d="M22 106 A 88 88 0 0 1 198 106"
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${arc.share * 100} 100`}
            />
          ) : null}
          {/* El rótulo baja hacia el número cuando es de una sola línea, para
              que el hueco de dentro del arco quede igual de repartido en los
              dos casos: con dos líneas se apoya en 58 y 71, con una en 70.

              **«Te faltan» es la excepción, y es la del render 20 (panel 1):
              66 y 34.** Medido a 375 px con `getComputedTextLength()`: con el
              rótulo en 70 y el número a 32 quedan **1,46** unidades de aire
              entre la base del rótulo y la cima del número; con 66 y 34 quedan
              **4,44**, y el número más grande sigue sobrando —«23h 59», el peor
              caso posible, ocupa 100,5 de las 145,6 unidades de cuerda que hay
              a su altura—. Esos 34 **no valen para los otros estados**: con el
              rótulo de dos líneas el número se come la segunda (−0,56, medido),
              y además los criterios 562 y 563 dicen que ahí no cambia nada. */}
          {arc.arcCaption.map((caption, index) => (
            <text
              key={caption}
              className={styles.caption}
              x="110"
              y={arc.arcCaption.length > 1 ? 58 + index * 13 : isMissing ? 66 : 70}
              textAnchor="middle"
              fontSize="9.5"
            >
              {caption}
            </text>
          ))}
          <text
            className={styles.value}
            x="110"
            y="101"
            textAnchor="middle"
            fontSize={isMissing ? 34 : 32}
          >
            {arc.arcValue}
          </text>
          <text className={styles.edge} x="18" y="121" textAnchor="start" fontSize="9.5">
            0h
          </text>
          <text className={styles.edge} x="202" y="121" textAnchor="end" fontSize="9.5">
            {arc.targetLabel}
          </text>
        </svg>
      </div>

      {/* La frase entera, en texto de verdad y **una sola vez**: el mismo nodo
          a la vista o a 1×1 px, nunca los dos (criterio 564). Visible solo
          cuando dentro del arco va lo que falta y la hora no cabe ahí
          (criterio 560). */}
      <p className={arc.variant === 'missing' ? styles.line : styles.srLine}>{arc.line}</p>

      {arc.runningTitle ? (
        <p className={styles.sub}>
          Cuenta <strong className={styles.subValue}>{arc.runningTitle}</strong>, en marcha desde
          las {arc.runningSince}.
        </p>
      ) : null}
    </article>
  )
}
