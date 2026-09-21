import { useState } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaTemplateDaySummary } from '@/features/vida/components/VidaTemplateDaySummary'
import { VidaTemplateDayTabs } from '@/features/vida/components/VidaTemplateDayTabs'
import { VidaTemplateItemCard } from '@/features/vida/components/VidaTemplateItemCard'
import { VidaTemplateNoTimeDrawer } from '@/features/vida/components/VidaTemplateNoTimeDrawer'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useVidaItemsQuery } from '@/features/vida/hooks/useVidaItems'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import { CATALOG_LIMIT, excludeArchivedActivities } from '@/features/vida/utils/vida-catalog.utils'
import {
  VIDA_DAY_LABELS,
  getCurrentLocalDate,
  getVidaDayOfWeek,
} from '@/features/vida/utils/vida-date.utils'
import {
  buildTemplateDay,
  buildTemplateGuidance,
  countTemplateByDay,
} from '@/features/vida/utils/vida-template.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaPlantillaPage.module.scss'

/**
 * **Tu plantilla**: la semana tipo, un día a la vez (FEAT-005, tajada 1).
 *
 * Es la primera pantalla que pinta `VidaItem` **en forma de agenda**: pestañas
 * de día con su cuenta y su punto, el resumen con la barra del día, las cosas
 * del día **ordenadas por hora**, y al final el cajón de las que no tienen
 * hora. Hasta aquí **todo es lectura**: editar es la tajada 2, añadir la 3 y la
 * cuadrícula de escritorio la 4. Por eso no hay ni «···», ni «Activar», ni
 * «Ponerle hora», ni «+»: un botón muerto es peor que ninguno.
 *
 * Molde: `VidaSemanaPage` (FEAT-003, tajada 5), que es la otra pantalla que
 * vive de **una sola consulta de plantilla para los siete días**
 * (`useVidaItemsQuery` + `useVidaDayHours`) y que ya distingue los tres estados
 * que el criterio 12 pide **sin confundirlos**: sin sesión ≠ cargando ≠ falló.
 * Aquí se pide con `includeInactive: true`, porque un ítem desactivado **se
 * pinta** (criterio 8).
 *
 * El día elegido vive en el **estado local, no en la URL** (decisión A6): un
 * día de plantilla es un día de la semana, no una fecha, y meterlo en `?d=`
 * crearía un segundo vocabulario al lado del `?d=YYYY-MM-DD` de Hoy y de
 * Semana. Se arranca en el día de hoy (criterio 2).
 */
