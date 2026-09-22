import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaAdherenceSummary } from '@/features/vida/components/VidaAdherenceSummary'
import { VidaAdherenceWeekdays } from '@/features/vida/components/VidaAdherenceWeekdays'
import { VidaAdherenceWeeks } from '@/features/vida/components/VidaAdherenceWeeks'
import { VidaDayStrip } from '@/features/vida/components/VidaDayStrip'
import { VidaLogSessionSheet } from '@/features/vida/components/VidaLogSessionSheet'
import { VidaPatternCard } from '@/features/vida/components/VidaPatternCard'
import { VidaReviewCategories } from '@/features/vida/components/VidaReviewCategories'
import { VidaReviewFigures } from '@/features/vida/components/VidaReviewFigures'
import { VidaReviewLanes } from '@/features/vida/components/VidaReviewLanes'
import { VidaReviewNoDataList } from '@/features/vida/components/VidaReviewNoDataList'
import { VidaReviewBridge } from '@/features/vida/components/VidaReviewBridge'
import { VidaReviewOffPlanRow, VidaReviewRow } from '@/features/vida/components/VidaReviewRow'
import { VidaReviewStory } from '@/features/vida/components/VidaReviewStory'
import { VidaReviewWeek } from '@/features/vida/components/VidaReviewWeek'
import {
  useActivityFollowUpsInDatesQuery,
  useCreateActivityFollowUpMutation,
} from '@/features/vida/hooks/useActivityFollowUps'
import { useVidaDayData } from '@/features/vida/hooks/useVidaDayData'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useVidaItemsQuery, useUpdateVidaItemMutation } from '@/features/vida/hooks/useVidaItems'
import { useVidaNowMinute } from '@/features/vida/hooks/useVidaNowMinute'
import { useVidaPatterns } from '@/features/vida/hooks/useVidaPatterns'
import { useVidaWeekFollowUps } from '@/features/vida/hooks/useVidaWeekFollowUps'
import { useVidaWeekPlans } from '@/features/vida/hooks/useVidaWeekPlans'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import {
  getBlockNote,
  getStartTimeAnswerFor,
  isBridgeDismissed,
  isNoDataDismissed,
  useVidaDeviceNotesStore,
} from '@/features/vida/store/vida-device-notes.store'
import type { AgendaBlock } from '@/features/vida/utils/vida-agenda.utils'
import { buildDayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import {
  VIDA_DAY_LABELS,
  formatDateToYmd,
  getCurrentLocalDate,
  getMondayOfWeek,
  getVidaDayOfWeek,
  parseYmdToLocalDate,
  shiftYmd,
} from '@/features/vida/utils/vida-date.utils'
import type { NoDataSlice } from '@/features/vida/utils/vida-execution.utils'
import { buildDayExecution, plannedSessionMinutes } from '@/features/vida/utils/vida-execution.utils'
import type { ReviewRow } from '@/features/vida/utils/vida-review.utils'
import {
  buildCategoryBreakdown,
  buildDayReview,
  resolveReviewDate,
  topNoDataSlices,
} from '@/features/vida/utils/vida-review.utils'
import type { VidaPatternSuggestion } from '@/features/vida/utils/vida-patterns.utils'
import {
  PATTERN_MIN_OCCURRENCES,
  isBridgeSilencedByAnswer,
} from '@/features/vida/utils/vida-patterns.utils'
import { logSessionInput } from '@/features/vida/utils/vida-session.utils'
import {
  buildTemplateBridge,
  buildWeekLine,
  buildWeekReview,
  weekDotsByDate,
} from '@/features/vida/utils/vida-week-review.utils'
import { minutesToTime, parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'
import {
  buildDayStrip,
  clampToReviewWindow,
  describeReviewWindowEdge,
  getReviewWindow,
} from '@/features/vida/utils/vida-window.utils'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Tabs } from '@/shared/ui/Tabs'
import styles from './VidaRevisionPage.module.scss'

/** A partir de aquí caben los dos carriles del marco D. */
const DESKTOP_QUERY = '(min-width: 60rem)'

const DAYS_IN_WEEK = 7

/** Las tres secciones de Revisión. Estado local: **la URL no se mueve**. */
type ReviewView = 'day' | 'week' | 'patterns'

/**
 * Las dos funciones de calendario de la semana **están copiadas de
 * `VidaSemanaPage.tsx`, no importadas**, y queda dicho: allí son funciones
 * locales de aquella página y moverlas a `vida-date.utils.ts` tocaría una
 * pantalla entregada que esta tajada no toca (el plan lo escribe así en la
 * implementación de referencia). `formatReviewWeekRange` sí cambia de forma:
 * el criterio 46 pide «14 – 20 de septiembre», con el mes escrito entero, y
 * aquella dice «14 – 20 sept».
 *
 * La tercera, `shiftYmd`, **sí se fue**: estaba privada aquí y privada en
 * `vida-window.utils.ts`, y la ventana de seis semanas de F6 necesitaba una
 * tercera copia. Ahora sale de `vida-date.utils.ts`.
 */
/** El lunes de la semana que contiene esa fecha, en `YYYY-MM-DD`. */
function mondayOf(date: string): string {
  return formatDateToYmd(getMondayOfWeek(parseYmdToLocalDate(date)))
}

/** «Semana del 14 al 20»: la cabecera de la frase, como el render. */
function formatWeekStoryLabel(monday: string): string {
  const from = parseYmdToLocalDate(monday)
  const to = parseYmdToLocalDate(shiftYmd(monday, DAYS_IN_WEEK - 1))
  return `Semana del ${from.getDate()} al ${to.getDate()}`
}

/** «14 – 20 de septiembre», y con dos meses, «28 de septiembre – 4 de octubre». */
function formatReviewWeekRange(monday: string): string {
  const from = parseYmdToLocalDate(monday)
  const to = parseYmdToLocalDate(shiftYmd(monday, DAYS_IN_WEEK - 1))
  const fromMonth = from.toLocaleDateString('es', { month: 'long' })
  const toMonth = to.toLocaleDateString('es', { month: 'long' })
  return fromMonth === toMonth
    ? `${from.getDate()} – ${to.getDate()} de ${toMonth}`
    : `${from.getDate()} de ${fromMonth} – ${to.getDate()} de ${toMonth}`
}

/**
 * **Revisión: el día contado** (FEAT-006, tajada 1).
 *
 * Se monta exactamente como `VidaHoyPage` —la referencia que eligió el
 * arquitecto—: fecha de la URL → `useVidaDayData` → `buildDayAgenda` →
 * `buildDayExecution`, y un **cuarto pase puro**, `buildDayReview`, que solo
 * proyecta. Ni una consulta nueva, ni una clave de caché nueva, ni una ruta
 * nueva: las dos consultas del día ya existen y la tira reaprovecha la misma
 * `vidaKeys.dayPlan.byDate` que Hoy.
 *
 * **Desde la tajada 3 la revisión rellena el día** (criterios 35–44), y lo hace
 * con código ya construido y revisado en FEAT-004: **«Lo hice»** por bloque sin
 * sesión y por fila del plan fantasma (`plannedSessionMinutes` +
 * `logSessionInput`, copia de `VidaHoyPage.markBlockDone`), **«Registrar tiempo
 * pasado»** y **«¿Qué pasó?»** abriendo **la misma** `VidaLogSessionSheet` sin
 * salir de aquí, y **«Dejarlo así»** en el **mismo** store del aparato que Hoy.
 * Lo único que escribe es **una sesión**: en todo el archivo no se importa ni
 * una mutación de `useActivityDayPlan`, así que la revisión **no puede** mover,
 * quitar ni recortar un bloque del plan (criterios 35 y 41).
 *
 * Los días raros tienen **su propio estado y su salida a Hoy**: futuro
 * (criterio 4), hoy aún abierto (5), con plan y sin un solo registro (19), sin
 * plan y con sesiones (20) y sin plan y sin nada (21).
 *
 * **La tajada 2** añade, **al final** de la columna principal, «en qué se
 * repartió el día»: los minutos por categoría con la paleta del catálogo y los
 * tramos más largos sin registrar (criterios 26–34). Siguen siendo lectura: ni
 * un botón, ni una consulta más — las dos secciones se derivan del **mismo**
 * `execution` que ya estaba montado.
 *
 * Los estados van separados como en Hoy: sin sesión ≠ esqueletos ≠ **el plan no
 * cargó** ≠ **lo vivido no cargó**. Con lo vivido caído **no se afirma nada de
 * lo que pasó** —ni «no hecho», ni cifras, ni «no quedó nada apuntado»—: se
 * dice que falta esa parte y se enseña el plan (criterio 23).
 */
export function VidaRevisionPage() {
  const [searchParams] = useSearchParams()
  const today = getCurrentLocalDate()
  // El reloj de verdad: hace falta **antes** de saber qué día se abre, porque
  // «el último día cerrado» depende de si hoy ya pasó su hora de fin.
  const now = useVidaNowMinute(true)
  // El horario del día es la **misma** consulta de ajustes que lee
  // `useVidaDayData`: React Query la deduplica, no es una consulta más.
  const hours = useVidaDayHours()
  const date = clampToReviewWindow(
    resolveReviewDate({
      param: searchParams.get('d'),
      today,
      dayEnd: hours.endTime,
      nowMinutes: now.minutes ?? 0,
    }),
    today,
  )
  const isToday = date === today
  const isPast = date < today
  const nowMinutes = isToday ? now.minutes : null
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  /**
   * **El día y la semana son dos vistas de la misma pantalla** (criterio 45):
   * estado local, **sin ruta nueva** y sin tocar el `?d=`, igual que la semana
   * entera de FEAT-005. La píldora «Revisión» sigue encendida y el día visto
   * sigue viajando en la URL, así que volver del navegador no pierde el día.
   */
  const [view, setView] = useState<ReviewView>('day')
  const weekMonday = mondayOf(date)
  const weekDates = useMemo(
    () => Array.from({ length: DAYS_IN_WEEK }, (_, index) => shiftYmd(weekMonday, index)),
    [weekMonday],
  )
  const isWeek = view === 'week'
  const isPatterns = view === 'patterns'

  const {
    planItems,
    // La plantilla de ese día: es lo que la hoja ofrece primero en el «qué».
    // Ya se pedía —`useVidaDayData` monta esa consulta desde la tajada 1—, así
    // que no es una consulta más.
    suggestions,
    followUps,
    dayHours,
    isDisabled,
    isPending,
    isPlanError,
    isFollowUpsError,
    failed,
    refetch,
  } = useVidaDayData(date)

  // La tira: la misma de Hoy, con **la ventana de mirar atrás** (A3) y
  // llevando a la revisión de cada día en vez de a Hoy. Los puntos salen de
  // `vidaKeys.dayPlan.byDate`, la misma clave: el día abierto no se pide dos
  // veces. El punto de tres estados es de la tajada 4 (D8).
  const stripDays = useMemo(
    () => buildDayStrip(date, today, getReviewWindow(today)),
    [date, today],
  )
  /**
   * **Una sola llamada para los planes de la tira y los de la semana.** Son la
   * misma clave (`vidaKeys.dayPlan.byDate`) y la misma `queryFn`, así que los
   * días que la tira ya pidió son **aciertos de caché**: abrir la semana no
   * vuelve a pedir ninguno de ellos (criterio 53). Con la vista de día, la
   * lista es exactamente la de la tajada 1 — ni una consulta más.
   */
  const planDates = useMemo(() => {
    const dates = stripDays.map((day) => day.date)
    if (!isWeek) return dates
    return [...new Set([...dates, ...weekDates])]
  }, [stripDays, isWeek, weekDates])
  const weekPlans = useVidaWeekPlans(planDates)
  // Las sesiones de los siete días **solo con la semana abierta**: en la vista
  // de día esta lista está vacía y `useQueries` no monta nada (A4).
  const weekFollowUps = useVidaWeekFollowUps(useMemo(() => (isWeek ? weekDates : []), [isWeek, weekDates]))

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
  // Con lo vivido caído no entra ni una sesión: sin esto, un parpadeo de red se
  // leería como un día sin registros (criterio 23).
  const dayFollowUps = useMemo(
    () => (isFollowUpsError ? [] : followUps),
    [isFollowUpsError, followUps],
  )
  const execution = useMemo(
    () =>
      buildDayExecution({
        agenda,
        followUps: dayFollowUps,
        date,
        nowMinutes,
        dayEnd: dayHours.endTime,
        isPastDay: isPast,
      }),
    [agenda, dayFollowUps, date, nowMinutes, dayHours.endTime, isPast],
  )

  // Las razones de «No se pudo» viven en **este aparato** (FEAT-004, D7) y
  // entran en la derivación como datos: `vida-review.utils.ts` no sabe qué es
  // `localStorage`. La pantalla lo dice donde se leen (criterio 15).
  const blockNotes = useVidaDeviceNotesStore((state) => state.blockNotes)
  const couldNotById = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const item of planItems) {
      const note = getBlockNote(blockNotes, date, item.id)
      if (note) map.set(item.id, note.reason)
    }
    return map
  }, [planItems, blockNotes, date])

  const dismissedNoData = useVidaDeviceNotesStore((state) => state.dismissedNoData)
  const clearBlockNote = useVidaDeviceNotesStore((state) => state.clearBlockNote)
  const dismissNoData = useVidaDeviceNotesStore((state) => state.dismissNoData)
  // **La única escritura de la pantalla**: la misma mutación que usa la hoja de
  // registrar, con su invalidación de siempre —`followUps.day(date)`—, que es
  // lo que hace que la historia, la cifra, las filas, las categorías y los
  // tramos se rehagan **sin recargar** (criterio 40). Ni clave ni invalidación
  // nuevas.
  const createFollowUpMutation = useCreateActivityFollowUpMutation()

  const review = useMemo(
    () => buildDayReview({ execution, agenda, date, today, nowMinutes, couldNotById }),
    [execution, agenda, date, today, nowMinutes, couldNotById],
  )
  // **En qué se repartió el día** (tajada 2). Los minutos sin registrar no se
  // recalculan: son los que ya trae la cifra grande (A9), así que la fila de
  // «Sin registrar» y la cifra de arriba **no pueden decir números distintos**.
  const breakdown = useMemo(
    () =>
      buildCategoryBreakdown({
        agenda,
        execution,
        noDataMinutes: review.figures?.noDataMinutes ?? 0,
        couldNotById,
      }),
    [agenda, execution, review.figures?.noDataMinutes, couldNotById],
  )
  const noDataSlices = useMemo(() => topNoDataSlices(execution, 4), [execution])

  /**
   * **La semana de lo real** (criterios 46–52). Se deriva con el **mismo**
   * `buildDayExecution` de cada día: aquí no hay ni una segunda definición de
   * «seguido», ni una barra recalculada. Con la vista de día la lista está
   * vacía y no se deriva nada.
   */
  const weekRows = useMemo(
    () =>
      isWeek
        ? buildWeekReview({
            days: weekDates.map((weekDate) => ({
              date: weekDate,
              planItems: weekPlans.byDate[weekDate]?.items ?? [],
              followUps: weekFollowUps.byDate[weekDate]?.followUps ?? [],
              isPending:
                (weekPlans.byDate[weekDate]?.isPending ?? false) ||
                (weekFollowUps.byDate[weekDate]?.isPending ?? false),
              // Basta con que **una** de las dos consultas del día falle para
              // que ese día no se sepa: la fila lo dice y no se lee «sin plan»
              // (criterio 52).
              isError:
                (weekPlans.byDate[weekDate]?.isError ?? false) ||
                (weekFollowUps.byDate[weekDate]?.isError ?? false),
            })),
            dayHours,
            today,
            nowMinutes: now.minutes,
            selectedDate: date,
          })
        : [],
    [isWeek, weekDates, weekPlans.byDate, weekFollowUps.byDate, dayHours, today, now.minutes, date],
  )
  const weekLine = useMemo(() => buildWeekLine(weekRows), [weekRows])
  // **El punto de tres estados de la tira** (criterio 51, D8): solo con la
  // semana cargada, que es cuando se sabe qué pasó cada día. Sin esto la tira
  // sigue siendo la de Hoy, exactamente.
  const weekDots = useMemo(() => (isWeek ? weekDotsByDate(weekRows) : undefined), [isWeek, weekRows])
  const isWeekPending = isWeek && (weekPlans.isPending || weekFollowUps.isPending)
  const hasWeekError = weekPlans.hasError || weekFollowUps.hasError
  const showsCategories =
    review.status !== 'future' && (breakdown.rows.length > 0 || breakdown.noData.minutes > 0)

  // **Rellenar el día solo donde tiene sentido**: en un día futuro no se
  // registra lo que no ha pasado (criterio 42) y sin sesión no hay a dónde
  // escribir. Lo demás —hoy y cualquier día de atrás— sí, igual que en Hoy.
  const canFill = !isDisabled && review.status !== 'future' && !isFollowUpsError
  const dayLabel = VIDA_DAY_LABELS[getVidaDayOfWeek(date)]
  const blocksByItemId = useMemo(() => {
    const map = new Map<string, AgendaBlock>()
    for (const block of agenda.blocks) map.set(block.item.id, block)
    return map
  }, [agenda.blocks])

  // La hoja de registrar: **la misma de FEAT-004**, con una `key` por apertura
  // —el molde de `VidaHoyPage`— para que se remonte limpia sin vaciarla a mano.
  const [logSheet, setLogSheet] = useState<LogSheetState | null>(null)
  const [logSheetOpen, setLogSheetOpen] = useState(false)
  const [logSheetSession, setLogSheetSession] = useState(0)

  function openLogSheet(next: LogSheetState) {
    setLogSheet(next)
    setLogSheetSession((session) => session + 1)
    setLogSheetOpen(true)
  }

  /**
   * **«Lo hice»** (criterios 35 y 36). Es **la función de Hoy**
   * (`VidaHoyPage.markBlockDone`): la sesión con la hora y la duración
   * planeadas, recortada a «ahora» por `plannedSessionMinutes` para que nunca
   * nazca terminando en el futuro, y la nota de «no se pudo» se va porque deja
   * de ser verdad. **El plan no se toca**: esto escribe `activityFollowUpAdd` y
   * nada más.
   */
  function markRowDone(row: ReviewRow) {
    const block = blocksByItemId.get(row.itemId)
    if (!block) return
    clearBlockNote(date, row.itemId)
    createFollowUpMutation.mutate(
      logSessionInput({
        date,
        activityId: block.item.activityId,
        startTime: minutesToTime(block.startMinutes),
        durationMinutes: plannedSessionMinutes({ block, nowMinutes }),
      }),
    )
  }

  /** **«Registrar tiempo pasado»**, sin salir de la revisión (criterio 37). */
  function logPast() {
    openLogSheet({ initial: null })
  }

  /** **«¿Qué pasó?»** de un tramo: la hoja con **sus horas** ya puestas (38). */
  function askAboutNoData(slice: NoDataSlice) {
    openLogSheet({
      initial: { startTime: slice.startTime, durationMinutes: slice.durationMinutes },
    })
  }

  /**
   * **«¿Qué pasó?»** del marco E. De un día del que no quedó nada apuntado no
   * hay tramos calculados —`buildNoDataSlices` necesita el presupuesto en forma
   * cerrada—, así que el rato del que se pregunta es **el día entero**: la hoja
   * abre por su primera hora y la duración la pone quien contesta.
   */
  function askAboutWholeDay() {
    openLogSheet({ initial: { startTime: dayHours.startTime } })
  }

  const showsReasons = review.rows.some(
    (row) => row.real.kind === 'missing' && row.real.reason !== null,
  )
  // Lo del aparato se dice donde se lee: las razones de «no se pudo» y los
  // «dejarlo así» que esta pantalla ofrece (criterio 15).
  const showsDeviceNote =
    showsReasons || (canFill && (noDataSlices.length > 0 || review.ghostRows.length > 0))
  /** «Dejarlo así» del marco E: cierra el asunto **del día entero** (39). */
  const dayDismissed = isNoDataDismissed(dismissedNoData, date, WHOLE_DAY_SLICE_ID)

  function header() {
    return (
      <PageHeader title="Revisión" subtitle={`${review.dateLabel} · ${review.statusLabel}`} />
    )
  }

  /** La tira se pinta en todos los estados: cambiar de día no depende del día. */
  function strip() {
    return (
      <VidaDayStrip
        days={stripDays}
        plans={weekPlans.byDate}
        edgeNote={describeReviewWindowEdge(today)}
        basePath={vidaPaths.revisionForDate}
        dots={weekDots}
      />
    )
  }

  /**
   * Las dos salidas del pie. «Ver el día en la agenda» sigue siendo **un enlace
   * a Hoy** (criterio 18); «Registrar tiempo pasado» abre ahora **la hoja aquí
   * mismo** (criterio 37) y solo donde se puede escribir — en lo demás sigue
   * llevando a Hoy, que es donde eso vive.
   */
  function exits() {
    return (
      <div className={styles.exits}>
        <Button variant="secondary" size="sm" to={vidaPaths.hoyForDate(date)}>
          Ver el día en la agenda
        </Button>
        {canFill ? (
          <Button variant="ghost" size="sm" onClick={logPast}>
            Registrar tiempo pasado
          </Button>
        ) : (
          <Button variant="ghost" size="sm" to={vidaPaths.hoyForDate(date)}>
            Registrar tiempo pasado
          </Button>
        )}
      </div>
    )
  }

  /**
   * **Las tres secciones de Revisión** (criterio 64): «Un día» · «La semana» ·
   * «Lo que se repite».
   *
   * Es `@/shared/ui/Tabs` —aquí no se escriben pestañas a mano—, envuelto como
   * lo envuelve `VidaTemplateDayTabs`: trae `role="tablist"`, las flechas ←/→
   * y el panel enlazado por `aria-controls` sin código nuevo de
   * accesibilidad. Sustituye a los dos botones sueltos que había («Ver por
   * semana» y «Volver al día»), que decían lo mismo peor.
   *
   * **El estado es local y la URL no se mueve**: `vida-paths.ts` no gana
   * ningún destino y la barra de Vida sigue con sus cuatro píldoras. El día
   * visto sigue viajando en el `?d=`, así que cambiar de sección no lo pierde.
   *
   * Va en todas las ramas de la pantalla —también en la de cargando y en las
   * de error— a propósito: si el plan de un día no carga, se tiene que poder
   * saltar a «Lo que se repite», que no depende de ese día.
   */
  function sections(children: ReactNode) {
    return (
      <Tabs
        value={view}
        onChange={(next) => setView(next as ReviewView)}
        className={styles.sections}
      >
        <Tabs.List>
          <Tabs.Tab value="day">Un día</Tabs.Tab>
          <Tabs.Tab value="week">La semana</Tabs.Tab>
          <Tabs.Tab value="patterns">Lo que se repite</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value={view}>
          <div className={styles.sectionBody}>{children}</div>
        </Tabs.Panel>
      </Tabs>
    )
  }

  if (isDisabled) {
    return (
      <div className={styles.root}>
        {header()}
        <Card className={styles.panel} padding="lg">
          <EmptyState
            title="Entra para ver cómo te fue"
            description="Tu día y lo que registraste viajan con tu cuenta. Inicia sesión y aparecen."
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

  /**
   * **Lo que se repite** (criterios 64–73, FEAT-007 tajada 1).
   *
   * Va **antes** de la rama de «cargando»: esta sección no mira el día abierto
   * y no tiene por qué esperar a su consulta. Lo que sí espera es lo suyo, y
   * lo dice con sus propios esqueletos.
   */
  if (isPatterns) {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        {sections(
          <VidaPatternsSection
            today={today}
            nowMinutes={nowMinutes}
            dayHours={{ startTime: hours.startTime, endTime: hours.endTime }}
          />,
        )}
      </div>
    )
  }

  if (isPending) {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        {sections(
          <>
            <div aria-busy="true" aria-live="polite" className={styles.skeleton}>
              <Skeleton width="100%" height={96} radius="1.25rem" />
              <Skeleton width="100%" height={88} radius="1.25rem" />
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} width="100%" height={54} radius="1rem" />
              ))}
              <Skeleton width="100%" height={120} radius="1.25rem" />
              <span className={styles.srOnly}>Cargando cómo fue tu día…</span>
            </div>
          </>,
        )}
      </div>
    )
  }

  /**
   * **La semana** (criterios 45–52 y 60). Es un estado de esta misma pantalla:
   * la cabecera y la tira siguen siendo las de arriba —y la tira ya estrena su
   * punto de tres estados—, y «Volver al día» deja el día exactamente donde
   * estaba, porque nunca salió de la URL.
   */
  if (isWeek) {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        {sections(
          <>
            <section className={styles.section} aria-labelledby="vida-review-week">
              <h2 className={styles.sectionTitle} id="vida-review-week">
                Tu semana
              </h2>
              <p className={styles.sectionNote}>{formatReviewWeekRange(weekMonday)}</p>
            </section>

            {hasWeekError ? (
              <Alert variant="warning" title="Falta algún día de la semana">
                <p className={styles.errorText}>
                  De los días que no pudimos cargar no se afirma nada: quedan marcados abajo.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    weekPlans.refetch()
                    weekFollowUps.refetch()
                  }}
                >
                  Reintentar
                </Button>
              </Alert>
            ) : null}

            {isWeekPending ? (
              <div aria-busy="true" aria-live="polite" className={styles.skeleton}>
                {weekDates.map((weekDate) => (
                  <Skeleton key={weekDate} width="100%" height={48} radius="1rem" />
                ))}
                <span className={styles.srOnly}>Cargando tu semana…</span>
              </div>
            ) : (
              <>
                {weekLine.length > 0 ? (
                  <VidaReviewStory
                    dateLabel={formatWeekStoryLabel(weekMonday)}
                    statusLabel="la semana en una frase"
                    sentences={weekLine}
                  />
                ) : null}
                <VidaReviewWeek rows={weekRows} />
                {/* **El puente**, y solo aquí: sus consultas se montan con la
                    semana abierta, nunca en la vista de día (A5). */}
                <VidaReviewBridgeSection weekMonday={weekMonday} today={today} dayHours={dayHours} />
              </>
            )}
          </>,
        )}
      </div>
    )
  }

  // El plan no cargó: sin él no hay nada que comparar. **No se afirma que el
  // día estuviera vacío** (criterio 23).
  if (isPlanError) {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        {sections(
          <>
            <Alert variant="danger" title="No pudimos cargar tu plan de ese día">
              <p className={styles.errorText}>
                Sin él no se puede comparar nada. Revisa tu conexión e inténtalo otra vez; lo tuyo
                sigue guardado.
              </p>
              <Button variant="secondary" size="sm" onClick={refetch}>
                Reintentar
              </Button>
            </Alert>
          </>,
        )}
      </div>
    )
  }

  // Un día futuro **no se revisa** (criterio 4): cero cifras, y la salida es
  // planearlo en Hoy.
  if (review.status === 'future') {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        {sections(
          <>
            <Card className={styles.panel} padding="lg">
              <EmptyState
                title={review.emptyNotice?.title ?? 'Este día todavía no ha pasado'}
                description={review.emptyNotice?.body ?? ''}
                action={
                  <Button variant="secondary" to={vidaPaths.hoyForDate(date)}>
                    Planearlo en Hoy
                  </Button>
                }
              />
            </Card>
          </>,
        )}
      </div>
    )
  }

  // **Lo vivido no cargó.** Se dice, con su reintento, y se enseña solo el
  // plan: ninguna cifra, ninguna etiqueta y, sobre todo, **nunca** «no quedó
  // nada apuntado» (criterio 23).
  if (isFollowUpsError) {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        {sections(
          <>
            <Alert variant="warning" title="No pudimos leer lo que viviste ese día">
              <p className={styles.errorText}>
                Tu plan sí está, así que abajo queda lo que tenías puesto. De lo que pasó no se
                afirma nada hasta poder mirarlo.
              </p>
              <Button variant="secondary" size="sm" onClick={refetch}>
                Reintentar
              </Button>
            </Alert>
            {review.ghostRows.length > 0 ? (
              <section className={styles.section} aria-labelledby="vida-review-plan-only">
                <h2 className={styles.sectionTitle} id="vida-review-plan-only">
                  Lo que tenías planeado
                </h2>
                <ol className={styles.rows}>
                  {review.ghostRows.map((row) => (
                    <VidaReviewRow key={row.id} row={row} isGhost />
                  ))}
                </ol>
              </section>
            ) : null}
            {exits()}
          </>,
        )}
      </div>
    )
  }

  const planFrenteARealTitle = `Plan frente a real · ${review.rows.length} ${
    review.rows.length === 1 ? 'bloque' : 'bloques'
  }`

  return (
    <div className={styles.root}>
      {header()}
      {strip()}
      {sections(
        <>
          {failed.length > 0 ? (
            // Una consulta caída y las otras no: se dice **qué** falta en vez de
            // dejar la pantalla a medias sin explicación (criterio 23).
            <Alert variant="warning" title="Falta una parte de tu día">
              <p className={styles.errorText}>
                No pudimos cargar {failed.join(' ni ')}. Lo demás es correcto.
              </p>
              <Button variant="secondary" size="sm" onClick={refetch}>
                Reintentar
              </Button>
            </Alert>
          ) : null}

          {/* Una escritura que no salió **se dice**, sin reprochar y sin perder
              nada de lo elegido: la hoja se queda abierta con lo suyo y «Lo hice»
              no cambió nada (criterio 43). */}
          {createFollowUpMutation.isError ? (
            <Alert variant="warning" title="No pudimos guardar eso">
              <p className={styles.errorText}>
                Se quedó sin apuntar. Revisa tu conexión y vuelve a intentarlo cuando quieras; lo
                demás de tu día sigue igual.
              </p>
            </Alert>
          ) : null}

          <div className={styles.layout}>
            <div className={styles.side}>
              {review.story.length > 0 ? (
                <VidaReviewStory
                  dateLabel={review.dateLabel}
                  statusLabel={review.statusLabel}
                  sentences={review.story}
                />
              ) : null}

              {/* Sin nada registrado no hay cifra grande, porque no hay nada que
                  contar — y no hay ninguna frase que juzgue (criterios 19 y 21). */}
              {review.emptyNotice ? (
                <Card className={styles.empty} padding="md">
                  <h2 className={styles.emptyTitle}>{review.emptyNotice.title}</h2>
                  <p className={styles.emptyBody}>{review.emptyNotice.body}</p>
                  {review.emptyNotice.hint ? (
                    <p className={styles.emptyHint}>{review.emptyNotice.hint}</p>
                  ) : null}
                  {/* Las tres salidas del marco E, con **el mismo peso visual**:
                      misma `className`, ninguna destacada sobre las otras
                      (criterio 39). «Dejarlo así» cierra el asunto **del día
                      entero** y no vuelve a preguntar en este aparato. */}
                  {canFill && !dayDismissed ? (
                    <div className={styles.emptyActions}>
                      <button type="button" className={styles.emptyAction} onClick={logPast}>
                        Registrar tiempo pasado
                      </button>
                      <button type="button" className={styles.emptyAction} onClick={askAboutWholeDay}>
                        ¿Qué pasó?
                      </button>
                      <button
                        type="button"
                        className={styles.emptyAction}
                        onClick={() => dismissNoData(date, WHOLE_DAY_SLICE_ID)}
                      >
                        Dejarlo así
                      </button>
                    </div>
                  ) : null}
                  {canFill && dayDismissed ? (
                    <p className={styles.emptyHint}>Lo dejaste así.</p>
                  ) : null}
                </Card>
              ) : null}

              {review.figures && review.hasExecution ? (
                <VidaReviewFigures
                  figures={review.figures}
                  onLogPast={canFill ? logPast : undefined}
                />
              ) : null}

              {/* «Lo que no se hizo», con su razón: solo en escritorio, donde el
                  marco D lo pone a mano de la columna izquierda (criterio 22). En
                  el móvil ya está en su fila, y decirlo dos veces sería leerlo dos
                  veces con lector de pantalla. */}
              {isDesktop && review.missingRows.length > 0 ? (
                <section className={styles.section} aria-labelledby="vida-review-missing">
                  <h2 className={styles.sectionTitle} id="vida-review-missing">
                    Lo que no se hizo
                  </h2>
                  <p className={styles.sectionNote}>Con su razón, si la hay.</p>
                  <ol className={styles.rows}>
                    {review.missingRows.map((row) => (
                      <VidaReviewRow
                        key={`missing-${row.id}`}
                        row={row}
                        onDone={canFill ? markRowDone : undefined}
                        isSaving={createFollowUpMutation.isPending}
                      />
                    ))}
                  </ol>
                </section>
              ) : null}
            </div>

            <div className={styles.main}>
              {/* El plan en trazo fantasma del marco E: lo que tenías puesto, sin
                  afirmar de cada bloque que no se hizo (criterio 19). */}
              {review.ghostRows.length > 0 ? (
                <section className={styles.section} aria-labelledby="vida-review-ghost">
                  <h2 className={styles.sectionTitle} id="vida-review-ghost">
                    Lo que tenías planeado
                  </h2>
                  <p className={styles.sectionNote}>Marca lo que sí hiciste.</p>
                  <ol className={styles.rows}>
                    {review.ghostRows.map((row) => (
                      <VidaReviewRow
                        key={row.id}
                        row={row}
                        isGhost
                        onDone={canFill ? markRowDone : undefined}
                        isSaving={createFollowUpMutation.isPending}
                      />
                    ))}
                  </ol>
                </section>
              ) : null}

              {review.rows.length > 0 ? (
                <section className={styles.section} aria-labelledby="vida-review-rows">
                  <h2 className={styles.sectionTitle} id="vida-review-rows">
                    {planFrenteARealTitle}
                  </h2>
                  {/* Una sola derivación, dos pinturas: en escritorio los dos
                      carriles alineados por hora, en el móvil la lista compacta.
                      Nunca las dos a la vez — ni en pantalla ni en el DOM. */}
                  {isDesktop ? (
                    <VidaReviewLanes rows={review.lanes} />
                  ) : (
                    <ol className={styles.rows}>
                      {review.rows.map((row) => (
                        <VidaReviewRow
                          key={row.id}
                          row={row}
                          onDone={canFill ? markRowDone : undefined}
                          isSaving={createFollowUpMutation.isPending}
                        />
                      ))}
                    </ol>
                  )}
                </section>
              ) : null}

              {/* Fuera del plan: su cuenta y sus minutos (criterio 16). En
                  escritorio ya va dentro de los carriles, sin nada enfrente. */}
              {!isDesktop && review.offPlan.length > 0 ? (
                <section className={styles.section} aria-labelledby="vida-review-offplan">
                  <h2 className={styles.sectionTitle} id="vida-review-offplan">
                    Fuera del plan · {review.offPlan.length} · {review.offPlanMinutesLabel}
                  </h2>
                  <ol className={styles.rows}>
                    {review.offPlan.map((row) => (
                      <VidaReviewOffPlanRow key={row.id} row={row} />
                    ))}
                  </ol>
                </section>
              ) : null}

              {/* **En qué se repartió el día** (criterios 26–33). Va **al final**,
                  debajo de los carriles: es lo que se mira al final, no al empezar.
                  Los botones de cada tramo son de la tajada 3. */}
              {showsCategories ? (
                <section className={styles.section} aria-labelledby="vida-review-categories">
                  <h2 className={styles.sectionTitle} id="vida-review-categories">
                    Minutos por categoría
                  </h2>
                  <p className={styles.sectionNote}>
                    En qué se repartió el día · misma paleta que tus categorías.
                  </p>
                  <VidaReviewCategories breakdown={breakdown} />
                </section>
              ) : null}

              {noDataSlices.length > 0 ? (
                <section className={styles.section} aria-labelledby="vida-review-nodata">
                  <h2 className={styles.sectionTitle} id="vida-review-nodata">
                    {noDataSlices.length === 4
                      ? 'Los cuatro tramos más largos sin registrar'
                      : noDataSlices.length === 1
                        ? 'El tramo más largo sin registrar'
                        : `Los ${noDataSlices.length} tramos más largos sin registrar`}
                  </h2>
                  <VidaReviewNoDataList
                    slices={noDataSlices}
                    onAsk={canFill ? askAboutNoData : undefined}
                    onLeaveIt={canFill ? (slice) => dismissNoData(date, slice.id) : undefined}
                    isDismissed={(slice) => isNoDataDismissed(dismissedNoData, date, slice.id)}
                  />
                </section>
              ) : null}

              {/* Lo del aparato se dice **una vez**, donde se lee (criterio 15). */}
              {showsDeviceNote ? (
                <p className={styles.deviceNote}>
                  Las razones de «no se pudo» y lo que dejas así se guardan en este aparato: en otro
                  no estarán.
                </p>
              ) : null}

              {exits()}
            </div>
          </div>
        </>,
      )}

      {/* **La hoja de FEAT-004, tal cual** (criterios 37 y 38): ni una segunda
          hoja, ni un segundo «qué». Con `key` por apertura, y el fallo se lee
          **dentro** sin perder lo elegido, que es lo que ya hacía en Hoy. */}
      {logSheet && canFill ? (
        <VidaLogSessionSheet
          key={logSheetSession}
          open={logSheetOpen}
          onClose={() => setLogSheetOpen(false)}
          mode="log"
          date={date}
          dayLabel={dayLabel}
          suggestions={suggestions}
          defaultStartTime={defaultLogStartTime(dayHours.startTime, nowMinutes)}
          initial={logSheet.initial}
        />
      ) : null}
    </div>
  )
}

