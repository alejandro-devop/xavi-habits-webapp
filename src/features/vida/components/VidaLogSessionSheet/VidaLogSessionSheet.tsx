import { useState } from 'react'
import type { PickedActivity } from '@/features/vida/components/VidaActivityPicker'
import { VidaActivityPicker } from '@/features/vida/components/VidaActivityPicker'
import { VidaDurationPills } from '@/features/vida/components/VidaDurationPills'
import { VidaEndTimeLine } from '@/features/vida/components/VidaEndTimeLine'
import {
  useCreateActivityFollowUpMutation,
  useUpdateActivityFollowUpMutation,
} from '@/features/vida/hooks/useActivityFollowUps'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { formatDayHeading } from '@/features/vida/utils/vida-date.utils'
import type { GapWindow } from '@/features/vida/utils/vida-gap-form.utils'
import {
  describeLeftovers,
  getMaxDurationForStartTime,
  validatePlacement,
} from '@/features/vida/utils/vida-gap-form.utils'
import type { RealGapWindow } from '@/features/vida/utils/vida-gap-window.utils'
import {
  describeGapWindowShift,
  describePlacementBlocker,
} from '@/features/vida/utils/vida-gap-window.utils'
import {
  editSessionInput,
  logSessionInput,
  proposeLogDuration,
  validateLogPast,
  validateStartTime,
} from '@/features/vida/utils/vida-session.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
  minutesToTime,
  normalizeTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import styles from './VidaLogSessionSheet.module.scss'

/**
 * Las tres puertas de esta hoja. Son una sola pantalla porque preguntan lo
 * mismo con distinto número de preguntas, no tres formularios parecidos.
 */
export type VidaLogSessionMode = 'start' | 'log' | 'edit'

type VidaLogSessionSheetProps = {
  open: boolean
  onClose: () => void
  mode: VidaLogSessionMode
  /** `YYYY-MM-DD` local del día en el que se registra. */
  date: string
  /** «viernes»: de qué día es la plantilla que se ofrece primero. */
  dayLabel: string
  /** La plantilla de ese día, para que el «qué» empiece por ahí. */
  suggestions: VidaSuggestion[]
  /** La hora de la que parte «a qué hora empezó». */
  defaultStartTime: string
  /** Hora y duración **ya puestas** (lo usará el «¿Qué pasó?» de la tajada 4). */
  initial?: { startTime?: string; durationMinutes?: number } | null
  /**
   * **La duración que sueles tardar, por actividad** (FEAT-011, criterio 238),
   * de `usualDurationsByActivityId`. Al elegir el «qué» **anclada a un hueco**,
   * la duración que viene puesta sale de aquí antes que de la plantilla.
   *
   * La clave que **no está** es la señal de que no hay costumbre medida: ahí no
   * se dice «sueles tardar» ni se reserva el sitio donde iría (criterio 240, la
   * misma regla del 92 de FEAT-007). Vacío por defecto: sin patrones, la hoja
   * es exactamente la de antes.
   */
  usualDurations?: Record<string, number>
  /**
   * **El hueco al que va anclado lo que se registra** (FEAT-011, criterio 222).
   * Con ventana, la hoja valida por arriba y por abajo con lo que ya existe
   * —`validatePlacement`, el mismo camino y las mismas palabras que planear— y
   * **Guardar se apaga mientras no cabe** (criterio 226).
   *
   * Sin ella, la hoja es exactamente la de siempre: «Registrar tiempo pasado»
   * de la cabecera no cambia ni una palabra (criterio 56 de FEAT-004). Es un
   * **dato**, no un cuarto modo.
   *
   * Desde la tajada 2 lo que llega de Hoy es la ventana **real**
   * (`RealGapWindow`): los bordes de lo vivido. Cuando esos bordes no son los
   * del plan, la hoja lo dice arriba con `describeGapWindowShift` (criterio
   * 234) y el aviso de que no cabe **nombra al vecino** (criterio 225).
   */
  gapWindow?: GapWindow | RealGapWindow | null
  /** La sesión que se corrige, en el modo `edit` (criterio 35). */
  session?: ActivityFollowUp | null
  /**
   * «Empezar algo» lo orquesta `useVidaSessionActions` —que además cierra lo que
   * hubiera en marcha (D4)—, así que la hoja no llama a ninguna mutación en ese
   * modo: pide el «qué», pregunta **desde cuándo** y delega. Resuelve, no lanza.
   *
   * `startTime` solo viaja **si la persona tocó la hora** (criterio 332): sin
   * tocarla, quien manda sigue siendo el reloj del momento de pulsar.
   */
  onStart?: (
    activityId: string,
    startTime?: string,
  ) => Promise<{ ok: boolean; message?: string }>
}

