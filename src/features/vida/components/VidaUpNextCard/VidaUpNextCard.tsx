import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties, FocusEvent } from 'react'
import type { UpNext } from '@/features/vida/utils/vida-up-next.utils'
import { VidaNoteLine } from '@/features/vida/components/VidaNoteLine'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { VIDA_NOTE_QUESTION_NEXT } from '@/features/vida/utils/vida-notes.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './VidaUpNextCard.module.scss'

type VidaUpNextCardProps = {
  upNext: UpNext
  /** **Un toque y ya**: arranca la sesión. Sin hoja, sin confirmar (criterio 374). */
  onStart: () => void
  /** «Empezar otra cosa»: la **misma** hoja de siempre, `mode: 'start'` (187). */
  onStartSomethingElse: () => void
  /** «Ver las otras N»: la misma hoja, que ya pone la plantilla del día arriba. */
  onSeeOthers: () => void
  /** Hay una sesión en vuelo: dos toques no crean dos sesiones (criterio 188). */
  isSessionBusy?: boolean

  /* ── «Antes de empezar» (FEAT-018, tajada 3) ────────────────────────────
   *
   * Aditivo: sin `onEditNote` la tarjeta se pinta **exactamente** como la
   * entregó FEAT-010. Y no abre ninguna puerta nueva: sigue sin ver el
   * `activityId`, la hora de la plantilla ni la duración planeada. Lo que
   * entra es un texto y dos funciones.
   */

  /** Lo que ya se escribió para este arranque. Vive en la pantalla, no en el API. */
  noteDraft?: string | null
  /** Abre el editor de «¿Qué vas a hacer?». Sin esto, la línea no se pinta. */
  onEditNote?: () => void

  /* ── «Lo que sueles hacer» (FEAT-018, tajada 4) ─────────────────────────── */

  /**
   * La nota del **ítem de plantilla** del que viene esto: lo que sueles hacer
   * ahí, no lo de hoy. Se pinta en una línea **aparte** de `metaLine`, que no
   * se toca ni se sustituye (criterio 555), y es de solo lectura: se escribe
   * en la hoja del ítem, en Plantilla.
   *
   * **No es el texto con el que nace la sesión.** El «▶ Empezar» no lo mira:
   * la propuesta solo llega al editor si alguien lo abre (criterio 557), y eso
   * ocurre fuera de esta tarjeta, en la pantalla que la monta.
   */
  templateNote?: string | null
}

/**
 * **«Lo que viene»**: la tarjeta que dice qué toca después y lo arranca de un
 * clic (FEAT-010, render `docs/vida/assets/14-vida-lo-que-viene.html`).
 *
 * Es un `<li>` hermano dentro del mismo `<ol>` de la agenda —el camino que
 * abrió `VidaBlockHint` y que sigue `VidaAgendaNoData`—, **justo debajo de lo
 * que está pasando** (criterio 370). Cuelga de otra fila **sin tocarla**: el
 * bloque propuesto se queda en la lista, en su hora y con su «▶ Empezar», y
 * esta tarjeta es **una segunda entrada al mismo gesto**, no una mudanza
 * (criterio 211).
 *
 * Cuatro cosas que no son de estilo:
 *
 * 1. **La hora de la izquierda es la de la plantilla, en gris** (criterio 371).
 *    Es un **dato** —dónde debería caer—, no dónde va a caer ni una clave de
 *    orden: la tarjeta va donde va por estructura, aunque su hora sea anterior a
 *    la marca de AHORA.
 * 2. **La frase de verdad va siempre** (criterio 373), no solo cuando el número
 *    asusta, y **no se pinta ninguna hora de fin estimada**. Es el criterio que
 *    existe porque el usuario no pulsaba: si vuelve a leerse como una reserva,
 *    la feature no sirve.
 * 3. **Trazo mint, punto punteado**: se distingue de una fila normal, de la
 *    línea de AHORA (violeta sólido) y del aviso punteado violeta de FEAT-007
 *    (criterio 214). **Nunca trazo punteado violeta.**
 * 4. **El foco sobrevive a la mudanza** (criterios 205 y 379). La tarjeta es un
 *    `<li>` con `key` constante, así que React la **mueve** en vez de
 *    remontarla… pero **mover un nodo que contiene al elemento enfocado manda
 *    el foco a `body`** (medido en Chromium: el movimiento no dispara ni
 *    `blur` ni `focusout`, simplemente `document.activeElement` pasa a ser
 *    `body`). Por eso la tarjeta se acuerda de qué llevaba el foco y se lo
 *    devuelve cuando cambia de ancla.
 *
 * **FEAT-018 le añade la nota de antes de empezar**, y no cambia nada de lo de
 * arriba: la línea entra **encima** del botón, el botón sigue ocupando la fila
 * entera con el mismo tamaño y la misma palabra, y `onStart` sigue siendo
 * `() => void` — la tarjeta no ve `activityId`, ni hora, ni duración, ni sabe
 * dónde se guarda lo que se escribe.
 *
 * Y el que manda sobre todos: **el botón manda `start(activityId)` y nada más**.
 * Ni la duración planeada ni la hora de la plantilla viajan a la sesión — el
 * cronómetro nace en el segundo del toque y se registra lo que dure de verdad.
 */