/** Cuántos minutos atrás arranca «Registrar tiempo pasado» por defecto. */
const LOG_DEFAULT_LOOKBACK_MINUTES = 30

/**
 * De qué hora parte «Registrar tiempo pasado»: **media hora antes de ahora** en
 * el día de hoy y el principio del día en uno pasado, donde no hay reloj al que
 * mirar. Es la misma regla que `VidaHoyPage`, **copiada y no importada** porque
 * allí es una función local de la página; moverla a un util compartido tocaría
 * Hoy, y esta tajada no lo toca.
 */
function defaultLogStartTime(dayStart: string, nowMinutes: number | null): string {
  if (nowMinutes === null) return dayStart
  const startOfDay = parseTimeToMinutes(dayStart)
  return minutesToTime(Math.max(startOfDay, nowMinutes - LOG_DEFAULT_LOOKBACK_MINUTES))
}

/**
 * El «dejarlo así» **del día entero** (criterio 39). Va en el **mismo** store y
 * en la **misma** lista que los tramos (`dismissedNoData`), con un id que
 * ningún tramo puede tener —los suyos son franjas `HH:mm-HH:mm`—: la
 * restricción del repositorio es «ninguna clave nueva en `localStorage`», y
 * esto no estrena ninguna.
 */
const WHOLE_DAY_SLICE_ID = 'dia-entero'