export function VidaPlantillaPage() {
  const today = getVidaDayOfWeek(getCurrentLocalDate())
  const [day, setDay] = useState(today)

  const itemsQuery = useVidaItemsQuery(true)
  const dayHours = useVidaDayHours()
  // **Solo para la cuenta del vacío** (criterio 10): «11 en tu catálogo». No se
  // usa para pintar ni un ítem de la plantilla, así que si falla no rompe nada.
  const activitiesQuery = useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })

  const items = itemsQuery.data ?? []

  const isDisabled =
    itemsQuery.isPending && itemsQuery.fetchStatus === 'idle' && dayHours.isDisabled
  const isPending =
    (itemsQuery.isPending && itemsQuery.fetchStatus !== 'idle') || dayHours.isPending

  function header() {
    return (
      <PageHeader
        title="Tu plantilla"
        subtitle="Cómo quieres que sea tu semana. Hoy la sigue — o no."
      />
    )
  }

  if (isDisabled) {
    return (
      <div className={styles.root}>
        {header()}
        <Card className={styles.panel} padding="lg">
          <EmptyState
            title="Entra para ver tu plantilla"
            description="Tu semana tipo viaja con tu cuenta. Inicia sesión y aparece."
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
        {/* Esqueletos **con la forma de lo que va a llegar** (criterio 12): la
            tira de pestañas, el resumen y cuatro tarjetas. Ni un salto ni una
            plantilla vacía fingida. */}
        <div aria-busy="true" aria-live="polite" className={styles.skeleton}>
          <Skeleton width="100%" height={52} radius="1rem" />
          <Skeleton width="100%" height={110} radius="1.25rem" />
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} width="100%" height={62} radius="1rem" />
          ))}
          <span className={styles.srOnly}>Cargando tu plantilla…</span>
        </div>
      </div>
    )
  }

  // **Un fallo no es una plantilla vacía** (criterio 12). Mientras no se sepa
  // qué hay, no se afirma que no hay nada: ni pestañas en cero, ni el texto del
  // primer minuto, que invitaría a empezar de cero algo que quizá ya existe.
  if (itemsQuery.isError) {
    return (
      <div className={styles.root}>
        {header()}
        <Alert variant="warning" title="No pudimos cargar tu plantilla">
          <p className={styles.errorText}>
            No sabemos qué tienes puesto, así que no enseñamos nada: lo tuyo sigue guardado.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void itemsQuery.refetch()}>
            Reintentar
          </Button>
        </Alert>
      </div>
    )
  }

  const counts = countTemplateByDay(items)
  const hasAnything = Object.values(counts).some((count) => count.hasAny)

  // La plantilla vacía del todo: el texto del marco D (criterio 10). **Los seis
  // puntos de partida son de la tajada 3** (criterio 36): aquí la salida es
  // traer lo que ya existe en el catálogo.
  if (!hasAnything) {
    const catalog = excludeArchivedActivities(activitiesQuery.data?.activities ?? [])
    const withDays = new Set(
      items.filter((item) => item.days.length > 0).map((item) => item.activityId),
    )
    const withDaysCount = catalog.filter((activity) => withDays.has(activity.id)).length

    return (
      <div className={styles.root}>
        {header()}
        <Card className={styles.panel} padding="lg">
          <div className={styles.first}>
            <p className={styles.firstLead}>
              Tu plantilla es tu semana contada por horas: <b>a esta hora hago esto, por este
              tiempo</b>.
            </p>
            <p className={styles.firstSmall}>
              No hace falta llenarla entera. <b>Empieza por tu mañana</b> — con eso ya se puede
              armar un día.
            </p>
            <Button variant="primary" to={vidaPaths.actividades}>
              Traer de tus actividades
            </Button>
            <p className={styles.firstCount}>
              {activitiesQuery.isError
                ? 'No pudimos contar tu catálogo ahora mismo.'
                : activitiesQuery.isPending
                  ? 'Contando lo que tienes en tu catálogo…'
                  : `${catalog.length} ${catalog.length === 1 ? 'actividad' : 'actividades'} en tu catálogo${
                      withDaysCount > 0
                        ? ` · ${withDaysCount} ya con días puestos`
                        : ''
                    }`}
            </p>
            <p className={styles.firstRelief}>
              Un día sin plantilla se vive igual: se registra sobre la marcha.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const templateDay = buildTemplateDay({
    items,
    day,
    dayStart: dayHours.startTime,
    dayEnd: dayHours.endTime,
  })
  const dayLabel = VIDA_DAY_LABELS[day]
  const guidance = buildTemplateGuidance(templateDay, dayLabel)
  const isDayEmpty = templateDay.timed.length === 0 && templateDay.untimed.length === 0

  return (
    <div className={styles.root}>
      {header()}

      <VidaTemplateDayTabs value={day} onChange={setDay} counts={counts} today={today}>
        <div className={styles.day}>
          <VidaTemplateDaySummary
            day={templateDay}
            guidance={guidance}
            dayStart={dayHours.startTime}
            dayEnd={dayHours.endTime}
            isDefaultSchedule={dayHours.isDefault}
          />

          {isDayEmpty ? (
            // Un día vacío **con otros llenos**: quien lo dice sin reproche es
            // la propia frase del resumen —«El viernes no tienes nada puesto»,
            // criterios 5 y 11—, así que aquí va **solo la salida** y no se
            // repite la misma frase dos veces seguidas. En la tajada 3 esa
            // salida pasa a ser el panel de «Añadir a mi Vida», sin salir de
            // esta pantalla.
            <Card className={styles.panel} padding="lg">
              <EmptyState
                title="Ponle algo cuando quieras"
                description="Un día sin plantilla se vive igual: se registra sobre la marcha."
                action={
                  <Button to={vidaPaths.actividades} variant="secondary">
                    Traer de tus actividades
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              {templateDay.timed.length > 0 ? (
                <ol className={styles.agenda} aria-label={`Tu ${dayLabel}, ordenado por hora`}>
                  {templateDay.timed.map((entry) => (
                    <VidaTemplateItemCard
                      key={entry.item.id}
                      item={entry.item}
                      startMinutes={entry.startMinutes}
                    />
                  ))}
                </ol>
              ) : null}

              <VidaTemplateNoTimeDrawer items={templateDay.untimed} />
            </>
          )}
        </div>
      </VidaTemplateDayTabs>
    </div>
  )
}
