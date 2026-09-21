import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaDayStrip } from '@/features/vida/components/VidaDayStrip'
import { VidaReviewFigures } from '@/features/vida/components/VidaReviewFigures'
import { VidaReviewLanes } from '@/features/vida/components/VidaReviewLanes'
import { VidaReviewOffPlanRow, VidaReviewRow } from '@/features/vida/components/VidaReviewRow'
import { VidaReviewStory } from '@/features/vida/components/VidaReviewStory'
import { useVidaDayData } from '@/features/vida/hooks/useVidaDayData'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useVidaNowMinute } from '@/features/vida/hooks/useVidaNowMinute'
import { useVidaWeekPlans } from '@/features/vida/hooks/useVidaWeekPlans'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import { getBlockNote, useVidaDeviceNotesStore } from '@/features/vida/store/vida-device-notes.store'
import { buildDayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import { getCurrentLocalDate } from '@/features/vida/utils/vida-date.utils'
import { buildDayExecution } from '@/features/vida/utils/vida-execution.utils'
import { buildDayReview, resolveReviewDate } from '@/features/vida/utils/vida-review.utils'
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
import styles from './VidaRevisionPage.module.scss'

/** A partir de aquí caben los dos carriles del marco D. */
const DESKTOP_QUERY = '(min-width: 60rem)'

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
 * **En esta tajada la revisión no escribe nada.** Las dos salidas del pie son
 * **enlaces a Hoy** de ese día, que ya sabe hacer las dos cosas (criterio 18);
 * registrar desde aquí es la tajada 3. Por eso tampoco se monta ninguna
 * mutación: en toda la pantalla no hay un control que toque el plan ni el
 * registro.
 *
 * Los días raros tienen **su propio estado y su salida a Hoy**: futuro
 * (criterio 4), hoy aún abierto (5), con plan y sin un solo registro (19), sin
 * plan y con sesiones (20) y sin plan y sin nada (21).
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

  const {
    planItems,
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
  const weekPlans = useVidaWeekPlans(useMemo(() => stripDays.map((day) => day.date), [stripDays]))

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

  const review = useMemo(
    () => buildDayReview({ execution, agenda, date, today, nowMinutes, couldNotById }),
    [execution, agenda, date, today, nowMinutes, couldNotById],
  )
  const showsReasons = review.rows.some(
    (row) => row.real.kind === 'missing' && row.real.reason !== null,
  )

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
      />
    )
  }

  /** Las dos salidas del pie: **enlaces a Hoy** (criterio 18). */
  function exits() {
    return (
      <div className={styles.exits}>
        <Button variant="secondary" size="sm" to={vidaPaths.hoyForDate(date)}>
          Ver el día en la agenda
        </Button>
        <Button variant="ghost" size="sm" to={vidaPaths.hoyForDate(date)}>
          Registrar tiempo pasado
        </Button>
      </div>
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

  if (isPending) {
    return (
      <div className={styles.root}>
        {header()}
        {strip()}
        <div aria-busy="true" aria-live="polite" className={styles.skeleton}>
          <Skeleton width="100%" height={96} radius="1.25rem" />
          <Skeleton width="100%" height={88} radius="1.25rem" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} width="100%" height={54} radius="1rem" />
          ))}
          <span className={styles.srOnly}>Cargando cómo fue tu día…</span>
        </div>
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
        <Alert variant="danger" title="No pudimos cargar tu plan de ese día">
          <p className={styles.errorText}>
            Sin él no se puede comparar nada. Revisa tu conexión e inténtalo otra vez; lo tuyo
            sigue guardado.
          </p>
          <Button variant="secondary" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </Alert>
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
            </Card>
          ) : null}

          {review.figures && review.hasExecution ? (
            <VidaReviewFigures figures={review.figures} />
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
                  <VidaReviewRow key={`missing-${row.id}`} row={row} />
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
              <ol className={styles.rows}>
                {review.ghostRows.map((row) => (
                  <VidaReviewRow key={row.id} row={row} isGhost />
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
                    <VidaReviewRow key={row.id} row={row} />
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

          {/* Lo del aparato se dice **una vez**, donde se lee (criterio 15). */}
          {showsReasons ? (
            <p className={styles.deviceNote}>
              Las razones de «no se pudo» se guardan en este aparato: en otro no estarán.
            </p>
          ) : null}

          {exits()}
        </div>
      </div>
    </div>
  )
}