/** Por dónde se abrió la hoja. Un solo modo: aquí solo se registra lo pasado. */
type LogSheetState = {
  /** Hora y duración **ya puestas**: el rato de un tramo, o nada. */
  initial: { startTime?: string; durationMinutes?: number } | null
}

/** Cuántos días mira la regla del puente (criterio 55). */
const BRIDGE_LOOKBACK_DAYS = 14

/**
 * **El puente a la plantilla** (criterios 54–59, A5 y A6).
 *
 * Es un componente aparte **por el coste**: sus consultas solo existen mientras
 * está montado, y solo se monta con **la semana abierta**. Así las tajadas 1, 2
 * y 3 no pagan nada y la vista de día sigue costando lo mismo que ayer.
 *
 * Lo que pide, y por qué son ocho y no catorce (A5):
 *
 * - **Los planes de los 14 días**, con el **mismo** `useVidaWeekPlans` y la
 *   misma clave por fecha: los de la semana vista y los de la tira ya están en
 *   caché, así que lo nuevo son los **siete** de atrás.
 * - **Las sesiones de los 14 días en una sola consulta de rango**
 *   (`vidaKeys.followUps.range`, que existía y no usaba nadie). **Una.**
 *
 * Y se piden **solo si hay plantilla**: sin ítems no hay nada que proponer
 * (criterio 59), así que ni se pregunta.
 *
 * **Lo único que escribe es `vidaItemUpdate` con `{ id, startTime }`.** En esta
 * función no se nombra ninguna mutación del plan del día: mover la hora del
 * ítem **no toca** ningún día ya armado, ni pasado ni futuro (criterio 57).
 */