export function VidaUpNextCard({
  upNext,
  onStart,
  onStartSomethingElse,
  onSeeOthers,
  isSessionBusy = false,
  noteDraft = null,
  onEditNote,
  templateNote = null,
}: VidaUpNextCardProps) {
  /** Lo escrito, ya limpio: en blanco **no hay nota**, y el control es el lápiz. */
  const draft = noteDraft && noteDraft.trim() ? noteDraft.trim() : null

  const colorStyle = upNext.color
    ? ({ '--vida-category-color': upNext.color } as CSSProperties)
    : undefined

  /** Lo último que llevó el foco **dentro** de la tarjeta, para devolvérselo. */
  const focusedRef = useRef<HTMLElement | null>(null)
  /** El ancla de la que colgaba: cambiar de ancla **es** la mudanza (379). */
  const anchorRef = useRef(upNext.anchorId)

  /**
   * **Que el foco no acabe en `body` cuando la tarjeta cambia de sitio**
   * (criterio 205, su segunda mitad).
   *
   * Medido en el Chromium del panel, no deducido: `ol.insertBefore(li, …)` con
   * un botón de dentro enfocado deja `document.activeElement === document.body`
   * y **no dispara ningún evento de foco**. Como el movimiento es mudo, la
   * memoria de `focusedRef` sigue en pie y basta con volver a enfocar **en el
   * mismo commit** (`useLayoutEffect`, antes de que el navegador pinte): la
   * misma medida confirma que enfocar de nuevo funciona y que enfocar lo que ya
   * está enfocado no dispara nada.
   *
   * Tres cautelas para **no robar** el foco:
   *
   * - Solo se actúa cuando **cambia el ancla**; un tic de reloj no mueve nada y
   *   no toca el foco.
   * - Si el foco lo tiene ya **otro elemento**, no se le quita.
   * - `focusedRef` se olvida en cuanto el foco se va a un elemento de fuera
   *   (`focusout` con `relatedTarget`). Un `relatedTarget` vacío **no** borra la
   *   memoria: es lo que emite jsdom al mover el nodo, y el navegador real no
   *   emite nada.
   */
  useLayoutEffect(() => {
    const previousAnchor = anchorRef.current
    anchorRef.current = upNext.anchorId
    if (previousAnchor === upNext.anchorId) return

    const target = focusedRef.current
    if (target === null || !target.isConnected) return
    const active = document.activeElement
    if (active !== null && active !== document.body && active !== target) return
    // `preventScroll` porque devolver el foco **no puede mover la pantalla**
    // (criterio 379): si el foco acabó en `body` sin `relatedTarget` —un clic
    // en zona no enfocable— y justo después cambia el ancla, sin esto la vuelta
    // del foco arrastraría la tarjeta a la vista de quien estaba leyendo otra
    // cosa.
    target.focus({ preventScroll: true })
  }, [upNext.anchorId])

  const rememberFocus = (event: FocusEvent<HTMLLIElement>) => {
    focusedRef.current = event.target
  }

  const forgetFocusIfItLeft = (event: FocusEvent<HTMLLIElement>) => {
    const next = event.relatedTarget
    if (next !== null && !event.currentTarget.contains(next)) focusedRef.current = null
  }

  return (
    <li
      className={styles.row}
      style={colorStyle}
      onFocus={rememberFocus}
      onBlur={forgetFocusIfItLeft}
    >
      <span className={styles.gutter}>
        {upNext.gutterLabel ? (
          <time className={styles.time} dateTime={upNext.gutterTime}>
            {upNext.gutterLabel}
          </time>
        ) : null}
        <span className={styles.tick} aria-hidden />
      </span>

      <section className={styles.card} aria-label={upNext.regionLabel}>
        {/* El rótulo es **siempre** «Lo que viene»: es el nombre de la región,
            no una noticia. Aquí no va `aria-live` — una región viva cuyo texto
            nunca cambia no anuncia nada (criterio 207). */}
        <p className={styles.kicker}>{upNext.kicker}</p>

        {/* **El lápiz, en la esquina y fuera del flujo** (criterio 548). El
            rótulo «Lo que viene» ocupa 77 px de los 278 de la tarjeta y la
            fila del nombre no empieza hasta 21 px más abajo: ahí cabe sin
            empujar nada, así que **con el control vacío el «▶ Empezar» queda
            exactamente donde estaba y con el tamaño que tenía**. Ni al lado
            del botón —le quitaría 46 px de ancho— ni encima de él —lo bajaría
            48 px—: las dos formas cambian el botón en el estado que se ve
            todos los días. */}
        {upNext.canStart && onEditNote && !draft ? (
          <button
            type="button"
            className={styles.cornerNote}
            onClick={onEditNote}
            aria-label={`${VIDA_NOTE_QUESTION_NEXT} ${upNext.title}`}
          >
            <span aria-hidden>✎</span>
          </button>
        ) : null}

        <div className={styles.who}>
          <span className={styles.capsule} aria-hidden>
            <AppIcon name={upNext.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
          </span>
          <div className={styles.body}>
            {/* **El titular es lo que cambia**, y por eso es lo único que vive
                en `aria-live="polite"`: al pasar de «Bañarme» a «Leer un rato»
                el lector lo dice; un tic de reloj no lo toca y no se anuncia
                (criterio 207). Nunca `assertive` ni `role="alert"`.
                Y `title` deja el nombre completo disponible cuando el ellipsis
                lo recorta (criterio 213). */}
            <p className={styles.name} title={upNext.title} aria-live="polite">
              {upNext.title}
            </p>
            <p className={styles.meta}>{upNext.metaLine}</p>
            {/* **Lo que sueles hacer ahí** (criterio 555), debajo de la hora y
                la duración planeada y **sin sustituirlas**: son dos datos
                distintos de la misma plantilla. De solo lectura: esta nota se
                escribe en la hoja del ítem. */}
            <VidaNoteLine text={templateNote} tone="plan" />
          </div>
        </div>

        {/* **Escrita, encima del botón** (criterio 551), tal como la dibuja el
            render: la línea mint se lee y se cambia tocándola. Solo aparece
            cuando hay algo escrito; en blanco el control es el lápiz de la
            esquina, que no ocupa sitio. */}
        {upNext.canStart && onEditNote && draft ? (
          <VidaNoteLine
            text={draft}
            onEdit={onEditNote}
            tone="running"
            question={VIDA_NOTE_QUESTION_NEXT}
          />
        ) : null}

        {upNext.canStart ? (
          <button
            type="button"
            className={styles.play}
            onClick={onStart}
            disabled={isSessionBusy}
            aria-label={upNext.buttonSrLabel}
          >
            <span aria-hidden>▶</span> {upNext.buttonLabel}
          </button>
        ) : (
          // Sin poder empezar no se pinta un botón que no va a funcionar: se
          // dice en una línea qué falta (criterio 189). Sin spinner eterno.
          <p className={styles.blocked}>{upNext.blockedNote}</p>
        )}

        <p className={styles.truth}>
          <span className={styles.truthDot} aria-hidden />
          <span>{upNext.truthLine}</span>
        </p>

        {/* Las salidas, **debajo y en pequeño**, sin competir con el botón y
            **ninguna en un menú** (criterio 376). */}
        <p className={styles.exits}>
          {upNext.exits.othersCount > 0 ? (
            <button type="button" className={styles.exit} onClick={onSeeOthers}>
              Ver las otras {upNext.exits.othersCount}
            </button>
          ) : null}
          <button type="button" className={styles.exit} onClick={onStartSomethingElse}>
            Empezar otra cosa
          </button>
        </p>
      </section>
    </li>
  )
}
