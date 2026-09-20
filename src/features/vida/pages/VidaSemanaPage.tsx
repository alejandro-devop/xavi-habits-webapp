import { Link, useSearchParams } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useBuildWeekFromTemplate } from '@/features/vida/hooks/useBuildWeekFromTemplate'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useVidaItemsQuery } from '@/features/vida/hooks/useVidaItems'
import { useVidaWeekPlans } from '@/features/vida/hooks/useVidaWeekPlans'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import {
  buildDayFromTemplate,
  buildDaySummaryLine,
  plannedMinutesOf,
  templateItemsForDate,
} from '@/features/vida/utils/vida-build-day.utils'
import {
  VIDA_DAY_LABELS,
  formatDateToYmd,
  getCurrentLocalDate,
  getMondayOfWeek,
  getVidaDayOfWeek,
  parseYmdToLocalDate,
  pluralDayLabel,
} from '@/features/vida/utils/vida-date.utils'
import { formatDurationFromMinutes, parseTimeToMinutes } from '@/features/vida/utils/vida-time.utils'
import {
  clampToPlanningWindow,
  isEditableDate,
} from '@/features/vida/utils/vida-window.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaSemanaPage.module.scss'

const DAYS_IN_WEEK = 7

function shiftYmd(date: string, days: number): string {
  const local = parseYmdToLocalDate(date)
  local.setDate(local.getDate() + days)
  return formatDateToYmd(local)
}

/** El lunes de la semana que contiene esa fecha, en `YYYY-MM-DD`. */
function mondayOf(date: string): string {
  return formatDateToYmd(getMondayOfWeek(parseYmdToLocalDate(date)))
}

/** «15 – 21 sept», como el render. */
function formatWeekRange(monday: string): string {
  const from = parseYmdToLocalDate(monday)
  const to = parseYmdToLocalDate(shiftYmd(monday, DAYS_IN_WEEK - 1))
  const month = to.toLocaleDateString('es', { month: 'short' }).replace('.', '')
  const fromMonth = from.toLocaleDateString('es', { month: 'short' }).replace('.', '')
  return fromMonth === month
    ? `${from.getDate()} – ${to.getDate()} ${month}`
    : `${from.getDate()} ${fromMonth} – ${to.getDate()} ${month}`
}

/**
 * La semana de un vistazo: **una línea por día** (criterio 39) y, abajo, armar
 * los que están vacíos de una vez (criterio 45).
 *
 * Es la pantalla de «planear con antelación», y por eso mira los días por lo
 * que tienen **planeado**, nunca por lo que se cumplió: el «seguiste N de M» y
 * las barritas de seguido · de más · fuera del plan del render son F3/F5 y
 * **no aparecen aquí** (criterio 40). Un día pasado se describe igual que uno
 * futuro —cuántos bloques y cuánto suman— y no se puede armar.
 *
 * **Una sola consulta de plantilla para los siete días**: `vidaItems` con sus
 * `days`, en vez de siete `vidaSuggestionsForDate`. Los planes sí son siete,
 * pero son `vidaKeys.dayPlan.byDate` —la misma clave y la misma `queryFn` que
 * la agenda de Hoy—, así que abrir un día desde aquí es un acierto de caché y
 * armar uno refresca su línea sin invalidación nueva.
 */
