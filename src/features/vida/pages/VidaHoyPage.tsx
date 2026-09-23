import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaAgendaBlock } from '@/features/vida/components/VidaAgendaBlock'
import { VidaAgendaGap } from '@/features/vida/components/VidaAgendaGap'
import { VidaAgendaNoData } from '@/features/vida/components/VidaAgendaNoData'
import { VidaAgendaSession } from '@/features/vida/components/VidaAgendaSession'
import { VidaBlockHint } from '@/features/vida/components/VidaBlockHint'
import { VidaDayActions } from '@/features/vida/components/VidaDayActions'
import { VidaDayBudget } from '@/features/vida/components/VidaDayBudget'
import { VidaDayStrip } from '@/features/vida/components/VidaDayStrip'
import { VidaGoalArcRow } from '@/features/vida/components/VidaGoalArc'
import { VidaGoalPrompt } from '@/features/vida/components/VidaGoalPrompt'
import { VidaLogSessionSheet } from '@/features/vida/components/VidaLogSessionSheet'
import { VidaUpNextCard } from '@/features/vida/components/VidaUpNextCard'
import type { VidaLogSessionMode } from '@/features/vida/components/VidaLogSessionSheet'
import { VidaPlaceInGapSheet } from '@/features/vida/components/VidaPlaceInGapSheet'
import { VidaTemplateAside } from '@/features/vida/components/VidaTemplateAside'
import {
  useActivityCategoriesQuery,
  useSetActivityCategoryGoalMutation,
} from '@/features/vida/hooks/useActivityCategories'
import {
  useAddDayPlanItemMutation,
  useEditDayPlanItemMutation,
} from '@/features/vida/hooks/useActivityDayPlan'
import { useCreateActivityFollowUpMutation } from '@/features/vida/hooks/useActivityFollowUps'
import { useBuildDayFromTemplate } from '@/features/vida/hooks/useBuildDayFromTemplate'
import { useVidaDayData } from '@/features/vida/hooks/useVidaDayData'
import { useVidaNowMinute } from '@/features/vida/hooks/useVidaNowMinute'
import { useVidaOpenSession } from '@/features/vida/hooks/useVidaOpenSession'
import { useVidaPatterns } from '@/features/vida/hooks/useVidaPatterns'
import { useVidaSessionActions } from '@/features/vida/hooks/useVidaSessionActions'
import { useVidaSessionUi } from '@/features/vida/hooks/useVidaSessionUi'
import { useVidaWeekPlans } from '@/features/vida/hooks/useVidaWeekPlans'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
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
import { templateNoteForActivity } from '@/features/vida/utils/vida-notes.utils'
import {
  buildDayClosingLine,
  buildDayExecution,
  collectDayClosing,
  plannedSessionMinutes,
} from '@/features/vida/utils/vida-execution.utils'
import type {
  BlockExecution,
  ExecutionEntry,
  NoDataSlice,
} from '@/features/vida/utils/vida-execution.utils'
import { buildGoalArcs } from '@/features/vida/utils/vida-goals.utils'
import type { VidaBlockHint as BlockHint } from '@/features/vida/utils/vida-patterns.utils'
import {
  pickBlockHints,
  usualDurationsByActivityId,
  usualDurationsByItemId,
} from '@/features/vida/utils/vida-patterns.utils'
import { logSessionInput } from '@/features/vida/utils/vida-session.utils'
import {
  buildUpNext,
  collectResolvedBlockIds,
  findUpNextAnchorId,
  pickUpNextBlock,
} from '@/features/vida/utils/vida-up-next.utils'
import {
  getBlockNote,
  isNoDataDismissed,
  useVidaDeviceNotesStore,
} from '@/features/vida/store/vida-device-notes.store'
import type { GapWindow } from '@/features/vida/utils/vida-gap-form.utils'
import type { RealGapWindow } from '@/features/vida/utils/vida-gap-window.utils'
import {
  gapToWindow,
  getBlockEditWindow,
  toDayPlanTimes,
} from '@/features/vida/utils/vida-gap-form.utils'
import {
  describeBuildDay,
  usableTemplateItems,
} from '@/features/vida/utils/vida-build-day.utils'
import { minutesToTime, parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'
import {
  VIDA_DAY_LABELS,
  formatDayHeading,
  getCurrentLocalDate,
  getVidaDayOfWeek,
  pluralDayLabel,
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

/**
 * **La sesión de un bloque cuya nota se puede leer y escribir** (FEAT-018).
 *
 * Es el mismo `span.session` que ya usa el «Corregir» del «···» del bloque.
 *
 * **Desde la tajada 2 incluye también la que está en marcha** (criterio 542):
 * la fila del plan y la fila de fuera del plan enseñan y editan la nota
 * exactamente igual, y las dos preguntan «¿Qué estás haciendo?» mientras corre
 * —quien decide la palabra es la fila, que ya sabe si está en marcha—. Antes
 * divergían: la de fuera del plan la enseñaba y la del plan la escondía
 * (hallazgo 1 de la revisión de la tajada 1).
 *
 * El «＋ añadir qué hiciste» del criterio 537 sigue sin aparecer sobre una
 * sesión en marcha: ahí la línea dice otra cosa.
 */
function blockNoteSession(execution: BlockExecution | undefined): ActivityFollowUp | null {
  if (!execution) return null
  return execution.span.session
}

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
 * preguntas, y el «···» de un bloque lo quita o le cambia la hora. La tajada 4
 * la sacó de «hoy» y la 5 le añade **«Armar desde la plantilla»** en un día
 * vacío que se pueda planear —la mitad del criterio 21 que faltaba— y la vía a
 * la vista de semana desde la tira.
 *
 * **Desde FEAT-004 la pantalla vive el día.** La tajada 1 trajo «Empezar», el
 * cronómetro y «Terminar»; la **tajada 2** pinta **lo real encima de lo
 * planeado**: recorre `execution.entries` en vez de `agenda.entries` —los
 * bloques siguen en su hora y enseñan lo suyo, y lo que no es de ningún bloque
 * se cuela en la suya— y el presupuesto cambia de forma cuando el día se cierra
 * (D5). Todo eso sale de un **segundo pase puro**,
 * `utils/vida-execution.utils.ts`: `buildDayAgenda` no sabe nada de sesiones.
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
  // La sesión en marcha (FEAT-004, tajada 1). Es **la misma** consulta que lee
  // la barra del módulo: `vidaKeys.followUps.open()`, cacheada y deduplicada
  // por React Query (criterio 8). El cierre completo lo abre el layout, que es
  // quien monta el modal.
  const openSession = useVidaOpenSession()
  const { openFinishModal, openNoteSheet, openStartNoteSheet } = useVidaSessionUi()
  const sessionActions = useVidaSessionActions({ onAddNote: openFinishModal })
  // «▶ Empezar» solo en **hoy**: en un día futuro no ha llegado y en uno pasado
  // se registra, que es la tajada 3 (criterio 1, su mitad de días). La otra
  // mitad —esconderlo también en el bloque que **ya tiene** sesión— necesita el
  // cruce de D1 y llega en la tajada 2.
  const canStart = isToday && !openSession.isDisabled && !openSession.isFromAnotherDay

  /**
   * **Lo que se escribió antes de empezar** (FEAT-018, tajada 3), por bloque.
   *
   * La clave es `block.id` —el bloque, no la actividad— por el mismo motivo
   * que ya manda en `isRunning`: dos bloques de la misma actividad el mismo
   * día son dos cosas distintas. Y es **uno solo** para las dos puertas, así
   * que escribir la nota en la fila y pulsar en «Lo que viene» usa la misma.
   *
   * Vive en la pantalla y no en el API a propósito: hasta que no se pulse
   * «▶ Empezar» no hay ninguna sesión que escribir.
   */
  const [startNoteDrafts, setStartNoteDrafts] = useState<Record<string, string>>({})

  /**
   * **La única función que arranca** desde esta pantalla, para las dos puertas
   * (criterios 549 y 550).
   *
   * Sin nota escrita la llamada es **literalmente la de siempre**:
   * `start(activityId)`, un solo argumento. Con nota, **una sola** llamada a
   * `activityFollowUpStart` que ya la lleva dentro — nunca un arranque más una
   * edición aparte. El `null` del segundo hueco deja escrito que la hora de la
   * plantilla no viaja: la pone el reloj de la mutación.
   */
  function startWithNote(blockId: string, activityId: string) {
    const note = (startNoteDrafts[blockId] ?? '').trim()
    if (!note) return void sessionActions.start(activityId)
    void sessionActions.start(activityId, null, { notes: note })
  }

  /**
   * Abrir el editor de «¿Qué vas a hacer?»: lo que guarde se queda en el
   * borrador.
   *
   * **La plantilla propone aquí y solo aquí** (criterio 556): si este bloque
   * sale de un ítem de plantilla con nota, el editor abre con ese texto ya
   * escrito, editable y borrable como cualquier otro. Sin ítem detrás abre
   * vacío (criterio 558).
   *
   * El `??` es el que sostiene el criterio 557 por partida doble: la propuesta
   * solo se mira **al abrir el editor**, así que quien no lo abra arranca sin
   * nota; y un borrador en `''` —lo vació a propósito— no es nulo, así que
   * gana él y la plantilla no vuelve a colarse.
   */
  function editStartNote(blockId: string, activityId: string, title: string) {
    openStartNoteSheet({
      activityId,
      title,
      initialValue:
        startNoteDrafts[blockId] ?? templateNoteForActivity(suggestions, activityId) ?? '',
      onSave: (notes) =>
        setStartNoteDrafts((drafts) => ({ ...drafts, [blockId]: notes ?? '' })),
    })
  }
  const runningActivityId = openSession.session?.activityId ?? null
  // **Registrar** se puede en cualquier día de la tira que ya haya ocurrido, sea
  // hoy o de atrás, aunque su **plan** no se pueda tocar (D10, criterios 32 y
  // 56). En un día futuro, no: no se registra lo que no ha pasado.
  const canLogPast = isToday || isPast
  // **Lo que falta** (tajada 4). Lo que vive en este aparato —la razón de un
  // «No se pudo» y los tramos que se dejaron así— sale de un store con
  // `persist`, el molde de `habit-identity.store.ts`. Es lo **único** de toda
  // la feature que escribe en `localStorage`, y la pantalla lo dice.
  const blockNotes = useVidaDeviceNotesStore((state) => state.blockNotes)
  const dismissedNoData = useVidaDeviceNotesStore((state) => state.dismissedNoData)
  const markBlockCouldNot = useVidaDeviceNotesStore((state) => state.markBlockCouldNot)
  const clearBlockNote = useVidaDeviceNotesStore((state) => state.clearBlockNote)
  const dismissNoData = useVidaDeviceNotesStore((state) => state.dismissNoData)
  // «Lo hice» escribe una sesión con lo planeado (criterio 41). Es la misma
  // mutación que usa la hoja de registrar: ni clave ni invalidación nuevas.
  const createFollowUpMutation = useCreateActivityFollowUpMutation()
  const {
    planItems,
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
  // Lo real encima de lo planeado (FEAT-004, tajada 2). Es un **segundo pase
  // puro** sobre la agenda: los bloques se quedan en su hora y enseñan lo que
  // pasó, lo que no es de ningún bloque se cuela en la suya, y el presupuesto
  // cambia de forma cuando el día se cierra. Sin sesiones registradas devuelve
  // exactamente las entradas de `buildDayAgenda` y la barra de F2 (criterio 29).
  // La sesión **en marcha** se une a lo que devolvió el día antes de cruzar.
  // `activityDayFollowUps` es la fuente de lo vivido, pero nadie ha podido
  // comprobar contra el API real si incluye la que sigue abierta: si no la
  // trajera, el bloque en marcha dejaría de estar en marcha en cuanto la
  // tajada 2 pasó a decidirlo por el cruce. Si ya viene, **no se duplica**:
  // manda el `id`. La de otro día no entra (criterio 16: se pregunta, no se
  // pinta).
  const dayFollowUps = useMemo(() => {
    const open = openSession.session
    if (!open || open.date !== date) return followUps
    return followUps.some((followUp) => followUp.id === open.id) ? followUps : [...followUps, open]
  }, [followUps, openSession.session, date])
  /**
   * **El catálogo de categorías** (FEAT-016, tajada 2), de donde salen las
   * metas: cada categoría trae dentro la suya, o `null`.
   *
   * Va **en la página y no en `useVidaDayData`**: el contrato de ese hook son
   * las cuatro consultas **del día**, y su `failed` habla de ellas. Esta ya
   * está cacheada por Categorías y Actividades (`staleTime` de 5 min), así que
   * no es tráfico nuevo — pero sí es la primera vez que Hoy la usa.
   */
  const {
    data: categories = [],
    isError: categoriesFailed,
    isPending: categoriesPending,
    fetchStatus: categoriesFetchStatus,
  } = useActivityCategoriesQuery()
  /**
   * **Mientras el catálogo viaja no se afirma nada** (tajada 3). Sin esto,
   * `categories` es `[]` durante el primer viaje del día y de ahí salen cero
   * arcos: la pantalla enseñaría **la pregunta** a quien ya tiene su categoría
   * marcada, y un instante después la cambiaría por el arco. Se reserva el
   * hueco con un esqueleto, que además quita el salto que empujaba la agenda.
   *
   * Deshabilitada (sin sesión) es `isPending` con `fetchStatus: 'idle'`: el
   * idioma del módulo (`useVidaDayData.ts:71-78`). Eso **no** es cargar.
   */
  const categoriesLoading = categoriesPending && categoriesFetchStatus !== 'idle'
  /**
   * La **misma** mutación de la casilla del formulario (tajada 1): escribe el
   * puntero y, si no hay meta todavía, el servidor crea «Trabajo, 8h» en la
   * misma transacción. Su `onSuccess` invalida `vidaKeys.categories.list()`, así
   * que el arco aparece solo cuando el catálogo vuelve, sin recargar
   * (criterio 501) y sin ninguna invalidación nueva.
   */
  const setGoalMutation = useSetActivityCategoryGoalMutation()

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
  /**
   * **Los arcos de las metas** (FEAT-016, criterios 489–497). Las mismas
   * sesiones del día cruzadas con el catálogo: ni un documento GraphQL nuevo.
   * La que está en marcha entra sola, porque `toSessionSpans` ya la cuenta
   * hasta `nowMinutes` — el mismo reloj de 60 s que el resto de la pantalla
   * (criterio 491).
   */
  const goalArcs = useMemo(
    () =>
      buildGoalArcs({
        followUps: dayFollowUps,
        date,
        nowMinutes,
        categories,
        isPastDay: isPast,
        // El final del día, el **mismo** que ya recibe `getDayBudget` unas
        // líneas más arriba: el semáforo del arco mide contra él si lo que
        // falta todavía cabe hoy (FEAT-019, criterio 566). Ninguna consulta
        // nueva; el dato ya estaba en el ámbito.
        //
        // **`null` mientras los ajustes cargan**, y entonces no hay color:
        // `useVidaDayHours` sirve el respaldo de las 23:00 hasta que llega el
        // dato real, así que un día que acaba a las 18:00 se vería verde y
        // saltaría a rojo un instante después. El resto de la pantalla sí usa
        // el respaldo —es mejor una agenda aproximada que un hueco—, pero un
        // color de alarma que aparece solo porque una consulta iba a medias no
        // lo es.
        dayEnd: dayHours.isPending ? null : dayHours.endTime,
      }),
    [dayFollowUps, date, nowMinutes, categories, isPast, dayHours.endTime, dayHours.isPending],
  )
  const guidance = buildGuidanceLine({
    agenda,
    nowMinutes,
    dayStart: dayHours.startTime,
    dayEnd: dayHours.endTime,
  })
  const nextBlockId = findNextBlockId(agenda.blocks, nowMinutes)
  // El aviso de «tu plantilla está vacía» se da **una vez**, en el primer hueco
  // de verdad: repetirlo en cada uno sería ruido. Sale de `execution.entries` y
  // **no** de `agenda.gaps`: un hueco partido por una sesión estrena `id`, y
  // buscándolo en la lista vieja el aviso desaparecía del día con registros
  // (hallazgo 6 de la revisión de la tajada 2).
  const firstRealGapId =
    execution.entries.find((entry) => entry.kind === 'gap' && !entry.isSliver && !entry.isPast)
      ?.id ?? null

  // **Lo vivido se pudo mirar.** Sin esto no se afirma nada de lo que falta:
  // ni «pendiente», ni «no hecho», ni las tres salidas (criterio 58). El aviso
  // de «falta una parte de tu día» ya lo pinta `failed` más abajo.
  const executionKnown = !isFollowUpsError
  const noDataByGapId = executionKnown ? execution.noDataByGapId : {}
  // Qué bloques dijeron «No se pudo» en **este aparato**: es lo único que la
  // frase de cierre necesita del `localStorage`, y entra como un conjunto de
  // ids para que `collectDayClosing` siga siendo pura.
  const couldNotItemIds = useMemo(
    () =>
      new Set(
        planItems
          .filter((item) => getBlockNote(blockNotes, date, item.id) !== null)
          .map((item) => item.id),
      ),
    [planItems, blockNotes, date],
  )
  // **La frase de cierre** (criterio 51): solo con el día terminado y algo
  // registrado —la misma puerta que abre la forma cerrada del presupuesto— y
  // nunca sobre lo vivido que no cargó.
  const closingLine =
    executionKnown && execution.budget.form === 'closed'
      ? buildDayClosingLine(collectDayClosing({ execution, agenda, couldNotItemIds }))
      : null

  /* ── Lo que se repite, traído a Hoy (FEAT-007, tajada 3) ───────────────
   *
   * **La ventana de seis semanas se monta diferida, y no siempre.** Hoy es la
   * pantalla que más se abre del módulo y la ventana son 42 consultas de plan
   * más una de rango: montarla en el primer pintado sería castigar la pantalla
   * más usada por un aviso que puede esperar dos segundos. En Revisión esto se
   * contiene solo —la sección está cerrada hasta que la abres—; aquí no hay
   * sección que abrir, así que el interruptor es explícito y tiene **cuatro**
   * condiciones:
   *
   * 1. **El día se puede planear** (`canPlan`). Un día pasado se mira: no hay
   *    nada que proponerle, así que no paga ni una consulta (criterio 38).
   * 2. **Los datos propios de la pantalla ya resolvieron.** El primer pintado
   *    de Hoy no espera a nadie, que es lo que pide el criterio 92.
   * 3. **Hay algo de lo que hablar**: o un plan armado, o una plantilla con la
   *    que armarlo. Sin ninguna de las dos no hay bloque al que pegar un aviso
   *    ni ficha a la que ponerle una duración.
   * 4. Y la de siempre: **hay sesión** (el propio hook lo comprueba).
   *
   * El coste medido está escrito en el dossier (criterio 103). El resumen:
   * abrir Hoy en frío pasa de ~13 consultas a ~53 el peor día, y **volver a
   * abrirla en la misma sesión cuesta cero**, porque los días cerrados de la
   * ventana ya no caducan solos.
   */
  const canShowPatterns = canPlan && !isDisabled && !isPending && !isPlanError
  const patterns = useVidaPatterns({
    enabled: canShowPatterns && (planItems.length > 0 || suggestions.length > 0),
    // **El hoy de verdad**, no el día que se mira: la ventana mira hacia atrás
    // desde hoy y es **la misma** para las tres pantallas. Si Hoy mirase desde
    // el día visto, la misma costumbre tendría un número distinto en cada
    // pantalla y la regla de los diez minutos de D1 dispararía sola.
    today,
    nowMinutes,
    dayHours,
  })

  // La duración que sueles tardar, para los chips del hueco (criterio 91).
  // Vacío mientras no haya patrones: Hoy es entonces el de FEAT-003/004.
  const usualDurations = useMemo(
    () => usualDurationsByItemId(patterns.patterns),
    [patterns.patterns],
  )
  // La misma costumbre **por actividad**, para la duración que viene puesta al
  // registrar en un hueco (FEAT-011, criterio 238). Al registrar no hay ítem de
  // plantilla: hay una actividad elegida, que puede ni estar en la plantilla de
  // hoy. Vacío mientras no haya patrones, como su hermana.
  const usualDurationsByActivity = useMemo(
    () => usualDurationsByActivityId(patterns.patterns),
    [patterns.patterns],
  )

  /* ── «Lo que viene» (FEAT-010, tajada 1) ────────────────────────────────
   *
   * **Cuesta cero** (criterio 204): es un `useMemo` puro sobre lo que la
   * pantalla ya tiene —la agenda, la ejecución, las notas de este aparato, la
   * costumbre y el reloj de `useVidaNowMinute`, que ya está montado—. **Ni una
   * consulta nueva, ni un temporizador nuevo.**
   *
   * Y lo que **no** hace, que es la razón de ser de la feature: la duración
   * planeada del bloque **no entra en ninguna mutación**. Se escribe como texto
   * («suele durarte 4 h»), la frase de verdad lo dice en la misma tarjeta y el
   * botón manda `start(activityId)` **sin duración y sin hora**: el cronómetro
   * nace en el segundo del toque (criterios 188, 196 y 373).
   *
   * Las cuatro puertas, en este orden:
   *
   * 1. **Solo en hoy y dentro del día** (criterio 180): sin `isToday`, sin
   *    reloj o con el reloj fuera de `[dayStart, dayEnd)` **no se pinta ningún
   *    nodo** —ni vacío ni escondido por CSS—.
   * 2. **Con los datos en vuelo no se afirma nada** (criterio 208).
   * 3. **Sin saber lo vivido no se propone** (criterio 209, su primera mitad):
   *    proponer sin saber qué está hecho es afirmar lo que no se sabe.
   * 4. **Sin candidato, no hay tarjeta.** La cara de «ya no queda nada» es el
   *    criterio 377 y llega en la tajada 2.
   */
  const upNext = useMemo(() => {
    if (!isToday || nowMinutes === null) return null
    const dayStartMinutes = parseTimeToMinutes(dayHours.startTime)
    const dayEndMinutes = parseTimeToMinutes(dayHours.endTime)
    if (dayStartMinutes === null || dayEndMinutes === null) return null
    if (nowMinutes < dayStartMinutes || nowMinutes >= dayEndMinutes) return null
    if (isDisabled || isPending || isPlanError) return null
    if (!executionKnown) return null

    const anchorId = findUpNextAnchorId({
      entries: execution.entries,
      byBlockId: execution.byBlockId,
    })
    if (anchorId === null) return null

    const resolvedBlockIds = collectResolvedBlockIds({
      blocks: agenda.blocks,
      byBlockId: execution.byBlockId,
      insteadByBlockId: execution.insteadByBlockId,
      couldNotItemIds,
    })
    const block = pickUpNextBlock({ blocks: agenda.blocks, resolvedBlockIds, nowMinutes })
    if (block === null) return null

    // El nombre de lo que está corriendo, para la coletilla del criterio 378.
    // Sale del **ancla**, no de la sesión abierta a secas: si el ancla es la
    // marca de AHORA no hay nada en marcha y la coletilla no se escribe.
    const anchorEntry = execution.entries.find((entry) => entry.id === anchorId) ?? null
    const runningTitle =
      anchorEntry === null || anchorEntry.kind === 'now' || anchorEntry.kind === 'gap'
        ? null
        : anchorEntry.kind === 'session'
          ? anchorEntry.span.title
          : (anchorEntry.item.activity?.title ?? 'lo que tienes en marcha')

    return buildUpNext({
      block,
      anchorId,
      usualMinutes: usualDurationsByActivity[block.item.activityId] ?? null,
      runningTitle,
      nowMinutes,
      openCount: agenda.blocks.length - resolvedBlockIds.size,
      canStart,
      // Qué falta para poder empezar (criterio 189). La pregunta de la sesión
      // de otro día **ya está en la barra fija del módulo**, que sigue en
      // todas las pantallas (criterio 203): la tarjeta lleva hasta ahí, no
      // estrena un segundo sitio donde contestarla.
      blockedNote: openSession.isFromAnotherDay
        ? 'Tienes una sesión de otro día sin cerrar. Contéstala en la barra de arriba y podrás empezar esto.'
        : 'Para empezar algo necesitas tu sesión iniciada.',
    })
  }, [
    isToday,
    nowMinutes,
    dayHours.startTime,
    dayHours.endTime,
    isDisabled,
    isPending,
    isPlanError,
    executionKnown,
    execution.entries,
    execution.byBlockId,
    execution.insteadByBlockId,
    agenda.blocks,
    couldNotItemIds,
    usualDurationsByActivity,
    canStart,
    openSession.isFromAnotherDay,
  ])

  // **Dos avisos como mucho, y nunca dos del mismo bloque** (criterio 88). La
  // regla entera vive en `pickBlockHints`, que es puro y está probado; aquí
  // solo se le dan los bloques del día con el sitio que tienen para moverse.
  const blockHints = useMemo(() => {
    if (!canShowPatterns) return []
    return pickBlockHints({
      patterns: patterns.patterns,
      blocks: agenda.blocks.map((block) => {
        const space = getBlockEditWindow(agenda, block.id)
        return {
          blockId: block.id,
          activityId: block.item.activityId,
          startMinutes: block.startMinutes,
          durationMinutes: block.durationMinutes,
          windowStartMinutes: space?.startMinutes ?? block.startMinutes,
          windowEndMinutes: space?.endMinutes ?? block.endMinutes,
          // Un bloque que ya terminó, o que ya tiene sesión, no está «por
          // planear»: cambiarle la hora a toro pasado no es un aviso, es
          // llegar tarde.
          isDone:
            Boolean(execution.byBlockId[block.id]) ||
            (nowMinutes !== null && block.endMinutes <= nowMinutes),
        }
      }),
      scopeLabel: isToday ? 'solo para hoy' : `solo para el ${formatDayHeading(date).toLowerCase()}`,
    })
  }, [canShowPatterns, patterns.patterns, agenda, execution.byBlockId, nowMinutes, isToday, date])

  const hintByBlockId = useMemo(
    () => Object.fromEntries(blockHints.map((hint) => [hint.blockId, hint])),
    [blockHints],
  )

  const editMutation = useEditDayPlanItemMutation()

  /**
   * **Sí**: cambia **el bloque de este día** y nada más (criterio 89, D2). Es
   * un `activityDayPlanItemEdit`, la misma mutación que usa la hoja de «cambiar
   * hora o duración»: **cero llamadas a `vidaItemUpdate`**, la plantilla no se
   * entera. Lo que la plantilla tiene que cambiar se decide con calma en «Lo
   * que se repite», que es donde la consecuencia cabe escrita entera.
   */
  function applyBlockHint(hint: BlockHint) {
    const block = agenda.blocks.find((candidate) => candidate.id === hint.blockId)
    if (!block) return
    const startTime =
      'startTime' in hint.dayPatch ? hint.dayPatch.startTime : minutesToTime(block.startMinutes)
    const durationMinutes =
      'durationMinutes' in hint.dayPatch ? hint.dayPatch.durationMinutes : block.durationMinutes
    editMutation.mutate({
      itemId: block.item.id,
      ...toDayPlanTimes(startTime, durationMinutes),
    })
  }

  // La hoja: una `key` por apertura, como `VidaActividadesPage`. Se remonta
  // limpia sin que nadie tenga que vaciarla a mano, y se queda montada al
  // cerrar para que la animación de salida se vea.
  const [sheet, setSheet] = useState<SheetState | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSession, setSheetSession] = useState(0)
  // La hoja de **registrar** (tajada 3), con su propia `key` por apertura: son
  // dos hojas distintas y no comparten estado.
  const [logSheet, setLogSheet] = useState<LogSheetState | null>(null)
  const [logSheetOpen, setLogSheetOpen] = useState(false)
  const [logSheetSession, setLogSheetSession] = useState(0)
  const addMutation = useAddDayPlanItemMutation()
  // Armar el día visto desde su plantilla (criterios 21, 41–44). Es una sola
  // `activityDayPlanSet` y el resumen se pinta aquí, porque lleva un enlace al
  // catálogo que no cabe en un toast.
  const buildDay = useBuildDayFromTemplate()

  function openSheet(next: SheetState) {
    setSheet(next)
    setSheetSession((session) => session + 1)
    setSheetOpen(true)
  }

  function openLogSheet(next: LogSheetState) {
    setLogSheet(next)
    setLogSheetSession((session) => session + 1)
    setLogSheetOpen(true)
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

  /**
   * **«Lo hice»** (criterio 41): la sesión con **la hora y la duración
   * planeadas**, recortada a «ahora» por `plannedSessionMinutes` para que nunca
   * nazca terminando en el futuro. Se deshace desde el «···» del bloque
   * —«Quitar del registro»—, que es lo que pide el mismo criterio.
   *
   * Si el bloque llevaba un «no se pudo», deja de ser verdad y la nota se va:
   * dos explicaciones contrarias sobre el mismo bloque se contradicen.
   */
  function markBlockDone(block: AgendaBlock) {
    clearBlockNote(date, block.item.id)
    createFollowUpMutation.mutate(
      logSessionInput({
        date,
        activityId: block.item.activityId,
        startTime: minutesToTime(block.startMinutes),
        durationMinutes: plannedSessionMinutes({ block, nowMinutes }),
      }),
    )
  }

  /**
   * **«Hice otra cosa»** (criterio 42): la hoja de «qué» con **el rato del
   * bloque ya puesto** y ajustable antes de guardar. El bloque no se toca: lo
   * que se registre encima de su hora lo explicará solo, porque «en su lugar,
   * X» se **deriva** del cruce (`findInsteadSession`).
   */
  function logInsteadOfBlock(block: AgendaBlock) {
    openLogSheet({
      mode: 'log',
      initial: {
        startTime: minutesToTime(block.startMinutes),
        durationMinutes: plannedSessionMinutes({ block, nowMinutes }),
      },
    })
  }

  /**
   * **«Registrar lo que hice»** en un hueco que ya pasó (FEAT-011, criterio
   * 222): la misma hoja de registrar, **anclada a ese hueco**. El inicio viene
   * puesto en el principio del hueco (criterio 223) y la duración **no**: la
   * pone la actividad que se elija, nunca el hueco entero (criterio 224).
   *
   * La ventana son los bordes **reales** (FEAT-011, tajada 2): los de lo
   * vivido, que `buildDayExecution` calcula junto a cada hueco ya partido
   * (`realWindowByGapId`, con la clave que estrena el trozo). Si «Desayunar»
   * acabó a las 9:28, el límite son las 9:28 y no las 9:30.
   *
   * El `?? gapToWindow(gap)` es la red de un hueco que no venga del mapa —la
   * puerta de arriba es `executionKnown`, así que en la pantalla no ocurre—:
   * antes que quedarse sin ventana, se valida contra el plan.
   */
  function logInGap(gap: AgendaGap) {
    const gapWindow = execution.realWindowByGapId[gap.id] ?? gapToWindow(gap)
    // **El hueco de delante no ancla nada** (criterio 242). Su ventana viene
    // recortada a «ahora» y por tanto sin un minuto dentro: anclarse a ella
    // sería abrir una hoja donde no cabe nada. Lo que se ofrece ahí es lo que
    // dice el renglón —«por si acabas de hacer algo sin decirlo»—: la hoja de
    // siempre, que parte de media hora atrás y que **ya** no deja escribir el
    // futuro (`validateLogPast`, FEAT-004).
    const isPastGap = gap.isPast || isPast
    if (!isPastGap && gapWindow.endMinutes <= gapWindow.startMinutes) {
      openLogSheet({ mode: 'log' })
      return
    }
    openLogSheet({
      mode: 'log',
      gapWindow,
      initial: { startTime: minutesToTime(gapWindow.startMinutes) },
    })
  }

  /** **«¿Qué pasó?»** de un tramo sin dato: la hoja con sus horas (criterio 48). */
  function askAboutNoData(slice: NoDataSlice) {
    openLogSheet({
      mode: 'log',
      initial: { startTime: slice.startTime, durationMinutes: slice.durationMinutes },
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
      <div className={styles.stripRow}>
        <VidaDayStrip
          days={stripDays}
          plans={weekPlans.byDate}
          edgeNote={describePlanningWindowEdge(today)}
        />
        {/* La semana entera de un vistazo (tajada 5). Se llega desde aquí y no
            desde la barra: `app-nav.config.ts` sigue siendo una sola fuente y
            la píldora encendida sigue siendo «Hoy». */}
        <Link className={styles.weekLink} to={vidaPaths.semanaForDate(date)}>
          Ver la semana
        </Link>
      </div>
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
  // Lo que de verdad se puede armar: sin los ítems desactivados **y sin las
  // actividades archivadas**. Antes solo miraba `isActive`, así que el botón
  // podía decir «(3 cosas)» y dejar 2 bloques. Es la misma regla que usa la
  // semana (`templateItemsForDate`).
  const buildableTemplate = usableTemplateItems(suggestions.map((suggestion) => suggestion.item))
  const templateCount = buildableTemplate.length
  // El resumen del último armado, y solo si fue **de este día**: al cambiar de
  // día no se arrastra el aviso de otro.
  const buildNotes =
    buildDay.lastBuild?.date === date ? describeBuildDay(buildDay.lastBuild.summary) : null

  /**
   * Una fila de la agenda. **Su contenido no cambia una coma**: se extrajo del
   * `map` tal cual para que la tarjeta de «Lo que viene» pueda entrar como
   * hermana suya en el `flatMap` de abajo (FEAT-010, criterio 370).
   */
  function renderEntry(entry: ExecutionEntry): ReactNode {
      if (entry.kind === 'now') {
        return (
          <li className={styles.nowRow} ref={nowRef} key="now">
            <span className={styles.nowTime}>{nowLabel}</span>
            <span className={styles.nowLine} aria-hidden />
            <span className={styles.nowPill}>Ahora</span>
          </li>
        )
      }
      if (entry.kind === 'session') {
        // Algo que pasó y no es de ningún bloque, o lo real de un movido: en
        // **su** hora, punteado, sin tocar el plan (criterios 22 y 23).
        return (
          <VidaAgendaSession
            key={entry.id}
            entry={entry}
            // Corregir y «Quitar del registro» (criterio 35). Se ofrece en
            // los mismos días en que se registra —hoy y pasados—, y **no**
            // en uno futuro, donde no hay nada que corregir.
            onEdit={
              canLogPast
                ? (session) => openLogSheet({ mode: 'edit', session })
                : undefined
            }
            // **Qué hiciste / qué estás haciendo** (FEAT-018, criterios 535 a
            // 538 y 542). Se ofrece en los mismos días en que se registra
            // —hoy y pasados—, **también mientras corre**: ahí la fila
            // pregunta «¿Qué estás haciendo?», igual que la barra y que el
            // bloque del plan.
            note={entry.span.session.notes}
            onEditNote={canLogPast ? () => openNoteSheet(entry.span.session) : undefined}
          />
        )
      }
      return (
        <Fragment key={entry.id}>
          {entry.kind === 'block' ? (
            <>
            <VidaAgendaBlock
              block={entry}
              isNext={entry.id === nextBlockId}
              nowMinutes={nowMinutes}
              // Sin `date` el bloque no pinta el «···»: en un día pasado no
              // hay nada que quitar ni que cambiar de hora (criterio 38).
              date={canPlan ? date : null}
              onEdit={canPlan ? editBlock : undefined}
              // **El bloque**, no la actividad: con dos bloques de la misma
              // actividad el mismo día, el cruce de D1 dice cuál está en
              // marcha y el otro se queda quieto (hallazgo 2 de la tajada 1).
              isRunning={execution.byBlockId[entry.id]?.isRunning ?? false}
              execution={execution.byBlockId[entry.id] ?? null}
              sessionStartInstant={openSession.startInstant}
              // La otra mitad del criterio 1: «▶ Empezar» tampoco se pinta en
              // un bloque que **ya tiene** sesión, esté en marcha o cerrada.
              onStart={
                canStart && !execution.byBlockId[entry.id] && entry.item.activityId !== runningActivityId
                  ? (block) => startWithNote(block.id, block.item.activityId)
                  : undefined
              }
              // **Antes de empezar** (criterios 548 a 551). Se ofrece en los
              // mismos bloques que el «▶ Empezar» y **por separado de él**:
              // quien no toque el lápiz arranca con un toque, igual que ayer.
              noteDraft={startNoteDrafts[entry.id] ?? null}
              onEditStartNote={
                canStart && !execution.byBlockId[entry.id] && entry.item.activityId !== runningActivityId
                  ? () =>
                      editStartNote(
                        entry.id,
                        entry.item.activityId,
                        entry.item.activity?.title ?? 'Actividad',
                      )
                  : undefined
              }
              onFinish={() => void sessionActions.finishNow()}
              onOpenFinishModal={
                openSession.session ? () => openFinishModal(openSession.session!) : undefined
              }
              isSessionBusy={sessionActions.isBusy}
              // **Lo que falta** (tajada 4). Con lo vivido caído no se pasa
              // nada de esto: no se afirma «no hecho» de lo que no se pudo
              // comprobar (criterio 58).
              missing={executionKnown ? execution.missingByBlockId[entry.id] : null}
              instead={execution.insteadByBlockId[entry.id] ?? null}
              couldNot={getBlockNote(blockNotes, date, entry.item.id)}
              outcomes={
                executionKnown && canLogPast
                  ? {
                      onDid: () => markBlockDone(entry),
                      onDidSomethingElse: () => logInsteadOfBlock(entry),
                      onCouldNot: (reason) =>
                        markBlockCouldNot(date, entry.item.id, reason),
                      onClearCouldNot: () => clearBlockNote(date, entry.item.id),
                      isBusy: createFollowUpMutation.isPending,
                    }
                  : null
              }
              // Corregir y quitar **la sesión de este bloque** (criterios 35
              // y 41): el camino más común —empezarlo y terminarlo— también
              // se corrige, y también en un día pasado.
              onEditSession={
                canLogPast ? (session) => openLogSheet({ mode: 'edit', session }) : undefined
              }
              // **Qué hiciste / qué estás haciendo** (FEAT-018, criterios 535 a
              // 538 y 542). La nota sale de la sesión que el cruce de D1
              // asignó a **este** bloque, esté terminada o en marcha: mientras
              // corre se edita desde aquí **y** desde la barra, y las dos
              // escriben lo mismo porque es la misma sesión.
              note={blockNoteSession(execution.byBlockId[entry.id])?.notes ?? null}
              onEditNote={
                canLogPast && blockNoteSession(execution.byBlockId[entry.id])
                  ? () => openNoteSheet(blockNoteSession(execution.byBlockId[entry.id])!)
                  : undefined
              }
            />
            {/* **Pegado al bloque y debajo de él** (criterios 87 y 94): así
                no lo tapa ni lo empuja fuera de vista, y `VidaAgendaBlock`
                —entregado y revisado en FEAT-004— no se toca. */}
            {hintByBlockId[entry.id] ? (
              <VidaBlockHint
                hint={hintByBlockId[entry.id]!}
                onApply={applyBlockHint}
                onDismiss={(hint) => patterns.answerSuggestion(hint.suggestion)}
                isSaving={editMutation.isPending}
              />
            ) : null}
            </>
          ) : noDataByGapId[entry.id] ? (
            // Un rato ya pasado del que no se sabe nada (criterios 47 a 49).
            // Solo con el día cerrado y algo registrado: ver
            // `buildNoDataSlices`, donde está escrito por qué.
            <VidaAgendaNoData
              slice={noDataByGapId[entry.id]!}
              isDismissed={isNoDataDismissed(dismissedNoData, date, entry.id)}
              onAsk={canLogPast ? askAboutNoData : undefined}
              onLeaveIt={
                canLogPast ? (slice) => dismissNoData(date, slice.id) : undefined
              }
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
                  ? suggestionsForGap({
                      suggestions,
                      gap: entry,
                      planItems,
                      // **El dato sin pedir nada** (criterio 91). Vacío
                      // mientras no haya cuatro datos de esa actividad: la
                      // ficha es entonces exactamente la de antes.
                      usualDurations,
                    })
                  : NO_SUGGESTIONS
              }
              onPlaceSuggestion={canPlan ? placeSuggestion : undefined}
              onOpenSheet={
                canPlan
                  ? (gap) => openSheet({ kind: 'place', gapWindow: gapToWindow(gap) })
                  : undefined
              }
              // **Contar hacia atrás** (criterio 220). Solo en los días en
              // que se registra —hoy y los pasados (criterio 232)— y solo
              // con lo vivido cargado: sin saber qué hay dentro del hueco,
              // ofrecer registrar sería escribir a ciegas (criterios 243 y
              // 244). Mientras el día está en vuelo no se llega aquí: arriba
              // se pinta el esqueleto.
              onLogPast={canLogPast && executionKnown ? logInGap : undefined}
              // En un día de la tira **todo** ya pasó, y sus huecos no traen
              // la marca: allí no hay reloj (criterio 232).
              isPastDay={isPast}
              isPlacing={addMutation.isPending}
            />
          )}
        </Fragment>
      )
  }

  // **Lo que viene**, ya construida antes de la lista: la lista solo decide
  // **dónde** entra (criterio 370). Sin propuesta no se pinta ningún nodo, ni
  // vacío ni escondido por CSS (criterio 180).
  const upNextCard = upNext ? (
    <VidaUpNextCard
      key="up-next"
      upNext={upNext}
      // **Un solo toque**: `start(activityId)` y nada más. Sin hoja, sin
      // elegir, sin confirmar (criterio 374), y **sin la duración planeada**:
      // la hora la pone el reloj de la mutación (criterios 188 y 196).
      onStart={() => startWithNote(upNext.blockId, upNext.activityId)}
      // **El mismo borrador que la fila** (`upNext.blockId`): escribir la nota
      // en el bloque y pulsar aquí usa lo que se escribió. La tarjeta sigue
      // sin ver el `activityId`: recibe un texto y dos funciones.
      noteDraft={startNoteDrafts[upNext.blockId] ?? null}
      onEditNote={() => editStartNote(upNext.blockId, upNext.activityId, upNext.title)}
      // **Lo que sueles hacer ahí** (criterio 555): la nota del ítem de
      // plantilla, en una línea aparte de la hora y la duración planeada. Es
      // dato que ya está en memoria —`vidaSuggestionsForDate` selecciona
      // `notes`—, así que no cuesta ninguna consulta. **No viaja al arranque**:
      // el botón sigue mandando `start(activityId)` y nada más (criterio 557).
      templateNote={templateNoteForActivity(suggestions, upNext.activityId)}
      // La **misma** hoja de siempre, no una segunda (criterio 187). Y «Ver
      // las otras N» abre esa misma hoja, que ya pone la plantilla del día
      // arriba del todo (D1, opción (c)): cero UI nueva.
      onStartSomethingElse={() => openLogSheet({ mode: 'start' })}
      onSeeOthers={() => openLogSheet({ mode: 'start' })}
      // La misma variable que ya frena el «▶ Empezar» del bloque: dos toques
      // no crean dos sesiones (criterio 188).
      isSessionBusy={sessionActions.isBusy}
    />
  ) : null

  // La marca de «Ahora» la coloca `buildDayAgenda`, dentro del tramo que
  // contiene al reloj: aquí solo se pinta. Antes se decidía en esta página
  // —«la primera entrada que empieza después de ahora»— y por eso desaparecía
  // media jornada; es el defecto por el que volvió la tajada.
  const agendaList = (
    // En un día que no es hoy la agenda va en **trazo más suave** (criterio
    // 33): es un plan, no lo que está pasando. Se apagan los bordes, no el
    // texto: el contraste de lo que se lee no se toca (criterio 55).
    <ol className={styles.agenda} data-tone={isToday ? undefined : 'plan'}>
      {execution.entries.flatMap((entry) =>
        // **La tarjeta cuelga de la fila del ancla, como hija directa del
        //  `<ol>` y con una `key` constante.** Es lo que hace que React la
        //  **mueva** cuando cambia de sitio en vez de desmontarla y remontarla:
        //  metida dentro del `<Fragment key={entry.id}>` de la fila, cambiar de
        //  ancla cambiaría de padre, el foco se iría a `body` y los criterios
        //  205 y 379 se caerían.
        entry.id === upNext?.anchorId ? [renderEntry(entry), upNextCard] : [renderEntry(entry)],
      )}
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
            executed={execution.budget}
            guidance={guidance}
            closingLine={closingLine}
            // La vía a la revisión de **este** día, solo cuando el día se
            // cierra (FEAT-006, criterio 25).
            reviewTo={closingLine ? vidaPaths.revisionForDate(date) : null}
            nowLabel={nowLabel}
          />

          {/* **El arco de la meta** (FEAT-016, criterio 489): debajo del
              presupuesto del día y encima de la agenda.

              Tres guardas, con lo que ya había en el ámbito:

              - Si falló **alguna** consulta del día o la del catálogo, no se
                pinta: media suma es peor que ninguna, y quien lo dice es el
                aviso «Falta una parte de tu día» que ya está arriba — que **no
                nombra** el arco, porque el contrato de `failed` es el de las
                cuatro consultas del día (criterio 499).
              - En un día **futuro** no hay nada vivido que sumar (criterio 496).
              - Mientras el **catálogo** viaja, un esqueleto del tamaño del
                arco: ni el arco ni la pregunta se pueden afirmar todavía, y el
                hueco queda reservado para que la agenda no dé el salto.
              - Sin ninguna categoría apuntando a una meta va **la pregunta**
                (tajada 3, criterio 500): el mismo sitio, el segundo camino al
                mismo puntero. En cuanto una categoría apunta a la meta, `arcs`
                deja de estar vacío y la pregunta no vuelve a aparecer en ningún
                día (criterio 502) — lo dice el dato, no una bandera. */}
          {failed.length === 0 && !categoriesFailed && (isToday || isPast) ? (
            categoriesLoading ? (
              <div className={styles.goalLoading} aria-busy="true" aria-live="polite">
                <Skeleton width="100%" height={176} radius="1.25rem" />
              </div>
            ) : goalArcs.arcs.length === 0 ? (
              // Un día que ninguna meta cuenta —un sábado— no enseña la
              // pregunta tampoco: el mismo `goalArcs` decide las dos cosas, así
              // que no pueden divergir (criterio 580). Si la pregunta saliera,
              // tocar una categoría no haría aparecer ningún arco.
              goalArcs.promptAllowed ? (
                <VidaGoalPrompt
                  categories={categories}
                  onPick={(categoryId) =>
                    setGoalMutation.mutate({ categoryId, attached: true })
                  }
                  isBusy={setGoalMutation.isPending}
                />
              ) : null
            ) : (
              <VidaGoalArcRow
                arcs={goalArcs.arcs}
                noDataLabel={goalArcs.noDataLabel}
                isPastDay={isPast}
              />
            )
          ) : null}

          {/* Un día pasado se dice **sin reproche** (D3, criterio 56): se
              cuenta lo que es, no lo que faltó. Lo que no se registró se
              arregla en F3, no aquí. */}
          {isPast ? (
            <p className={styles.readOnly}>
              {execution.hasExecution
                ? 'Este día ya pasó: aquí queda lo que planeaste y lo que hiciste. El plan de los días de atrás no se cambia.'
                : 'Este día ya pasó: aquí queda como lo planeaste, para mirarlo. Los días de atrás no se cambian.'}
            </p>
          ) : null}

          {/* Lo que hubo que ajustar al armar: se lee **en la agenda**, encima
              de lo que quedó puesto. Nada se pierde en silencio (43 y 44). */}
          {buildNotes ? (
            <Alert variant="info" title={buildNotes.headline}>
              {buildNotes.moved || buildNotes.defaultDuration || buildNotes.dropped ? (
                <p className={styles.errorText}>
                  {[buildNotes.moved, buildNotes.defaultDuration, buildNotes.dropped]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              ) : null}
              {buildNotes.withoutTime ? (
                <p className={styles.errorText}>
                  {buildNotes.withoutTime}{' '}
                  <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
                    Ver tus actividades
                  </Button>
                </p>
              ) : null}
            </Alert>
          ) : null}

          {!hasPlan ? (
            <p className={styles.noPlan}>
              {isPast
                ? `Ese ${dayLabel} no llegó a tener plan.`
                : isToday
                  ? 'Aún no hay plan para hoy.'
                  : `Todavía no hay plan para el ${formatDayHeading(date).toLowerCase()}.`}{' '}
              {execution.hasExecution ? 'Lo que hiciste está abajo, en su hora. ' : ''}
              {templateCount > 0
                ? `Tu plantilla trae ${templateCount} ${templateCount === 1 ? 'cosa' : 'cosas'} los ${pluralDayLabel(dayLabel)}.`
                : 'Tu plantilla todavía no trae nada para este día.'}
            </p>
          ) : null}

          {/* **Armar desde la plantilla** (criterio 21, su mitad de botón): solo
              en un día vacío que se pueda planear y con algo que poner. Armar
              es `activityDayPlanSet`, que reemplaza el día entero: sobre un día
              ya armado borraría lo hecho, así que ahí no se ofrece. */}
          {canPlan && !hasPlan && templateCount > 0 ? (
            <div className={styles.buildRow}>
              <Button
                variant="primary"
                size="sm"
                disabled={buildDay.isPending}
                onClick={() =>
                  buildDay.build({
                    date,
                    templateItems: buildableTemplate,
                    dayStart: dayHours.startTime,
                    dayEnd: dayHours.endTime,
                  })
                }
              >
                {buildDay.isPending
                  ? 'Armando…'
                  : `Armar desde la plantilla (${templateCount} ${templateCount === 1 ? 'cosa' : 'cosas'})`}
              </Button>
              <span className={styles.buildNote}>
                Cada cosa a su hora y con su duración, tal como la tienes en tu plantilla.
              </span>
            </div>
          ) : null}

          {/* La fila de acciones del día. Los atajos de **plan** solo donde se
              puede planear (FEAT-003, criterios 36 y 37); los de **registro**
              donde el día ya ocurrió: «Empezar algo» solo hoy y «Registrar
              tiempo pasado» también en los días de atrás (criterios 32 y 56).
              En un día futuro no se pinta ninguno de los dos de registro. */}
          <VidaDayActions
            date={date}
            planItems={planItems}
            canPlan={canPlan}
            onStartSomething={canStart ? () => openLogSheet({ mode: 'start' }) : undefined}
            onLogPast={canLogPast ? () => openLogSheet({ mode: 'log' }) : undefined}
          />

          {agendaList}
        </div>

        {/* El lateral **no se pinta en un día pasado** (criterio 38): desde que
            lleva «Armar mañana desde la plantilla» dejó de ser solo lectura, y
            un día pasado se mira y no se toca. */}
        {canPlan ? (
          <VidaTemplateAside
            dayLabel={dayLabel}
            suggestions={suggestions}
            planItems={planItems}
            date={date}
            agenda={agenda}
          />
        ) : null}
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

      {/* Registrar lo que se sale (tajada 3). Es **otra** hoja: no comparte
          estado con la del plan, aunque las dos usen el mismo «qué». */}
      {logSheet ? (
        <VidaLogSessionSheet
          key={logSheetSession}
          open={logSheetOpen}
          onClose={() => setLogSheetOpen(false)}
          mode={logSheet.mode}
          date={date}
          dayLabel={dayLabel}
          suggestions={suggestions}
          // «Empezar algo» parte de **ahora** (criterio 330); «Registrar tiempo
          // pasado», de media hora atrás. La misma hoja, dos puntos de partida.
          defaultStartTime={
            logSheet.mode === 'start'
              ? defaultStartNowTime(dayHours.startTime, nowMinutes)
              : defaultLogStartTime(dayHours.startTime, nowMinutes)
          }
          session={logSheet.mode === 'edit' ? logSheet.session : null}
          initial={logSheet.mode === 'edit' ? null : (logSheet.initial ?? null)}
          // El hueco al que va anclado, cuando se abrió desde uno (FEAT-011).
          gapWindow={logSheet.mode === 'edit' ? null : (logSheet.gapWindow ?? null)}
          // Lo que sueles tardar en cada actividad: la duración que viene
          // puesta al elegir el «qué» dentro de un hueco (criterio 238).
          usualDurations={usualDurationsByActivity}
          onStart={(activityId, startTime) => sessionActions.start(activityId, startTime)}
        />
      ) : null}
    </div>
  )
}

/**
 * De qué hora parte «Empezar algo»: **ahora**, y como `nowMinutes` cambia con
 * el minuto, el campo sigue al reloj mientras nadie lo toque. Sin reloj (un día
 * que no es hoy, donde este modo no se abre) queda el principio del día.
 */
function defaultStartNowTime(dayStart: string, nowMinutes: number | null): string {
  return nowMinutes === null ? dayStart : minutesToTime(nowMinutes)
}

/** Cuántos minutos atrás arranca «Registrar tiempo pasado» por defecto. */
const LOG_DEFAULT_LOOKBACK_MINUTES = 30

/**
 * De qué hora parte «Registrar tiempo pasado»: **media hora antes de ahora** en
 * el día de hoy —que es el caso de «se me fue la mañana y no lo apunté»— y el
 * principio del día en uno pasado, donde no hay reloj al que mirar. Nunca antes
 * del inicio del día, y nunca una hora del futuro.
 */
function defaultLogStartTime(dayStart: string, nowMinutes: number | null): string {
  if (nowMinutes === null) return dayStart
  const startOfDay = parseTimeToMinutes(dayStart)
  return minutesToTime(Math.max(startOfDay, nowMinutes - LOG_DEFAULT_LOOKBACK_MINUTES))
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

/**
 * Por dónde se abrió la hoja de registrar. Los tres modos van en una sola
 * variable para que no pueda existir «corrigiendo una sesión mientras se
 * empieza otra».
 */
type LogSheetState =
  | {
      mode: Extract<VidaLogSessionMode, 'start' | 'log'>
      /** Hora y duración **ya puestas**: el rato de un bloque o de un tramo sin dato. */
      initial?: { startTime?: string; durationMinutes?: number }
      /**
       * El hueco desde el que se abrió, si se abrió desde uno (FEAT-011): la
       * ventana **real** cuando viene de `execution.realWindowByGapId`.
       */
      gapWindow?: GapWindow | RealGapWindow
    }
  | { mode: Extract<VidaLogSessionMode, 'edit'>; session: ActivityFollowUp }