function VidaReviewBridgeSection({
  weekMonday,
  today,
  dayHours,
}: {
  weekMonday: string
  today: string
  dayHours: { startTime: string; endTime: string }
}) {
  const itemsQuery = useVidaItemsQuery()
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])
  const hasTemplate = items.length > 0
  // Los 14 días **que ya pasaron**: hoy no ha terminado y no se cuenta como un
  // día en el que algo «no llegó a su hora».
  const dates = useMemo(
    () =>
      Array.from({ length: BRIDGE_LOOKBACK_DAYS }, (_, index) =>
        shiftYmd(today, index - BRIDGE_LOOKBACK_DAYS),
      ),
    [today],
  )
  const plans = useVidaWeekPlans(useMemo(() => (hasTemplate ? dates : []), [hasTemplate, dates]))
  const sessionsQuery = useActivityFollowUpsInDatesQuery(
    hasTemplate ? (dates[0] ?? '') : '',
    hasTemplate ? (dates[dates.length - 1] ?? '') : '',
  )

  const dismissedBridges = useVidaDeviceNotesStore((state) => state.dismissedBridges)
  const dismissBridge = useVidaDeviceNotesStore((state) => state.dismissBridge)
  const patternAnswers = useVidaDeviceNotesStore((state) => state.patternAnswers)
  const updateItem = useUpdateVidaItemMutation()

  const bridge = useMemo(() => {
    if (!hasTemplate) return null
    // El rango viene **agrupado por fecha** (`ActivityFollowUpsDateGroup`), que
    // es justo la forma que la regla necesita: un día, su plan y sus sesiones.
    const sessionsByDate = new Map(
      (sessionsQuery.data ?? []).map((group) => [group.date, group.followUps] as const),
    )
    return buildTemplateBridge({
      items,
      days: dates.map((date) => ({
        date,
        planItems: plans.byDate[date]?.items ?? [],
        followUps: sessionsByDate.get(date) ?? [],
      })),
      dayHours,
    })
  }, [hasTemplate, items, dates, plans.byDate, sessionsQuery.data, dayHours])

  // Movido: la tarjeta se va y queda dicho qué pasó. No hace falta esconderlo
  // a mano —con la hora nueva la regla ya no propone lo mismo—, pero entre la
  // respuesta del API y la plantilla fresca hay un parpadeo, y en ese hueco no
  // se vuelve a preguntar lo que se acaba de contestar.
  if (updateItem.isSuccess) {
    return <p className={styles.deviceNote}>Movido en tu plantilla. Los días ya armados se quedan como están.</p>
  }
  if (!bridge) return null
  // **«Dejarlo como está» no vuelve esa semana** (criterio 58): la nota es de
  // este aparato, en el mismo store y la misma clave que los «dejarlo así».
  if (isBridgeDismissed(dismissedBridges, weekMonday, bridge.itemId)) return null
  // **La condición simétrica de FEAT-007** (punto 5 del plan): si la sugerencia
  // de hora de este mismo ítem ya se contestó en «Lo que se repite», el puente
  // no la vuelve a hacer. Es la misma pregunta con otra ventana, y preguntarla
  // dos veces guardando la respuesta en dos sitios es lo que había que evitar.
  // No se toca `buildTemplateBridge` ni su regla: solo **no se pinta**.
  //
  // Y se calla **con las mismas tres condiciones de D1**, no cuatro semanas a
  // ciegas: si el desfase se mueve diez minutos o más, la pregunta vuelve aquí
  // igual que vuelve allí. Si no, la misma respuesta tendría dos plazos.
  if (
    isBridgeSilencedByAnswer({
      answer: getStartTimeAnswerFor(patternAnswers, bridge.itemId),
      offsetMinutes:
        parseTimeToMinutes(bridge.proposedTime) - parseTimeToMinutes(bridge.currentTime),
      today,
    })
  ) {
    return null
  }

  return (
    <VidaReviewBridge
      bridge={bridge}
      isSaving={updateItem.isPending}
      onMove={(chosen) => updateItem.mutate({ id: chosen.itemId, startTime: chosen.proposedTime })}
      onDismiss={(chosen) => dismissBridge(weekMonday, chosen.itemId)}
    />
  )
}