/**
 * **Registrar lo que se sale del plan** (criterios 30, 31 y 35): una hoja, tres
 * modos.
 *
 * - **`start` — «Empezar algo»**: **qué · desde qué hora**, con «ahora» ya
 *   puesto (criterio 330). **No pide duración**, porque una sesión abierta no la
 *   tiene (criterio 30). Decir «empecé a las 8:07» deja **una sola sesión
 *   abierta** contando desde las 8:07, en **una sola acción** (criterio 331b):
 *   aquí no se registra ningún trozo pasado aparte.
 * - **`log` — «Registrar tiempo pasado»**: **qué · a qué hora empezó · cuánto
 *   duró**, con las píldoras 15 · 30 · 45 · 1h · libre, vía `activityFollowUpAdd`
 *   (criterio 31).
 * - **`edit` — corregir lo registrado**: hora, duración y notas de una sesión
 *   que ya existe, vía `activityFollowUpEdit` (criterio 35). El «qué» no se
 *   cambia: el API no admite mover una sesión de actividad, y fingir que sí
 *   sería quitarla y crear otra sin decirlo.
 *
 * **El «qué» es `VidaActivityPicker`**, el mismo que usa `VidaPlaceInGapSheet`
 * (criterio 38): no hay dos buscadores de actividad en el módulo.
 *
 * **Molde: `VidaPlaceInGapSheet`.** `SteppedModal` con `ds="aura"` y
 * `mobileSheet`, el estado aquí arriba, una **`key` por apertura** que pone
 * quien abre, y el cierre en el `onSuccess` **local** del `mutate`: si la
 * mutación falla, la hoja **se queda abierta con lo elegido** y el fallo se lee
 * dentro (criterio 36). Como no hay escritura optimista, tampoco puede quedar
 * una sesión fantasma en la agenda.
 *
 * **Esto no toca el plan** (criterio 37): aquí no se nombra ni una mutación de
 * `activityDayPlan`. Lo real va encima; el plan se queda quieto.
 */
