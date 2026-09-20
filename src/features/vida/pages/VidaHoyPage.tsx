import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaAgendaBlock } from '@/features/vida/components/VidaAgendaBlock'
import { VidaAgendaGap } from '@/features/vida/components/VidaAgendaGap'
import { VidaDayActions } from '@/features/vida/components/VidaDayActions'
import { VidaDayBudget } from '@/features/vida/components/VidaDayBudget'
import { VidaDayStrip } from '@/features/vida/components/VidaDayStrip'
import { VidaPlaceInGapSheet } from '@/features/vida/components/VidaPlaceInGapSheet'
import { VidaTemplateAside } from '@/features/vida/components/VidaTemplateAside'
import { useAddDayPlanItemMutation } from '@/features/vida/hooks/useActivityDayPlan'
import { useVidaDayData } from '@/features/vida/hooks/useVidaDayData'
import { useVidaNowMinute } from '@/features/vida/hooks/useVidaNowMinute'
import { useVidaWeekPlans } from '@/features/vida/hooks/useVidaWeekPlans'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import type {
  AgendaBlock,
  AgendaGap,
  GapSuggestions,
} from '@/features/vida/utils/vida-agenda.utils'
import {
  buildDayAgenda,
  buildGuidanceLine,
  findNextBlockId,
  getDayBudget,
  suggestionsForGap,
} from '@/features/vida/utils/vida-agenda.utils'
import type { GapWindow } from '@/features/vida/utils/vida-gap-form.utils'
import {
  gapToWindow,
  getBlockEditWindow,
  toDayPlanTimes,
} from '@/features/vida/utils/vida-gap-form.utils'
import { minutesToTime } from '@/features/vida/utils/vida-time.utils'
import {
  VIDA_DAY_LABELS,
  formatDayHeading,
  getCurrentLocalDate,
  getVidaDayOfWeek,
} from '@/features/vida/utils/vida-date.utils'
import {
  buildDayStrip,
  clampToPlanningWindow,
  describePlanningWindowEdge,
  isEditableDate,
} from '@/features/vida/utils/vida-window.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaHoyPage.module.scss'

const SUBTITLE = 'Tu día repartido, y dónde te queda sitio.'

/** Un hueco de un día pasado no ofrece nada: se mira (D3, criterio 38). */
const NO_SUGGESTIONS: GapSuggestions = { visible: [], hiddenCount: 0, templateCount: 0 }

/** El subtítulo cambia con el día que se mira: la pantalla sigue siendo «Hoy». */
function subtitleFor(date: string, isToday: boolean, isPast: boolean): string {
  if (isToday) return SUBTITLE
  const heading = formatDayHeading(date).toLowerCase()
  return isPast
    ? `Así quedó planeado el ${heading}.`
    : `Estás planeando el ${heading}: cómo va a quedar y dónde te queda sitio.`
}

/**
 * Hoy: el presupuesto del día arriba y la agenda debajo.
 *
 * **Desde la tajada 3 la pantalla escribe**: un toque en una ficha de un hueco
 * coloca esa cosa al principio del hueco, «+ otra cosa» abre la hoja de tres
 * preguntas, y el «···» de un bloque lo quita o le cambia la hora. Ir a otro
 * día es la tajada 4 y armar desde la plantilla la 5: esos botones siguen sin
 * pintarse, que es mejor que pintarlos muertos.
 *
 * Y nada de vivir el día (criterio 22): ni «Empezar», ni cronómetro, ni
 * «Terminar», ni barra de sesión, ni etiquetas de ejecutado. Eso es F3, aunque
 * el render `docs/vida/assets/03-vida-agenda.html` lo dibuje.
 *
 * Los cuatro estados van separados de verdad, como en `VidaActividadesPage`:
 * sin sesión (consultas deshabilitadas: `isPending` + `fetchStatus: 'idle'`),
 * cargando, error con reintento, y el día sin plan.
 */