/**
 * **«Lo que se repite»: la adherencia y los patrones por actividad**
 * (FEAT-007, tajadas 1 y 2).
 *
 * Es un componente aparte **por el coste**, igual que `VidaReviewBridgeSection`
 * y por la misma razón (A5): sus consultas solo existen mientras está montado,
 * y solo se monta con **su sección abierta**. «Un día» y «La semana» siguen
 * costando exactamente lo de ayer.
 *
 * Lo que pide, y por qué (criterio 103, medido en el dossier):
 *
 * - **Los planes de la ventana, uno por día**, con la clave de día que ya
 *   existe. Son hasta 42 porque **el esquema no tiene consulta de plan por
 *   rango** y esta feature no crea documentos GraphQL. Los que la tira, la
 *   semana y el puente ya trajeron son aciertos de caché.
 * - **Las sesiones, una sola consulta de rango**, la misma que usa el puente.
 * - **La plantilla**, con la clave que ya piden Plantilla y Actividades.
 *
 * **Lo único que escribe es `vidaItemUpdate`** con `{ id }` más el campo que
 * cambia (criterios 79 y 81): aquí no se nombra ninguna mutación del plan del
 * día, así que **ningún día ya armado se mueve**. Y «Dejarlo» no llama a
 * nadie: se guarda en el aparato, en la clave que ya existe.
 */
