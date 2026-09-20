import { Fragment, useEffect, useMemo, useRef } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaAgendaBlock } from '@/features/vida/components/VidaAgendaBlock'
import { VidaAgendaGap } from '@/features/vida/components/VidaAgendaGap'
import { VidaDayBudget } from '@/features/vida/components/VidaDayBudget'
import { VidaTemplateAside } from '@/features/vida/components/VidaTemplateAside'
import { useVidaDayData } from '@/features/vida/hooks/useVidaDayData'
import { useVidaNowMinute } from '@/features/vida/hooks/useVidaNowMinute'
import {
  buildDayAgenda,
  buildGuidanceLine,
  findNextBlockId,
  getDayBudget,
  suggestionsForGap,
} from '@/features/vida/utils/vida-agenda.utils'
import {
  VIDA_DAY_LABELS,
  getCurrentLocalDate,
  getVidaDayOfWeek,
  isToday as isTodayDate,
} from '@/features/vida/utils/vida-date.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaHoyPage.module.scss'

const SUBTITLE = 'Tu día repartido, y dónde te queda sitio.'

/**
 * Hoy: el presupuesto del día arriba y la agenda debajo.
 *
 * **Todo lo de esta pantalla es lectura** (tajada 2). Colocar algo en un hueco
 * es la tajada 3, ir a otro día la 4 y armar desde la plantilla la 5. Por eso
 * no hay aquí ni un botón que escriba: los que aún no funcionan **no se
 * pintan**, que es peor que no tenerlos.
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
  // La fecha es **local**: a las 23:30 sigue siendo hoy (criterio 49). El día
  // visto sale de la URL en la tajada 4; aquí es siempre hoy.
  const date = getCurrentLocalDate()
  const isToday = isTodayDate(date)
  const { minutes: nowMinutes, label: nowLabel } = useVidaNowMinute(isToday)
  const { planItems, suggestions, dayHours, isDisabled, isPending, isPlanError, failed, refetch } =
    useVidaDayData(date)

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

  // Criterio 20: la agenda abre a la altura de «Ahora», y lo anterior **no
  // desaparece** — sigue arriba, solo hay que subir. Una sola vez al montar:
  // si se repitiera con cada tic del minuto, la pantalla daría saltos mientras
  // se lee.
  const nowRef = useRef<HTMLLIElement | null>(null)
  const hasScrolledToNow = useRef(false)
  useEffect(() => {
    if (hasScrolledToNow.current) return
    const node = nowRef.current
    if (!node) return
    hasScrolledToNow.current = true
    node.scrollIntoView({ block: 'center' })
  }, [agenda])

  function header() {
    return <PageHeader title="Hoy" subtitle={SUBTITLE} />
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
    <ol className={styles.agenda}>
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
              />
            ) : (
              <VidaAgendaGap
                gap={entry}
                dayLabel={dayLabel}
                showTemplateHint={entry.id === firstRealGapId}
                suggestions={suggestionsForGap({ suggestions, gap: entry, planItems })}
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

          {!hasPlan ? (
            <p className={styles.noPlan}>
              Aún no hay plan para hoy.{' '}
              {templateCount > 0
                ? `Tu plantilla trae ${templateCount} ${templateCount === 1 ? 'cosa' : 'cosas'} los ${dayLabel}.`
                : 'Tu plantilla todavía no trae nada para este día.'}
            </p>
          ) : null}

          {agendaList}
        </div>

        <VidaTemplateAside dayLabel={dayLabel} suggestions={suggestions} planItems={planItems} />
      </div>
    </div>
  )
}