export function VidaHoyPage() {
  // La fecha es **local**: a las 23:30 sigue siendo hoy (criterio 49).
  //
  // El día visto sale de la URL: `?d=YYYY-MM-DD` (criterio 34). Recargar y el
  // «atrás» del navegador salen gratis, la ruta sigue siendo una —y por eso la
  // píldora «Hoy» del módulo sigue encendida—, y lo que venga fuera de la
  // ventana de D5 se recorta a su borde en vez de dejar la pantalla en blanco.
  const [searchParams] = useSearchParams()
  const today = getCurrentLocalDate()
  const date = clampToPlanningWindow(searchParams.get('d'), today)
  const isToday = date === today
  const isPast = date < today
  // Un día pasado **no se toca** (D3, criterio 38): sin fichas, sin «+ otra
  // cosa», sin «···», sin copiar ni vaciar. Se mira.
  const canPlan = isEditableDate(date, today)
  const { minutes: nowMinutes, label: nowLabel } = useVidaNowMinute(isToday)
  const { planItems, suggestions, dayHours, isDisabled, isPending, isPlanError, failed, refetch } =
    useVidaDayData(date)

  // La tira: siete días desde dos antes del que se mira, con un punto por día.
  // Cada punto es **la misma consulta** que la agenda de ese día
  // (`vidaKeys.dayPlan.byDate`), así que el día abierto no se pide dos veces y
  // escribir en un día refresca su punto sin invalidación nueva.
  const stripDays = useMemo(() => buildDayStrip(date, today), [date, today])
  const weekPlans = useVidaWeekPlans(useMemo(() => stripDays.map((day) => day.date), [stripDays]))

  const dayLabel = VIDA_DAY_LABELS[getVidaDayOfWeek(date)]

  // `nowMinutes` entra en la agenda: es lo que parte el hueco que contiene el
  // reloj y coloca la marca de «Ahora». Se rehace una vez por minuto, que es
  // aritmética sobre una lista de bloques: nada que memorizar más fino.
  const agenda = useMemo(
    () =>
      buildDayAgenda({
        planItems,
        dayStart: dayHours.startTime,
        dayEnd: dayHours.endTime,
        nowMinutes,
      }),
    [planItems, dayHours.startTime, dayHours.endTime, nowMinutes],
  )
  const budget = getDayBudget({ agenda, dayEnd: dayHours.endTime, nowMinutes })
  const guidance = buildGuidanceLine({
    agenda,
    nowMinutes,
    dayStart: dayHours.startTime,
    dayEnd: dayHours.endTime,
  })
  const nextBlockId = findNextBlockId(agenda.blocks, nowMinutes)
  // El aviso de «tu plantilla está vacía» se da **una vez**, en el primer hueco
  // de verdad: repetirlo en cada uno sería ruido.
  const firstRealGapId = agenda.gaps.find((gap) => !gap.isSliver && !gap.isPast)?.id ?? null

  // La hoja: una `key` por apertura, como `VidaActividadesPage`. Se remonta
  // limpia sin que nadie tenga que vaciarla a mano, y se queda montada al
  // cerrar para que la animación de salida se vea.
  const [sheet, setSheet] = useState<SheetState | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSession, setSheetSession] = useState(0)
  const addMutation = useAddDayPlanItemMutation()

  function openSheet(next: SheetState) {
    setSheet(next)
    setSheetSession((session) => session + 1)
    setSheetOpen(true)
  }

  /**
   * Un toque en una ficha: **al principio del hueco**, con la duración que trae
   * su ítem de plantilla (criterio 23). La agenda, los huecos y el presupuesto
   * se rehacen solos con la invalidación por fecha del hook: no hay estado
   * duplicado que refrescar.
   *
   * Sin duración no se coloca nada a ciegas: se abre la hoja con esa actividad
   * puesta para elegir cuánto (criterio 19).
   */
  function placeSuggestion(
    gap: AgendaGap,
    suggestion: VidaSuggestion,
    suggestionMinutes: number | null,
  ) {
    const gapWindow = gapToWindow(gap)
    if (suggestionMinutes === null) {
      openSheet({
        kind: 'place',
        gapWindow,
        preselected: {
          id: suggestion.item.activityId,
          title: suggestion.item.activity?.title ?? 'Actividad',
          icon: suggestion.item.activity?.category?.icon ?? null,
          color: suggestion.item.activity?.category?.color ?? null,
        },
      })
      return
    }
    const startTime = minutesToTime(gap.startMinutes)
    addMutation.mutate({
      date,
      activityId: suggestion.item.activityId,
      ...toDayPlanTimes(startTime, suggestionMinutes),
    })
  }

  /** «Cambiar hora o duración»: la ventana es el bloque más lo libre de al lado. */
  function editBlock(block: AgendaBlock) {
    const gapWindow = getBlockEditWindow(agenda, block.id)
    if (!gapWindow) return
    openSheet({
      kind: 'edit',
      gapWindow,
      editing: {
        itemId: block.item.id,
        activity: {
          id: block.item.activityId,
          title: block.item.activity?.title ?? 'Actividad',
          icon: block.item.activity?.category?.icon ?? null,
          color: block.item.activity?.category?.color ?? null,
        },
        startTime: minutesToTime(block.startMinutes),
        durationMinutes: block.durationMinutes,
      },
    })
  }

  // Criterio 20: la agenda abre a la altura de «Ahora», y lo anterior **no
  // desaparece** — sigue arriba, solo hay que subir. Una sola vez al montar:
  // si se repitiera con cada tic del minuto, la pantalla daría saltos mientras
  // se lee.
  const nowRef = useRef<HTMLLIElement | null>(null)
  // Por día, y no una sola vez en la vida del componente: al volver de otro día
  // la marca de «Ahora» vuelve a existir y hay que ir a ella otra vez.
  const scrolledForDate = useRef<string | null>(null)
  useEffect(() => {
    if (scrolledForDate.current === date) return
    const node = nowRef.current
    if (!node) return
    scrolledForDate.current = date
    node.scrollIntoView({ block: 'center' })
  }, [agenda, date])

  function header() {
    return <PageHeader title="Hoy" subtitle={subtitleFor(date, isToday, isPast)} />
  }

  /** La tira se pinta en todos los estados: cambiar de día no depende del día. */
  function strip() {
    return (
      <VidaDayStrip
        days={stripDays}
        plans={weekPlans.byDate}
        edgeNote={describePlanningWindowEdge(today)}
      />
    )
  }

  if (isDisabled) {
    return (
      <div className={styles.root}>
        {header()}
        <Card className={styles.panel} padding="lg">
          <EmptyState
            title="Entra para ver tu día"
            description="Tu plan y tu plantilla viajan con tu cuenta. Inicia sesión y aparecen."
            action={
              <Button to={authPaths.login} variant="secondary">
                Iniciar sesión
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  // Mientras algo está en vuelo no se afirma «no tienes plan», ni se pintan los
  // huecos, ni las fichas — y tampoco un presupuesto con el horario por defecto
  // que saltaría al llegar el de verdad (criterio 50).
  if (isPending) {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        <div aria-busy="true" aria-live="polite" className={styles.skeleton}>
          <Skeleton width="100%" height={112} radius="1.25rem" />
          {[0, 1, 2].map((row) => (
            <div key={row} className={styles.skeletonRow}>
              <Skeleton width={34} height={12} />
              <Skeleton width="100%" height={58} radius="1rem" />
            </div>
          ))}
          <span className={styles.srOnly}>Cargando tu día…</span>
        </div>
      </div>
    )
  }

  if (isPlanError) {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        <Alert variant="danger" title="No pudimos cargar tu día">
          <p className={styles.errorText}>
            Revisa tu conexión e inténtalo otra vez; tu plan sigue guardado.
          </p>
          <Button variant="secondary" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </Alert>
      </div>
    )
  }

  const hasPlan = agenda.blocks.length > 0
  const templateCount = suggestions.filter((suggestion) => suggestion.item.isActive !== false).length

  // La marca de «Ahora» la coloca `buildDayAgenda`, dentro del tramo que
  // contiene al reloj: aquí solo se pinta. Antes se decidía en esta página
  // —«la primera entrada que empieza después de ahora»— y por eso desaparecía
  // media jornada; es el defecto por el que volvió la tajada.
  const agendaList = (
    // En un día que no es hoy la agenda va en **trazo más suave** (criterio
    // 33): es un plan, no lo que está pasando. Se apagan los bordes, no el
    // texto: el contraste de lo que se lee no se toca (criterio 55).
    <ol className={styles.agenda} data-tone={isToday ? undefined : 'plan'}>
      {agenda.entries.map((entry) => {
        if (entry.kind === 'now') {
          return (
            <li className={styles.nowRow} ref={nowRef} key="now">
              <span className={styles.nowTime}>{nowLabel}</span>
              <span className={styles.nowLine} aria-hidden />
              <span className={styles.nowPill}>Ahora</span>
            </li>
          )
        }
        return (
          <Fragment key={entry.id}>
            {entry.kind === 'block' ? (
              <VidaAgendaBlock
                block={entry}
                isNext={entry.id === nextBlockId}
                nowMinutes={nowMinutes}
                // Sin `date` el bloque no pinta el «···»: en un día pasado no
                // hay nada que quitar ni que cambiar de hora (criterio 38).
                date={canPlan ? date : null}
                onEdit={canPlan ? editBlock : undefined}
              />
            ) : (
              <VidaAgendaGap
                gap={entry}
                dayLabel={dayLabel}
                showTemplateHint={canPlan && entry.id === firstRealGapId}
                // En un día pasado el hueco **no ofrece nada**: ni fichas, ni
                // «+ otra cosa» (criterio 38). Ofrecer algo para un rato que ya
                // pasó sería un control que no lleva a ninguna parte.
                suggestions={
                  canPlan
                    ? suggestionsForGap({ suggestions, gap: entry, planItems })
                    : NO_SUGGESTIONS
                }
                onPlaceSuggestion={canPlan ? placeSuggestion : undefined}
                onOpenSheet={
                  canPlan
                    ? (gap) => openSheet({ kind: 'place', gapWindow: gapToWindow(gap) })
                    : undefined
                }
                isPlacing={addMutation.isPending}
              />
            )}
          </Fragment>
        )
      })}
    </ol>
  )

  return (
    <div className={styles.root}>
      {header()}
      {strip()}

      {failed.length > 0 ? (
        // Una consulta caída y las otras no: se dice **qué** falta en vez de
        // dejar la pantalla a medias sin explicación (criterio 52).
        <Alert variant="warning" title="Falta una parte de tu día">
          <p className={styles.errorText}>
            No pudimos cargar {failed.join(' ni ')}. Lo demás es correcto.
          </p>
          <Button variant="secondary" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.main}>
          <VidaDayBudget
            date={date}
            dayStart={dayHours.startTime}
            dayEnd={dayHours.endTime}
            isDefaultSchedule={dayHours.isDefault}
            agenda={agenda}
            budget={budget}
            guidance={guidance}
            nowLabel={nowLabel}
          />

          {/* Un día pasado se dice **sin reproche** (D3, criterio 56): se
              cuenta lo que es, no lo que faltó. Lo que no se registró se
              arregla en F3, no aquí. */}
          {isPast ? (
            <p className={styles.readOnly}>
              Este día ya pasó: aquí queda como lo planeaste, para mirarlo. Los días de atrás no se
              cambian.
            </p>
          ) : null}

          {!hasPlan ? (
            <p className={styles.noPlan}>
              {isPast
                ? `Ese ${dayLabel} no llegó a tener plan.`
                : isToday
                  ? 'Aún no hay plan para hoy.'
                  : `Todavía no hay plan para el ${formatDayHeading(date).toLowerCase()}.`}{' '}
              {templateCount > 0
                ? `Tu plantilla trae ${templateCount} ${templateCount === 1 ? 'cosa' : 'cosas'} los ${dayLabel}.`
                : 'Tu plantilla todavía no trae nada para este día.'}
            </p>
          ) : null}

          {/* Los dos atajos del día, solo donde se puede planear (criterios 36
              y 37): en un día pasado esta fila no existe. */}
          {canPlan ? <VidaDayActions date={date} planItems={planItems} /> : null}

          {agendaList}
        </div>

        <VidaTemplateAside dayLabel={dayLabel} suggestions={suggestions} planItems={planItems} />
      </div>

      {sheet && canPlan ? (
        <VidaPlaceInGapSheet
          key={sheetSession}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          date={date}
          gapWindow={sheet.gapWindow}
          dayLabel={dayLabel}
          suggestions={suggestions}
          planItems={planItems}
          nowMinutes={nowMinutes}
          editing={sheet.kind === 'edit' ? sheet.editing : null}
          preselected={sheet.kind === 'place' ? (sheet.preselected ?? null) : null}
        />
      ) : null}
    </div>
  )
}

type SheetActivity = { id: string; title: string; icon: string | null; color: string | null }

/**
 * Lo que la hoja necesita saber, según por dónde se abrió. Van juntos en una
 * sola variable —y no en tres `useState` sueltos— para que no pueda existir el
 * estado imposible «editando un bloque dentro del hueco de otro».
 */
type SheetState =
  | { kind: 'place'; gapWindow: GapWindow; preselected?: SheetActivity }
  | {
      kind: 'edit'
      gapWindow: GapWindow
      editing: {
        itemId: string
        activity: SheetActivity
        startTime: string
        durationMinutes: number
      }
    }