function VidaPatternsSection({
  today,
  nowMinutes,
  dayHours,
}: {
  today: string
  nowMinutes: number | null
  dayHours: { startTime: string; endTime: string }
}) {
  const patterns = useVidaPatterns({ enabled: true, today, nowMinutes, dayHours })
  const updateItem = useUpdateVidaItemMutation()
  // Lo aplicado se recuerda **en la pantalla, no en el aparato**: con la
  // plantilla fresca la regla ya no propone lo mismo, pero entre la respuesta
  // del API y la lista nueva hay un parpadeo, y en ese hueco no se vuelve a
  // preguntar lo que se acaba de contestar. Es lo que hace el puente.
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const adherence = patterns.adherence

  function applySuggestion(suggestion: VidaPatternSuggestion) {
    updateItem.mutate(
      // **Un solo `vidaItemUpdate`, con el id y solo el campo que cambia.**
      { id: suggestion.itemId, ...suggestion.templatePatch },
      { onSuccess: () => setAppliedIds((current) => [...current, suggestion.id]) },
    )
  }

  function activityPatterns() {
    if (patterns.patterns.length === 0 && patterns.waiting.length === 0) return null
    return (
      <section className={styles.section} aria-labelledby="vida-review-activities">
        <h3 className={styles.sectionTitle} id="vida-review-activities">
          {adherence.hasAdherence ? 'Por actividad' : 'Lo que ya se sabe'}
        </h3>
        <p className={styles.sectionNote}>{patterns.patternsLabel}</p>

        <div className={styles.patternList}>
          {patterns.patterns.map((pattern) => (
            <VidaPatternCard
              key={pattern.itemId}
              pattern={pattern}
              isSaving={updateItem.isPending}
              appliedLabel={
                pattern.suggestion && appliedIds.includes(pattern.suggestion.id)
                  ? 'Cambiado en tu plantilla. Los días que ya tienes armados se quedan como están.'
                  : null
              }
              onApply={applySuggestion}
              onDismiss={patterns.answerSuggestion}
            />
          ))}
        </div>

        {patterns.waiting.length > 0 ? (
          <ul className={styles.waitingList}>
            {patterns.waiting.map((entry) => (
              <li className={styles.waitingRow} key={entry.itemId}>
                <span className={styles.waitingName}>{entry.title}</span>
                <span className={styles.waitingWhen}>{entry.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className={styles.sectionNote}>
          Una actividad aparece aquí cuando la has planeado {PATTERN_MIN_OCCURRENCES} veces o más.
          Las demás esperan, y se dice cuántas veces llevan.
        </p>
      </section>
    )
  }

  return (
    <>
      <section className={styles.section} aria-labelledby="vida-review-patterns">
        <h2 className={styles.sectionTitle} id="vida-review-patterns">
          Lo que se repite
        </h2>
        <p className={styles.sectionNote}>
          Sale de tus propios días · no hay nada que configurar
        </p>
      </section>

      {/* Una consulta caída **no es «no tienes datos»** (criterio 72): se dice
          qué pasó, se ofrece reintentar, y lo que sí llegó se sigue contando. */}
      {patterns.hasError ? (
        <Alert variant="warning" title="Falta algún día de estas semanas">
          <p className={styles.errorText}>
            De los días que no pudimos cargar no se afirma nada: las cuentas de abajo son de los
            que sí llegaron.
          </p>
          <Button variant="secondary" size="sm" onClick={patterns.refetch}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {patterns.nothingYet ? (
        <div aria-busy="true" aria-live="polite" className={styles.skeleton}>
          <Skeleton width="100%" height={72} radius="1.25rem" />
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} width="100%" height={28} radius="0.75rem" />
          ))}
          <Skeleton width="100%" height={64} radius="1rem" />
          <span className={styles.srOnly}>Mirando tus últimas semanas…</span>
        </div>
      ) : (
        <div className={styles.patterns}>
          {/* Con pocas semanas, el marco F: **lo que ya se sabe primero** —la
              actividad que sí llegó a sus cuatro apariciones, entera y con sus
              dos salidas— y debajo lo que llega después (criterio 84). */}
          <VidaAdherenceSummary adherence={adherence}>
            {adherence.hasAdherence ? null : activityPatterns()}
          </VidaAdherenceSummary>
          {adherence.hasAdherence ? (
            <>
              <VidaAdherenceWeeks weeks={adherence.weeks} />
              <VidaAdherenceWeekdays
                weekdays={adherence.weekdays}
                weeksLabel={adherence.weeksLabel}
                note={adherence.weekdayNote}
              />
              {activityPatterns()}
            </>
          ) : null}
        </div>
      )}
    </>
  )
}