export function VidaSemanaPage() {
  const [searchParams] = useSearchParams()
  const today = getCurrentLocalDate()
  const { confirm } = useConfirmDialog()

  // La semana que se mira sale de la URL, con el mismo `?d=` que Hoy: recargar
  // y el «atrás» del navegador salen gratis. Fuera de la ventana de D5 se
  // recorta a su borde en vez de dejar la pantalla en blanco (criterio 35).
  const monday = mondayOf(clampToPlanningWindow(searchParams.get('d'), today))
  const thisMonday = mondayOf(today)
  const nextMonday = shiftYmd(thisMonday, DAYS_IN_WEEK)
  const isThisWeek = monday === thisMonday

  // Sin `useMemo` a propósito: son siete cadenas y el compilador de React no
  // puede preservar la memoización de `Array.from` con una función de fuera
  // (lo dice el linter). `useQueries` se apoya en las **claves**, que son
  // estables, no en la identidad del array.
  const dates = Array.from({ length: DAYS_IN_WEEK }, (_, index) => shiftYmd(monday, index))

  const weekPlans = useVidaWeekPlans(dates)
  const itemsQuery = useVidaItemsQuery()
  const dayHours = useVidaDayHours()
  const buildWeek = useBuildWeekFromTemplate()

  const templateItems = itemsQuery.data ?? []
  const dayMinutes = parseTimeToMinutes(dayHours.endTime) - parseTimeToMinutes(dayHours.startTime)

  const isDisabled =
    itemsQuery.isPending && itemsQuery.fetchStatus === 'idle' && dayHours.isDisabled
  const isPending =
    (itemsQuery.isPending && itemsQuery.fetchStatus !== 'idle') ||
    dayHours.isPending ||
    weekPlans.isPending

  const rows = dates.map((date) => {
    const plan = weekPlans.byDate[date]
    const planItems = plan?.items ?? []
    const template = templateItemsForDate(templateItems, date)
    // **Un día cuya consulta falló no es un día vacío.** Sin esta distinción,
    // un fallo de red daba `items: []` → «Sin plan todavía» → «Armar», y armar
    // es `activityDayPlanSet`: reemplaza el día entero. Un error de carga se
    // convertía en borrar un plan. Mientras no se sepa, no se ofrece armar.
    const isError = plan?.isError ?? false
    const isPending = plan?.isPending ?? false
    return {
      date,
      dayLabel: VIDA_DAY_LABELS[getVidaDayOfWeek(date)],
      dayOfMonth: parseYmdToLocalDate(date).getDate(),
      isToday: date === today,
      isPast: date < today,
      isError,
      isPending,
      hasPlan: planItems.length > 0,
      blockCount: planItems.length,
      plannedMinutes: plannedMinutesOf(planItems),
      templateCount: template.length,
      template,
      canBuild:
        !isError &&
        !isPending &&
        isEditableDate(date, today) &&
        planItems.length === 0 &&
        template.length > 0,
    }
  })

  const buildable = rows.filter((row) => row.canBuild)
  const alreadyPlanned = rows.filter((row) => row.hasPlan)

  async function buildWholeWeek() {
    if (buildable.length === 0) return
    const kept =
      alreadyPlanned.length > 0
        ? ` ${alreadyPlanned.length} ya ${alreadyPlanned.length === 1 ? 'tiene plan y no se toca' : 'tienen plan y no se tocan'}.`
        : ''
    const ok = await confirm({
      title: '¿Armar la semana desde tu plantilla?',
      description: `Se ${buildable.length === 1 ? 'armará' : 'armarán'} ${buildable.length} ${buildable.length === 1 ? 'día' : 'días'}, copiando la hora y la duración de cada cosa de tu plantilla.${kept} Después puedes ajustar día a día.`,
      confirmLabel: `Armar ${buildable.length} ${buildable.length === 1 ? 'día' : 'días'}`,
      cancelLabel: 'Volver',
    })
    if (!ok) return
    buildWeek.mutate({
      days: buildable.map((row) => ({ date: row.date, templateItems: row.template })),
      dayStart: dayHours.startTime,
      dayEnd: dayHours.endTime,
    })
  }

  function buildOneDay(date: string, template: typeof templateItems) {
    buildWeek.mutate({
      days: [{ date, templateItems: template }],
      dayStart: dayHours.startTime,
      dayEnd: dayHours.endTime,
    })
  }

  function header() {
    return (
      <PageHeader
        title="Tu semana"
        subtitle="Una línea por día: lo que ya está planeado y lo que te queda por armar."
      />
    )
  }

  /** Las dos semanas de la ventana de D5, y nada más (criterio 35). */
  function weekNav() {
    return (
      <nav className={styles.weekNav} aria-label="Elige la semana">
        <p className={styles.weekTitle}>
          {isThisWeek ? 'Esta semana' : 'La semana que viene'} · {formatWeekRange(monday)}
        </p>
        <span className={styles.weekLinks}>
          {isThisWeek ? (
            <Button variant="ghost" size="sm" to={vidaPaths.semanaForDate(nextMonday)}>
              Ver la semana que viene
            </Button>
          ) : (
            <Button variant="ghost" size="sm" to={vidaPaths.semanaForDate(thisMonday)}>
              Volver a esta semana
            </Button>
          )}
        </span>
        <p className={styles.weekEdge}>
          Se planea esta semana y la que viene; más allá, todavía no.
        </p>
      </nav>
    )
  }

  if (isDisabled) {
    return (
      <div className={styles.root}>
        {header()}
        <Card className={styles.panel} padding="lg">
          <EmptyState
            title="Entra para ver tu semana"
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

  if (isPending) {
    return (
      <div className={styles.root}>
        {header()}
        {weekNav()}
        <div aria-busy="true" aria-live="polite" className={styles.skeleton}>
          {dates.map((date) => (
            <Skeleton key={date} width="100%" height={62} radius="1rem" />
          ))}
          <span className={styles.srOnly}>Cargando tu semana…</span>
        </div>
      </div>
    )
  }

  const result = buildWeek.data ?? null

  return (
    <div className={styles.root}>
      {header()}
      {weekNav()}

      {itemsQuery.isError ? (
        <Alert variant="warning" title="Falta tu plantilla">
          <p className={styles.errorText}>
            No pudimos cargar lo que trae tu plantilla, así que aquí solo se ve lo que ya tienes
            planeado.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void itemsQuery.refetch()}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {/* Lo que quedó después de armar: **exactamente** lo que pasó, día por
          día. Si falló uno, los demás siguen armados y se nombra el que no
          (criterio 46). Nunca se anuncia «semana armada» a medias. */}
      {result && (result.done.length > 0 || result.failed.length > 0 || result.empty.length > 0) ? (
        <Alert
          variant={result.failed.length > 0 ? 'warning' : 'info'}
          title={
            result.failed.length > 0
              ? `Armamos ${result.done.length} de ${result.done.length + result.failed.length} días`
              : `Armamos ${result.done.length} ${result.done.length === 1 ? 'día' : 'días'}`
          }
        >
          <ul className={styles.resultList}>
            {result.done.map((entry) => (
              <li key={entry.date}>
                <b>{VIDA_DAY_LABELS[getVidaDayOfWeek(entry.date)]}:</b>{' '}
                {buildDaySummaryLine(entry.summary)}
              </li>
            ))}
            {result.failed.map((entry) => (
              <li key={entry.date}>
                <b>{VIDA_DAY_LABELS[getVidaDayOfWeek(entry.date)]}:</b> no se pudo armar (
                {entry.reason}). Sigue sin plan.
              </li>
            ))}
            {/* Los que se prometieron en la confirmación y no dejaron ningún
                bloque **también se nombran**: prometer 3 y contar 2 sin decir
                qué pasó con el tercero es dejar un hueco en el relato. */}
            {result.empty.map((date) => (
              <li key={date}>
                <b>{VIDA_DAY_LABELS[getVidaDayOfWeek(date)]}:</b> tu plantilla no dejó nada que
                poner ese día, así que sigue libre.
              </li>
            ))}
          </ul>
          {result.done.some((entry) => entry.summary.withoutTimeCount > 0) ? (
            <p className={styles.resultNote}>
              Lo que no tenía hora quedó al final del día.{' '}
              <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
                Ponles una hora en tu plantilla
              </Button>
            </p>
          ) : null}
        </Alert>
      ) : null}

      <ol className={styles.week}>
        {rows.map((row) => {
          const barPercent =
            dayMinutes > 0 ? Math.min(100, (row.plannedMinutes / dayMinutes) * 100) : 0
          const preview = row.canBuild
            ? buildDayFromTemplate(row.template, {
                dayStart: dayHours.startTime,
                dayEnd: dayHours.endTime,
              })
            : null

          return (
            <li
              key={row.date}
              className={styles.day}
              data-today={row.isToday ? 'true' : undefined}
              data-empty={row.hasPlan || row.isError ? undefined : 'true'}
              data-error={row.isError ? 'true' : undefined}
            >
              <span className={styles.stamp}>
                <span className={styles.weekday}>{row.dayLabel.slice(0, 3)}</span>
                <span className={styles.number}>{row.dayOfMonth}</span>
              </span>

              <span className={styles.mid}>
                {row.isError ? (
                  <>
                    <span className={styles.title}>No pudimos cargar este día</span>
                    <span className={styles.sub}>
                      Hasta saber qué tiene, no se arma: armar reemplaza el día entero.
                    </span>
                  </>
                ) : row.hasPlan ? (
                  <>
                    <span className={styles.title}>
                      Planeado · {row.blockCount} {row.blockCount === 1 ? 'bloque' : 'bloques'} ·{' '}
                      {formatDurationFromMinutes(row.plannedMinutes)}
                    </span>
                    <span className={styles.bar} aria-hidden>
                      <i style={{ width: `${barPercent}%` }} />
                    </span>
                  </>
                ) : (
                  <>
                    <span className={styles.title}>Sin plan todavía</span>
                    <span className={styles.sub}>
                      {row.templateCount > 0
                        ? `Tu plantilla trae ${row.templateCount} ${row.templateCount === 1 ? 'cosa' : 'cosas'} los ${pluralDayLabel(row.dayLabel)}${
                            preview && preview.items.length !== row.templateCount
                              ? ` · cabrían ${preview.items.length}`
                              : ''
                          }`
                        : `Tu plantilla todavía no trae nada para los ${pluralDayLabel(row.dayLabel)}`}
                    </span>
                  </>
                )}
              </span>

              <span className={styles.actions}>
                {row.isError ? (
                  <Button variant="secondary" size="sm" onClick={() => weekPlans.refetch()}>
                    Reintentar
                  </Button>
                ) : null}
                {row.canBuild ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={buildWeek.isPending}
                    onClick={() => buildOneDay(row.date, row.template)}
                  >
                    Armar
                  </Button>
                ) : null}
                <Link className={styles.see} to={vidaPaths.hoyForDate(row.date)}>
                  Ver
                </Link>
              </span>
            </li>
          )
        })}
      </ol>

      <div className={styles.footer}>
        <Button
          variant="primary"
          // Mientras haya días cargando **no se arma la semana**: el lote se
          // decide sobre lo que se sabe, y a medio saber podría meter un día
          // que en realidad ya tiene plan.
          disabled={buildable.length === 0 || buildWeek.isPending || weekPlans.isPending}
          onClick={buildWholeWeek}
        >
          {buildWeek.isPending ? 'Armando…' : 'Armar toda la semana desde la plantilla'}
        </Button>
        <p className={styles.footerNote}>
          {weekPlans.hasError
            ? `Hay ${rows.filter((row) => row.isError).length} día(s) que no pudimos cargar: quedan fuera hasta que se sepa qué tienen. `
            : ''}
          {buildable.length > 0
            ? `${buildable.length} ${buildable.length === 1 ? 'día está libre' : 'días están libres'} y se ${buildable.length === 1 ? 'armaría' : 'armarían'} desde tu plantilla.${
                alreadyPlanned.length > 0
                  ? ` Los ${alreadyPlanned.length} que ya tienen plan no se tocan.`
                  : ''
              }`
            : alreadyPlanned.length === rows.length
              ? 'Toda la semana ya tiene plan: no hay nada que armar.'
              : 'No hay ningún día de esta semana que se pueda armar desde tu plantilla.'}
        </p>
        <Link className={styles.back} to={vidaPaths.hoy}>
          Volver a tu día
        </Link>
      </div>
    </div>
  )
}
