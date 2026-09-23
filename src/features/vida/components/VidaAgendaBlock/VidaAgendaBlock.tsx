import type { CSSProperties } from 'react'
import { VidaBlockOutcomes } from '@/features/vida/components/VidaBlockOutcomes'
import { VidaNoteLine } from '@/features/vida/components/VidaNoteLine'
import { VidaPlanVsRealBar } from '@/features/vida/components/VidaPlanVsRealBar'
import { useRemoveDayPlanItemMutation } from '@/features/vida/hooks/useActivityDayPlan'
import { useDeleteActivityFollowUpMutation } from '@/features/vida/hooks/useActivityFollowUps'
import { useVidaElapsed } from '@/features/vida/hooks/useVidaElapsed'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { AgendaBlock } from '@/features/vida/utils/vida-agenda.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import type {
  BlockExecution,
  BlockInstead,
  BlockMissingStatus,
} from '@/features/vida/utils/vida-execution.utils'
import {
  VIDA_NOTE_ADD_LABEL,
  VIDA_NOTE_QUESTION_NEXT,
  VIDA_NOTE_QUESTION_RUNNING,
} from '@/features/vida/utils/vida-notes.utils'
import { describeOverPlan } from '@/features/vida/utils/vida-session.utils'
import {
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { IconButton } from '@/shared/ui/IconButton'
import { Popover } from '@/shared/ui/Popover'
import styles from './VidaAgendaBlock.module.scss'

type VidaAgendaBlockProps = {
  block: AgendaBlock
  /** Es el primero que aún no ha empezado: lleva el «en N min» (criterio 16). */
  isNext?: boolean
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes?: number | null
  /**
   * `YYYY-MM-DD` del día del bloque: `activityDayPlanItemRemove` devuelve
   * `Boolean!` sin fecha, así que la invalidación la sostiene quien llama.
   * Sin fecha no se pinta el «···»: un menú que no puede escribir no se pinta.
   */
  date?: string | null
  /** «Cambiar hora o duración»: abre la hoja con la ventana del bloque (criterio 30). */
  onEdit?: (block: AgendaBlock) => void

  /* ── La sesión viva (FEAT-004, tajada 1) ────────────────────────────────
   *
   * Todo esto es **aditivo**: sin ninguna de estas props el bloque se pinta
   * exactamente como lo dejó FEAT-003, que es lo que pasa en un día futuro, en
   * uno pasado y en cualquier pantalla que no cablee la sesión.
   */

  /** «▶ Empezar» (criterios 1 y 2). Sin esto no se pinta: no se empieza el pasado ni el futuro. */
  onStart?: (block: AgendaBlock) => void
  /** Este bloque es el que está en marcha ahora mismo. */
  isRunning?: boolean
  /** El instante en que empezó la sesión: lo que cuenta el cronómetro (criterio 3). */
  sessionStartInstant?: Date | null
  /** «Terminar», de un solo toque (criterio 5). */
  onFinish?: () => void
  /** El cierre completo: duración, notas y subtareas (criterio 6). */
  onOpenFinishModal?: () => void
  /** Una mutación de sesión en vuelo: los botones se inhabilitan (criterio 13). */
  isSessionBusy?: boolean

  /**
   * Lo que pasó **en este bloque** (FEAT-004, tajada 2). También aditivo: sin
   * esto el bloque se pinta como lo dejó FEAT-003, que es lo que ocurre en un
   * día futuro y en uno sin nada registrado (criterios 27 y 29).
   */
  execution?: BlockExecution | null

  /* ── Lo que falta (FEAT-004, tajada 4) ──────────────────────────────────
   *
   * Aditivo también: sin nada de esto el bloque se pinta como lo dejó la
   * tajada 2. Nada de aquí se afirma mientras lo vivido no haya cargado
   * (criterios 57 y 58): quien no sabe, no pasa `missing`.
   */

  /** «Pendiente» al pasar su hora, «no hecho» al cerrarse el día (criterio 39). */
  missing?: BlockMissingStatus | null
  /** «En su lugar, X», con la vía a la sesión que sí ocurrió (criterio 42). */
  instead?: BlockInstead | null
  /** «No se pudo» y su razón, que viven en **este aparato** (criterios 43 y 44). */
  couldNot?: { reason: string | null } | null
  /** Las tres salidas (criterio 40). Sin esto no se pintan. */
  outcomes?: {
    onDid: () => void
    onDidSomethingElse: () => void
    onCouldNot: (reason: string | null) => void
    onClearCouldNot: () => void
    isBusy?: boolean
  } | null
  /**
   * **«Corregir»** la sesión de este bloque (criterios 35 y 41). Sin esto el
   * «···» no ofrece nada de la sesión — que es lo que pasa en un día futuro.
   */
  onEditSession?: (session: ActivityFollowUp) => void

  /* ── «Qué hiciste» (FEAT-018, tajada 1) ─────────────────────────────────
   *
   * Aditivo: sin estas dos props el bloque se pinta exactamente como antes.
   */

  /** Lo que se escribió en la sesión de este bloque (criterios 535 y 542). */
  note?: string | null
  /**
   * Abre el editor de la nota. **Sin esto no se ofrece nada** (criterio 537):
   * en un día futuro la línea no existe.
   *
   * **Con el bloque en marcha la pregunta cambia** (criterios 532 y 542): se
   * lee «¿Qué estás haciendo?» en vez de «＋ añadir qué hiciste», que es lo
   * que se pregunta de algo que ya terminó. El «＋ añadir qué hiciste» del
   * criterio 537 **nunca** aparece sobre una sesión en marcha.
   */
  onEditNote?: () => void

  /* ── «Antes de empezar» (FEAT-018, tajada 3) ────────────────────────────
   *
   * Aditivo otra vez, y con una regla encima de todas: **el «▶ Empezar» no
   * cambia de tamaño, ni de palabra, ni de comportamiento** (criterios 534,
   * 548 y 550). El control es **otro botón**, pequeño y al lado; quien no lo
   * toque arranca con un toque, exactamente como antes.
   */

  /** Lo que se escribió **antes** de arrancar este bloque; vive en la pantalla, no en el API. */
  noteDraft?: string | null
  /**
   * Abre el editor de «¿Qué vas a hacer?». **Sin esto no se pinta el lápiz**:
   * en un día pasado, en uno futuro y en un bloque que ya tiene sesión no hay
   * nada que escribir por adelantado.
   *
   * Con el borrador **vacío no se pinta ninguna línea** en el cuerpo: un
   * hueco gris en cada bloque del día sería el ruido diario que el render
   * descarta para las sesiones sin nota. Basta el lápiz del final de la
   * línea de la hora —**no al lado del botón**: medido, ahí le quitaba 43 px
   * de sitio al «▶ Empezar» a 760 px, y el criterio 548 lo prohíbe—.
   */
  onEditStartNote?: () => void
}

/**
 * Un bloque del plan: hora, icono y color de su categoría, nombre y duración.
 *
 * El icono y el color salen de `item.activity.category`, que **ya viaja dentro
 * del plan del día** (`activity-day-plan.graphql.ts` selecciona
 * `category { id name color icon }`). Por eso aquí no hace falta el cruce por
 * `Map` con las categorías que hace `VidaActividadesPage`: el dato viene
 * pegado al bloque y una consulta menos es una consulta menos.
 *
 * **Desde FEAT-004 también se vive el día**, y todo lo de vivirlo es **aditivo**:
 * sin las props de sesión el bloque se pinta exactamente como lo dejó FEAT-003,
 * que es lo que pasa en un día futuro, en uno pasado y en cualquier pantalla que
 * no cablee la sesión. Lo que añade: **«▶ Empezar»** (criterios 1 y 2), el
 * estado **«planeado 45 min · en marcha»** con el **cronómetro** (criterio 3),
 * **«Terminar»** de un toque (criterio 5), el aviso de que te pasaste **sin
 * interrumpir** (criterio 9) y, en el «···», **«Terminar y añadir una nota»**
 * (criterio 6).
 *
 * El cronómetro lo cuenta `useVidaElapsed` **contra el instante de inicio de la
 * sesión**, no contra el montaje: recargar la página no lo reinicia. Y solo el
 * bloque en marcha monta un intervalo; los demás pasan `null`.
 *
 * **Desde la tajada 2 enseña también lo que pasó** (prop `execution`, que sale
 * del cruce de D1 en `vida-execution.utils.ts`): «✓ calcado», «empezó +5»,
 * «+18 min», las **horas reales** en vez de la duración planeada, la barrita
 * **plan frente a real** y, en el movido, la **sombra** en la hora planeada con
 * «→ hecho a las 19:40» (criterios 20, 21 y 23). El bloque **no se mueve de su
 * hora** por nada de esto (criterios 18 y 55), y sin `execution` se pinta
 * exactamente como lo dejó FEAT-003.
 *
 * Lo que **no** hace todavía: «pendiente» y «no hecho», las tres salidas y la
 * razón de «no se pudo». Eso es la **tajada 4** (criterios 39 a 45).
 *
 * En pantalla se lee **«Quitar del plan»**: nunca «cancelar» ni «eliminar»
 * (criterio 30, heredado del 25 de FEAT-002). Y la salida del diálogo es
 * «Volver», igual que al archivar en el catálogo.
 *
 * El menú se monta como en `VidaActivityCard`: `Popover` + `IconButton`, y la
 * mutación vive **aquí**, no en la página, por el mismo motivo que allí —el
 * confirmar y el quitar son una sola decisión y no hay nada que la página
 * necesite saber—. Cambiar hora o duración sí sube: la hoja es de la página.
 */
export function VidaAgendaBlock({
  block,
  isNext = false,
  nowMinutes = null,
  date = null,
  onEdit,
  onStart,
  isRunning = false,
  sessionStartInstant = null,
  onFinish,
  onOpenFinishModal,
  isSessionBusy = false,
  execution = null,
  missing = null,
  instead = null,
  couldNot = null,
  outcomes = null,
  onEditSession,
  note = null,
  onEditNote,
  noteDraft = null,
  onEditStartNote,
}: VidaAgendaBlockProps) {
  const { confirm } = useConfirmDialog()
  const removeMutation = useRemoveDayPlanItemMutation()
  // Quitar la sesión de este bloque vive **aquí** por el mismo motivo que
  // quitar el bloque del plan: confirmar y quitar son una sola decisión y no
  // hay nada que la página necesite saber. Es el mismo hook que usa
  // `VidaAgendaSession` para lo suelto, así que la invalidación es la misma.
  const removeSessionMutation = useDeleteActivityFollowUpMutation()
  // Solo tictaquea el bloque que está en marcha: los demás pasan `null` y el
  // hook no monta ningún intervalo (criterio 4).
  /** Lo escrito antes de empezar, ya limpio: en blanco el control es el lápiz. */
  const startDraft = noteDraft && noteDraft.trim() ? noteDraft.trim() : null

  const elapsed = useVidaElapsed(isRunning ? sessionStartInstant : null)
  const category = block.item.activity?.category ?? null
  const colorStyle = category?.color
    ? ({ '--vida-category-color': category.color } as CSSProperties)
    : undefined
  const startsIn = nowMinutes === null ? null : block.startMinutes - nowMinutes
  const title = block.item.activity?.title ?? 'Actividad'
  // El criterio 16 pide «en N min» y eso es lo que se lee dentro de la hora
  // siguiente. Más allá, «en 920 min» no se lee: se usa el formateador largo
  // que ya existe y queda «en 15 h 20 min» (hallazgo 4 del revisor).
  // «llevas 52 min · planeado 45». Solo cuando hay sesión y solo cuando se pasa.
  const overPlan = isRunning ? describeOverPlan(elapsed.minutes, block.durationMinutes) : null
  const soonLabel =
    startsIn === null || startsIn <= 0
      ? null
      : startsIn < 60
        ? `en ${startsIn} min`
        : `en ${formatDurationMinutes(startsIn)}`

  async function handleRemove() {
    if (!date) return
    const ok = await confirm({
      title: `¿Quitar «${title}» de tu plan?`,
      description:
        'Sale del plan de este día y el rato vuelve a quedar libre. Sigue en tu catálogo y en tu plantilla.',
      confirmLabel: 'Quitar del plan',
      cancelLabel: 'Volver',
    })
    if (!ok) return
    removeMutation.mutate({ itemId: block.item.id, date })
  }

  // La sesión de **este** bloque: la que le asignó el cruce de D1, ya cerrada.
  // Da igual cómo naciera —«▶ Empezar» y «Terminar», «Lo hice», o registrada a
  // mano—: lo que se corrige es la sesión, no la puerta por la que entró.
  const blockSession = execution && !execution.isRunning ? execution.span.session : null
  const canManageSession = Boolean(blockSession && onEditSession)

  /**
   * «Quitar del registro» (criterios 35 y 41). Es también **el deshacer de «Lo
   * hice»**: quitada la sesión, el bloque vuelve a estar no hecho, que es lo
   * que dice el criterio 41 con todas las letras.
   */
  async function handleRemoveSession() {
    if (!blockSession) return
    const ok = await confirm({
      title: `¿Quitar «${title}» del registro?`,
      description:
        'Se va ese rato y el bloque vuelve a quedar sin hacer. Tu plan no se toca: sigue en su hora.',
      confirmLabel: 'Quitar del registro',
      cancelLabel: 'Volver',
    })
    if (!ok) return
    removeSessionMutation.mutate({
      id: blockSession.id,
      date: blockSession.date,
      activityId: blockSession.activityId,
      wasOpen: false,
    })
  }

  const menu = (
    <ul className={styles.menu}>
      {isRunning && onOpenFinishModal ? (
        <li>
          <button type="button" className={styles.menuItem} onClick={onOpenFinishModal}>
            Terminar y añadir una nota
          </button>
        </li>
      ) : null}
      {/* Lo de la **sesión** va primero: cuando el bloque ya tiene su rato
          registrado, corregirlo es lo que se viene a hacer aquí. */}
      {canManageSession ? (
        <>
          <li>
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => onEditSession?.(blockSession!)}
              disabled={removeSessionMutation.isPending}
            >
              Corregir
            </button>
          </li>
          <li>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleRemoveSession}
              disabled={removeSessionMutation.isPending}
            >
              Quitar del registro
            </button>
          </li>
        </>
      ) : null}
      {onEdit ? (
        <li>
          <button type="button" className={styles.menuItem} onClick={() => onEdit(block)}>
            Cambiar hora o duración
          </button>
        </li>
      ) : null}
      {date ? (
        <li>
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleRemove}
            disabled={removeMutation.isPending}
          >
            Quitar del plan
          </button>
        </li>
      ) : null}
    </ul>
  )

  // El movido: el bloque se queda de **sombra** en su hora y lo real se pinta
  // donde ocurrió (criterio 23). No se mueve de sitio y no se cuenta dos veces.
  const isMoved = execution?.status === 'moved'
  // «Pendiente» / «no hecho» (D9). `upcoming` **no dice nada**: de lo que aún
  // puede pasar no se afirma nada, igual que no se afirma mientras lo vivido
  // no haya cargado (criterios 57 y 58: quien no sabe, no pasa `missing`).
  const missingLabel =
    execution || !missing || missing === 'upcoming'
      ? null
      : missing === 'pending'
        ? 'pendiente'
        : 'no hecho'
  // Lo que se lee encima del bloque cuando ya pasó: «✓ calcado», «empezó +5»,
  // «+18 min». Son **etiquetas de texto**, no colores (criterio 20).
  const executionTags =
    execution && !execution.isRunning && !isMoved
      ? execution.isOnPlan
        ? [{ kind: 'on-plan', label: '✓ calcado' }]
        : [
            execution.startLabel ? { kind: 'shift', label: execution.startLabel } : null,
            execution.durationLabel ? { kind: 'duration', label: execution.durationLabel } : null,
          ].filter((tag): tag is { kind: string; label: string } => tag !== null)
      : []

  return (
    <li className={styles.row} style={colorStyle} data-execution={execution?.status}>
      <span className={styles.gutter}>
        <time className={styles.time} dateTime={minutesToTime(block.startMinutes)}>
          {formatTimeForDisplay(minutesToTime(block.startMinutes))}
        </time>
        <span className={styles.tick} aria-hidden />
      </span>

      <article className={styles.card} data-shadow={isMoved ? '' : undefined}>
        <span className={styles.capsule} aria-hidden>
          <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
        </span>
        <div className={styles.body}>
          <p className={styles.name}>{title}</p>
          {/* Lo que hiciste dentro de este bloque (criterio 535), entre el
              nombre y la hora. Sin nota y sin poder escribirla, no deja
              hueco: una línea vacía en cada fila sería ruido diario. */}
          {onEditStartNote ? (
            // Lo que se dijo **antes** de empezar (criterio 551): escrito, se
            // lee aquí y se cambia tocándolo; en blanco, esta línea no existe
            // y el control es el lápiz del final de la línea de la hora.
            <VidaNoteLine
              text={startDraft}
              onEdit={onEditStartNote}
              question={VIDA_NOTE_QUESTION_NEXT}
            />
          ) : (
            <VidaNoteLine
              text={note}
              placeholder={
                onEditNote
                  ? isRunning
                    ? VIDA_NOTE_QUESTION_RUNNING
                    : VIDA_NOTE_ADD_LABEL
                  : null
              }
              onEdit={onEditNote}
            />
          )}
          <p className={styles.meta}>
            {isRunning ? (
              <>
                planeado {formatDurationMinutes(block.durationMinutes)} ·{' '}
                <span className={styles.live}>en marcha</span>
              </>
            ) : isMoved ? (
              <>
                planeado {formatDurationMinutes(block.durationMinutes)} ·{' '}
                <span className={styles.movedTo}>{execution?.movedToLabel}</span>
              </>
            ) : execution ? (
              // Ya pasó: se leen **las horas reales**, no la duración planeada
              // (criterio 20). El plan sigue contándose en la barrita de abajo.
              <>{execution.rangeLabel}</>
            ) : missingLabel ? (
              // D9, criterio 39: **dos momentos**, no uno. «Pendiente» cuando
              // ya pasó su hora y el día sigue abierto; «no hecho» solo cuando
              // el día se cerró. Ninguno es un reproche y los dos tienen
              // salida, justo debajo.
              <>
                planeado {formatDurationMinutes(block.durationMinutes)} ·{' '}
                <span className={styles.missing} data-missing={missing}>
                  {missingLabel}
                </span>
              </>
            ) : (
              <>
                {formatDurationMinutes(block.durationMinutes)}
                {isNext && soonLabel ? <span className={styles.soon}> · {soonLabel}</span> : null}
              </>
            )}
            {/* **El control de «antes de empezar», aparte del botón y fuera de
                su fila** (criterio 548). Aquí dentro no mueve nada: `.body` es
                `flex: 1`, así que el «▶ Empezar» conserva su tamaño **y su
                sitio** —medido a 375 px y a 760 px—. Al lado del botón le
                quitaba 43 px de sitio en pantalla ancha.
                En blanco es solo el lápiz, para no poner una línea gris en
                cada bloque del día; escrito, el texto se lee arriba y este
                lápiz desaparece. */}
            {onEditStartNote && !startDraft ? (
              <button
                type="button"
                className={styles.startNote}
                onClick={onEditStartNote}
                aria-label={`${VIDA_NOTE_QUESTION_NEXT} ${title}`}
              >
                <span aria-hidden>✎</span>
              </button>
            ) : null}
          </p>
          {/* «En su lugar, X» (criterio 42), con **la vía** a lo que sí pasó:
              un ancla a su fila de la agenda. Ni se borra el bloque ni se
              reescribe el plan. */}
          {instead ? (
            <p className={styles.instead}>
              en su lugar,{' '}
              <a className={styles.insteadLink} href={`#${instead.entryId}`}>
                {instead.title}
              </a>{' '}
              <span className={styles.insteadRange}>({instead.rangeLabel})</span>
            </p>
          ) : null}
          {/* «No se pudo», con o sin razón (criterios 43 y 45). La razón se lee
              en **una línea corta** bajo el bloque, y una de tres líneas se
              envuelve sin romper nada (criterio 61). */}
          {couldNot ? (
            <p className={styles.couldNot}>
              no se pudo{couldNot.reason ? <span className={styles.reason}> · {couldNot.reason}</span> : null}
            </p>
          ) : null}
          {executionTags.length > 0 ? (
            <p className={styles.tags}>
              {executionTags.map((tag) => (
                <span key={tag.label} className={styles.tag} data-kind={tag.kind}>
                  {tag.label}
                </span>
              ))}
            </p>
          ) : null}
          {/* La barrita plan frente a real, con «plan 30 · real 41» como texto
              de verdad (criterio 21). */}
          {execution?.comparisonLabel ? (
            <VidaPlanVsRealBar
              plannedMinutes={execution.plannedMinutes}
              realMinutes={execution.realMinutes}
              label={execution.comparisonLabel}
            />
          ) : null}
          {/* Pasarse del plan **no interrumpe** (criterio 9): una línea, sin
              color de alarma, sin modal y sin sonido. */}
          {overPlan ? <p className={styles.overPlan}>{overPlan}</p> : null}
          {/* Las **tres salidas**, las tres a un toque y ninguna obligatoria
              (criterio 40). Solo cuando el bloque ya pasó su hora: ofrecerlas
              antes sería preguntar por algo que todavía puede ocurrir. */}
          {outcomes && missing && missing !== 'upcoming' ? (
            <VidaBlockOutcomes
              title={title}
              couldNot={Boolean(couldNot)}
              reason={couldNot?.reason ?? null}
              onDid={outcomes.onDid}
              onDidSomethingElse={outcomes.onDidSomethingElse}
              onCouldNot={outcomes.onCouldNot}
              onClearCouldNot={outcomes.onClearCouldNot}
              isBusy={outcomes.isBusy}
            />
          ) : null}
        </div>

        {isRunning ? (
          <div className={styles.running}>
            <span
              className={styles.timer}
              aria-live="polite"
              aria-label={`Llevas ${elapsed.label}`}
            >
              {elapsed.label}
            </span>
            {onFinish ? (
              <Button size="sm" variant="primary" onClick={onFinish} disabled={isSessionBusy}>
                Terminar
              </Button>
            ) : null}
          </div>
        ) : onStart ? (
          <Button
            size="sm"
            variant="secondary"
            className={styles.start}
            // Dos toques seguidos **no crean dos sesiones** (criterio 13).
            disabled={isSessionBusy}
            onClick={() => onStart(block)}
          >
            ▶ Empezar
          </Button>
        ) : null}

        {/* El «···» se pinta si tiene **algo** que ofrecer: los del plan
            (solo donde se planea) o los de la sesión de este bloque, que
            existen también en un día pasado, donde se registra y no se planea
            (criterios 41 y 46). Un menú que no puede hacer nada no se pinta. */}
        {date || canManageSession || (isRunning && onOpenFinishModal) ? (
          <div className={styles.more}>
            <Popover
              triggerLabel={`Más opciones de ${title}`}
              trigger={<IconButton icon="ellipsis" size="sm" tabIndex={-1} aria-hidden />}
              content={menu}
              placement="bottom-end"
            />
          </div>
        ) : null}
      </article>
    </li>
  )
}