export function VidaLogSessionSheet({
  open,
  onClose,
  mode,
  date,
  dayLabel,
  suggestions,
  defaultStartTime,
  initial = null,
  usualDurations = {},
  session = null,
  gapWindow = null,
  onStart,
}: VidaLogSessionSheetProps) {
  const createMutation = useCreateActivityFollowUpMutation()
  const editMutation = useUpdateActivityFollowUpMutation()

  const [chosen, setChosen] = useState<PickedActivity | null>(null)
  const [startTime, setStartTime] = useState<string>(
    session
      ? normalizeTimeForDisplay(session.startTime)
      : (initial?.startTime ?? normalizeTimeForDisplay(defaultStartTime)),
  )
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    session?.durationMinutes ?? initial?.durationMinutes ?? null,
  )
  // **De dónde salió la duración que se ve.** `null` salvo cuando la puso la
  // costumbre y **entera**: es lo único que autoriza la frase «sueles tardar»
  // (criterio 240). Se apaga en cuanto la duración la toca alguien.
  const [usualMinutes, setUsualMinutes] = useState<number | null>(null)
  // Mientras nadie toque la hora en «Empezar algo», el campo **sigue al reloj**
  // (`defaultStartTime` cambia cada minuto) y no se manda: así, quien no la mira
  // hace exactamente el gesto de siempre y guarda la hora del momento de pulsar
  // (criterios 330 y 332).
  const [startTimeTouched, setStartTimeTouched] = useState(false)
  const [notes, setNotes] = useState(session?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const isPending = createMutation.isPending || editMutation.isPending || isStarting
  const sessionTitle = session?.activity?.title ?? 'Actividad'

  /* ── Anclada a un hueco (FEAT-011) ──────────────────────────────────────
   *
   * Todo lo de abajo es **la figura de `VidaPlaceInGapSheet`**, con las mismas
   * funciones: lo más que cabe desde la hora elegida, la validación en cada
   * render y lo que queda libre. Aquí no se calcula ninguna aritmética nueva.
   */
  const anchor = mode === 'log' ? gapWindow : null
  const anchored = anchor !== null
  const maxMinutes = anchor ? getMaxDurationForStartTime(startTime, anchor) : 0
  const placement = anchor ? validatePlacement({ startTime, durationMinutes }, anchor) : null
  // El **mismo** aviso de siempre, con la cláusula que nombra al vecino del
  // otro lado detrás (criterios 225 y 235). `validatePlacement` no se toca: el
  // camino de planear tiene que seguir diciendo lo que decía (criterio 236).
  const placementMessage = anchor
    ? describePlacementBlocker({ startTime, durationMinutes }, anchor)
    : null
  // **Por qué este rato no es el del renglón** (criterio 234). Con la ventana
  // del plan sale `null` y no se pinta nada.
  const windowShift = anchor ? describeGapWindowShift(anchor) : null

  function chooseActivity(activity: PickedActivity, templateMinutes: number | null) {
    setChosen(activity)
    setFormError(null)
    // En «Empezar algo» no se mira: ahí no hay duración que elegir. Y una
    // duración ya puesta no se pisa.
    if (mode !== 'log' || durationMinutes !== null) return

    // **Anclada a un hueco** (criterios 238 y 239): manda lo que sueles tardar
    // en **esa actividad**, y si no hay ese dato se cae a la plantilla y luego
    // a `DEFAULT_BLOCK_MINUTES`, siempre recortado a lo que quepa. Nunca al
    // hueco entero: tener dos horas libres no dice nada de lo que hiciste.
    if (anchored) {
      const proposal = proposeLogDuration({
        usualMinutes: usualDurations[activity.id] ?? null,
        templateMinutes,
        maxMinutes,
      })
      setDurationMinutes(proposal.durationMinutes)
      setUsualMinutes(proposal.fromUsual)
      return
    }

    // **Sin hueco, la hoja de siempre.** «Registrar tiempo pasado» de la
    // cabecera no tiene bordes contra los que recortar nada, así que sigue
    // haciendo exactamente lo de FEAT-004: la duración de la plantilla si la
    // hay, y si no, ninguna.
    if (templateMinutes !== null) setDurationMinutes(templateMinutes)
  }

  async function handleStart() {
    if (!chosen) {
      setFormError('Elige qué vas a empezar.')
      return
    }
    if (!onStart) return
    // Solo hay hora que validar si la tocaron: si no, la pone el reloj al
    // llegar al API y no puede ser del futuro (criterios 332, 333 y 334).
    if (startTimeTouched) {
      const result = validateStartTime({ date, startTime, now: new Date() })
      if (!result.valid) {
        setFormError(result.message)
        return
      }
    }
    setFormError(null)
    setIsStarting(true)
    const result = await onStart(chosen.id, startTimeTouched ? startTime : undefined)
    setIsStarting(false)
    // Si no se pudo, la hoja **no se cierra** y lo elegido sigue aquí.
    if (!result.ok) {
      setFormError(result.message ?? 'No pudimos empezarla. Inténtalo otra vez.')
      return
    }
    onClose()
  }

  function handleLog() {
    if (!chosen) {
      setFormError('Elige qué hiciste.')
      return
    }
    // Dentro del hueco primero: es la regla más estrecha y la que sabe decir
    // cuánto cabe. Lo de siempre (nada del futuro, nada de otro día) sigue
    // detrás, intacto.
    if (anchor) {
      const blocked = describePlacementBlocker({ startTime, durationMinutes }, anchor)
      if (blocked !== null) {
        setFormError(blocked)
        return
      }
    }
    const result = validateLogPast({ date, startTime, durationMinutes, now: new Date() })
    if (!result.valid) {
      setFormError(result.message)
      return
    }
    setFormError(null)
    createMutation.mutate(
      logSessionInput({
        date,
        activityId: chosen.id,
        startTime,
        durationMinutes: durationMinutes!,
      }),
      { onSuccess: onClose },
    )
  }

  function handleEdit() {
    if (!session) return
    const result = validateLogPast({ date, startTime, durationMinutes, now: new Date() })
    if (!result.valid) {
      setFormError(result.message)
      return
    }
    setFormError(null)
    editMutation.mutate(
      editSessionInput({
        id: session.id,
        startTime,
        durationMinutes: durationMinutes!,
        notes,
      }),
      { onSuccess: onClose },
    )
  }

  /**
   * Lo que se ve en el campo. En «Empezar algo» y **sin tocarlo**, el reloj:
   * `defaultStartTime` llega ya puesto en «ahora» y cambia con el minuto, así
   * que lo que se lee es lo que se va a guardar. En cuanto se toca, manda lo
   * escrito.
   */
  const displayedStartTime =
    mode === 'start' && !startTimeTouched
      ? normalizeTimeForDisplay(defaultStartTime)
      : startTime

  const title =
    mode === 'start'
      ? 'Empezar algo'
      : mode === 'edit'
        ? `Corregir «${sessionTitle}»`
        : anchored
          ? '¿Qué hiciste?'
          : 'Registrar tiempo pasado'

  // Abierta desde un hueco, el subtítulo dice **de qué rato se está hablando**:
  // el día y las horas del hueco que se pulsó, no una frase general.
  const gapSubtitle =
    gapWindow === null
      ? null
      : `${capitalizeFirst(dayLabel)} · en el hueco de ${formatTimeForDisplay(
          minutesToTime(gapWindow.startMinutes),
        )} a ${formatTimeForDisplay(minutesToTime(gapWindow.endMinutes))}`

  const description =
    mode === 'start'
      ? 'Si ya llevas un rato, dinos desde qué hora. Cuando termines nos dices cuánto duró.'
      : mode === 'edit'
        ? 'Cambia la hora, cuánto duró o lo que quieras recordar de ese rato.'
        : anchored && gapSubtitle !== null
          ? gapSubtitle
          : `Algo que ya hiciste el ${formatDayHeading(date).toLowerCase()}, esté o no en tu plan.`

  const submitLabel = mode === 'start' ? 'Empezar' : mode === 'edit' ? 'Guardar' : 'Registrar'

  const footer = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
        Volver
      </Button>
      <Button
        type="button"
        isLoading={isPending}
        // **Nunca se guarda algo imposible para avisar después** (criterio
        // 226): con hueco, el botón sigue a la validación en cada render.
        disabled={isPending || (mode !== 'edit' && chosen === null) || placement?.valid === false}
        onClick={mode === 'start' ? handleStart : mode === 'edit' ? handleEdit : handleLog}
      >
        {submitLabel}
      </Button>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        {/* **El renglón dice las horas del plan y aquí se explica la
            diferencia** (criterio 234): «Desayunar acabó a las 9:28, así que
            aquí empieza antes». Sin diferencia no se pinta nada. */}
        {windowShift ? <p className={styles.shift}>{windowShift}</p> : null}
        {mode === 'edit' ? (
          // Corrigiendo, el «qué» no se pregunta: se recuerda.
          <p className={styles.editing}>
            <AppIcon
              name={session?.activity?.category?.icon ?? UNCATEGORIZED_GROUP_ICON}
              size="2xs"
              decorative
            />
            <span className={styles.editingName}>{sessionTitle}</span>
          </p>
        ) : (
          <VidaActivityPicker
            className={styles.block}
            headingId="vida-log-what"
            value={chosen}
            onChange={chooseActivity}
            suggestions={suggestions}
            dayLabel={dayLabel}
            disabled={isPending}
            // En «Empezar algo» la duración de la plantilla no viaja a ningún
            // sitio (`chooseActivity` la descarta en `start`) y la cabecera ya
            // dice que se pregunta al terminar: un número que promete algo que
            // no pasa. En `log` sigue puesta, que ahí sí se preselecciona.
            showTemplateDuration={mode !== 'start'}
          />
        )}

        {/* **Desde cuándo.** En «Empezar algo» es la pregunta nueva (criterio
            330) y en los otros dos modos es la de siempre: el mismo campo, el
            mismo estilo, ni un control nuevo (criterio 357). */}
        <section className={styles.block} aria-labelledby="vida-log-when">
          <h3 className={styles.legend} id="vida-log-when">
            {mode === 'start' ? '¿A qué hora empezaste?' : 'A qué hora empezó'}
          </h3>
          <label className={styles.custom} htmlFor="vida-log-start">
            <Input
              id="vida-log-start"
              type="time"
              value={displayedStartTime}
              // El rótulo de la sección ya lo dice; esto es lo que lee un
              // lector de pantalla al llegar al campo, y no puede repetir
              // la misma cadena o habría dos cosas con el mismo nombre.
              aria-label={mode === 'start' ? 'Hora a la que empezaste' : 'Hora a la que empezó'}
              disabled={isPending}
              onChange={(event) => {
                setStartTime(event.target.value)
                setStartTimeTouched(true)
                setFormError(null)
              }}
            />
          </label>
          {mode === 'start' ? (
            <p className={styles.hint}>
              {startTimeTouched
                ? 'Empieza contando desde esa hora y sigue en marcha.'
                : 'Ahora mismo. Cámbialo si llevas un rato con ello.'}
            </p>
          ) : null}
        </section>

        {mode !== 'start' ? (
          <>
            <section className={styles.block} aria-labelledby="vida-log-how-long">
              <h3 className={styles.legend} id="vida-log-how-long">
                Cuánto duró
              </h3>
              <VidaDurationPills
                label="Cuánto duró"
                freeInput="hoursAndMinutes"
                describedById="vida-log-end-time"
                // Solo lo que cabe desde la hora elegida, y «Todo el hueco»
                // como salida (criterio 228). Sin hueco, las de siempre.
                maxMinutes={anchored ? maxMinutes : undefined}
                fillMinutes={anchored ? maxMinutes : null}
                value={durationMinutes}
                disabled={isPending}
                onChange={(minutes) => {
                  setDurationMinutes(minutes)
                  // Tocada a mano ya no es la costumbre: la frase se va con
                  // ella (criterio 240).
                  setUsualMinutes(null)
                  setFormError(null)
                }}
              />
              {/* **La misma línea de la plantilla, aquí** porque el usuario la
                  pidió viendo esta modal: hay hora de inicio y duración, así
                  que el fin es calculable y es lo que se está decidiendo. */}
              <VidaEndTimeLine
                id="vida-log-end-time"
                startTime={startTime}
                durationMinutes={durationMinutes}
              />
              {/* **Solo cuando el número viene de verdad de la costumbre**
                  (criterio 240): con menos de cuatro datos, o si hubo que
                  recortarlo para que cupiera, aquí no hay ni frase ni hueco
                  reservado donde iría. */}
              {usualMinutes !== null ? (
                <p className={styles.usual}>
                  Sueles tardar {formatDurationFromMinutes(usualMinutes)}. Cámbialo si hoy fue
                  otra cosa.
                </p>
              ) : null}
            </section>
          </>
        ) : null}

        {mode === 'edit' ? (
          <section className={styles.block} aria-labelledby="vida-log-notes">
            <h3 className={styles.legend} id="vida-log-notes">
              Notas
            </h3>
            <textarea
              className={styles.notes}
              value={notes}
              rows={3}
              maxLength={2000}
              disabled={isPending}
              placeholder="Lo que quieras recordar de este rato."
              aria-label="Notas de esta sesión"
              onChange={(event) => setNotes(event.target.value)}
            />
          </section>
        ) : null}

        {/* Lo que va a quedar registrado, dicho antes de guardarlo. Solo cuando
            las preguntas están resueltas: antes sería una cuenta sobre algo que
            todavía no existe. */}
        {/* Con hueco, la previsualización solo se pinta si **de verdad cabe**:
            decir «se apunta encima de tu día» de algo que no se puede guardar
            sería prometer lo que Guardar está negando (molde:
            `VidaPlaceInGapSheet`, que pide `validation.valid`). */}
        {mode === 'log' && chosen && durationMinutes !== null && placement?.valid !== false ? (
          <p className={styles.preview}>
            <strong className={styles.previewLine}>
              {chosen.title} · {formatTimeForDisplay(startTime)} ·{' '}
              {formatDurationFromMinutes(durationMinutes)}
            </strong>
            {/* **Lo que queda libre en el hueco** (criterio 227). La hora de fin
                ya la dice `VidaEndTimeLine` ahí arriba: repetirla sería contar
                dos veces lo mismo. */}
            {anchor && placement?.valid
              ? `${describeLeftovers({ startTime, durationMinutes }, anchor)} `
              : ''}
            Se apunta encima de tu día. Tu plan se queda como está.
          </p>
        ) : null}

        {/* El aviso de que no cabe se lee **sin pulsar nada**, debajo de los
            campos de los que habla, y con las palabras que ya existen. */}
        {(formError ??
        (placement && !placement.valid && durationMinutes !== null
          ? placementMessage
          : null)) ? (
          <p className={styles.error} role="alert">
            {formError ?? placementMessage}
          </p>
        ) : null}

        {createMutation.isError || editMutation.isError ? (
          <Alert variant="danger">
            {mode === 'edit'
              ? 'No pudimos guardar el cambio. Vuelve a intentarlo; lo que escribiste sigue aquí.'
              : 'No pudimos registrarlo. Vuelve a intentarlo; lo que elegiste sigue aquí.'}
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
}

/** «martes» → «Martes»: el subtítulo empieza el día con mayúscula. */
function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
