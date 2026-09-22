import { useState } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaActivitySheet } from '@/features/vida/components/VidaActivitySheet'
import { VidaStartingPoints } from '@/features/vida/components/VidaStartingPoints'
import {
  VidaTemplateAddPanel,
  VidaTemplateAddSheet,
} from '@/features/vida/components/VidaTemplateAddPanel'
import { VidaTemplateDaySummary } from '@/features/vida/components/VidaTemplateDaySummary'
import { VidaTemplateDayTabs } from '@/features/vida/components/VidaTemplateDayTabs'
import { VidaTemplateItemCard } from '@/features/vida/components/VidaTemplateItemCard'
import { VidaTemplateNoTimeDrawer } from '@/features/vida/components/VidaTemplateNoTimeDrawer'
import { VidaTemplateCopyDay } from '@/features/vida/components/VidaTemplateCopyDay'
import { VidaTemplateRemoveDialog } from '@/features/vida/components/VidaTemplateRemoveDialog'
import { VidaWeekGrid } from '@/features/vida/components/VidaWeekGrid'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useVidaPatterns } from '@/features/vida/hooks/useVidaPatterns'
import {
  useDeleteVidaItemMutation,
  useUpdateVidaItemMutation,
  useVidaItemsQuery,
} from '@/features/vida/hooks/useVidaItems'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import { CATALOG_LIMIT, excludeArchivedActivities } from '@/features/vida/utils/vida-catalog.utils'
import {
  VIDA_DAY_LABELS,
  getCurrentLocalDate,
  getVidaDayOfWeek,
} from '@/features/vida/utils/vida-date.utils'
import {
  buildTemplateDay,
  buildTemplateGuidance,
  buildTemplateWeekGrid,
  buildWeekTotals,
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
 * **Tu plantilla**: la semana tipo, un día a la vez (FEAT-005, tajadas 1 y 2).
 *
 * Es la primera pantalla que pinta `VidaItem` **en forma de agenda**: pestañas
 * de día con su cuenta y su punto, el resumen con la barra del día, las cosas
 * del día **ordenadas por hora**, y al final el cajón de las que no tienen
 * hora.
 *
 * **Desde la tajada 4 está la semana entera** (criterios 42–54): en escritorio
 * la cuadrícula va **arriba**, siempre visible, y el día elegido sigue debajo;
 * en móvil se alcanza con **«Ver la semana entera»**, que es **un estado más de
 * esta página y no una ruta nueva** (criterio 48), con su vuelta al día. Y
 * **«Copiar este día a otros»**, el atajo que sustituye al arrastrar: le añade
 * días al ítem que ya existe y **no pisa lo que ya hay** (A7).
 *
 * **Desde la tajada 3 se añade sin salir de aquí** (criterios 29–39): el panel
 * «Añadir a mi Vida» en el aside de escritorio y, en móvil, el mismo panel
 * dentro de la hoja que abre el «+» flotante. Y con la plantilla **vacía del
 * todo**, el primer minuto: los seis puntos de partida **con hora**
 * (`VidaStartingPoints` con `schedule`).
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
 *
 * **Desde la tajada 2 la pantalla escribe** (criterios 16–28), y siempre por
 * las mismas tres puertas, ninguna nueva: la **hoja del catálogo**
 * (`VidaActivitySheet` con sus props aditivas, montada con una `key` por
 * apertura como en `VidaActividadesPage:44-60`), `useUpdateVidaItemMutation`
 * para «Activar» de un toque y para restarle un día, y
 * `useDeleteVidaItemMutation` para «Quitar de la plantilla». Que **Hoy lo vea
 * sin recargar** (criterio 27) no cuesta una línea: los tres hooks invalidan
 * `vidaKeys.items.all()`, que es **prefijo** de las sugerencias y de lo tomado
 * hoy (`invalidate-vida-queries.ts:77`).
 */
export function VidaPlantillaPage() {
  const today = getVidaDayOfWeek(getCurrentLocalDate())
  const [day, setDay] = useState(today)

  const itemsQuery = useVidaItemsQuery(true)
  const dayHours = useVidaDayHours()
  const updateItem = useUpdateVidaItemMutation()
  const deleteItem = useDeleteVidaItemMutation()

  // La hoja: **un ítem, por su id**, y una `key` por apertura para que parta
  // limpia sin un efecto que copie las props al estado. Se queda montada al
  // cerrar para que la animación de salida se vea (molde de
  // `VidaActividadesPage`).
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<VidaItem | null>(null)
  const [sheetSession, setSheetSession] = useState(0)
  const [removing, setRemoving] = useState<VidaItem | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  /** La hoja de «Añadir a mi Vida» en móvil; en escritorio el panel va suelto. */
  const [addOpen, setAddOpen] = useState(false)
  /**
   * **La semana entera en móvil** (criterio 48): un estado más de esta misma
   * página, **sin ruta nueva** —`vida-paths.ts` no se toca—. En escritorio la
   * cuadrícula está siempre, así que este interruptor solo manda debajo de
   * 60rem y quien lo hace cumplir es el CSS.
   */
  const [weekOpen, setWeekOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)

  /**
   * **La ventana de seis semanas, diferida y solo cuando puede servir**
   * (FEAT-007, tajada 4, y la medida del criterio 103).
   *
   * Lo único que la consume en esta pantalla es la hoja del ítem, así que no
   * se monta hasta que se abre una: **entrar en Plantilla cuesta exactamente
   * lo de ayer** —cero consultas nuevas— y la ventana se paga la primera vez
   * que se abre una hoja, no al pintar la lista. Después, con los días
   * cerrados ya en caché, es gratis.
   *
   * `enabled` apaga también la plantilla que pide el hook (el segundo
   * argumento de `useVidaItemsQuery` que nació en la tajada 2), así que antes
   * de la primera hoja no se pide nada. Sin sesión tampoco: el interruptor de
   * sesión vive dentro (`useVidaQueryGuard`), como en el resto del módulo.
   */
  const patterns = useVidaPatterns({
    enabled: sheetSession > 0,
    today: getCurrentLocalDate(),
    nowMinutes: null,
    dayHours: { startTime: dayHours.startTime, endTime: dayHours.endTime },
  })
  const editingPattern =
    editing === null ? null : (patterns.patterns.find((entry) => entry.itemId === editing.id) ?? null)

  function openSheet(item: VidaItem) {
    setEditing(item)
    setSheetSession((session) => session + 1)
    setSheetOpen(true)
  }

  /**
   * «Activar» de un toque (criterio 26): **no abre la hoja** y no manda nada
   * más que `isActive`, así que sus días, su hora y su nota se quedan como
   * están —omitir un campo en `vidaItemUpdate` lo deja igual—.
   */
  function activate(item: VidaItem) {
    setActivatingId(item.id)
    updateItem.mutate(
      { id: item.id, isActive: true },
      { onSettled: () => setActivatingId(null) },
    )
  }

  /** «Quitarlo de los N días»: `vidaItemDelete`, el primer uso de la mutación. */
  function removeAll(item: VidaItem) {
    deleteItem.mutate({ id: item.id }, { onSuccess: () => setRemoving(null) })
  }

  /**
   * «Quitarlo solo del viernes» (criterio 22): **no se borra nada**, se le
   * resta el día. El API exige al menos uno y por eso esta salida solo existe
   * cuando quedan días.
   */
  function removeDay(item: VidaItem, remainingDays: VidaDayOfWeek[]) {
    if (remainingDays.length === 0) return
    updateItem.mutate(
      { id: item.id, days: remainingDays },
      { onSuccess: () => setRemoving(null) },
    )
  }
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
            {/* **El primer minuto** (criterio 36): los seis puntos de partida con
                su hora y su duración ya propuestas, los días de una vez y un
                botón. De lunes a viernes por defecto, como el render. */}
            <VidaStartingPoints
              schedule={{
                defaultDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
              }}
            />
            <p className={styles.firstOr}>o</p>
            <Button variant="secondary" to={vidaPaths.actividades}>
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
  // La cuadrícula y su total salen de **una sola ventana para los siete días**
  // (A5): `buildTemplateDay` estira la ventana de *su* día, y siete escalas
  // distintas no se pueden comparar.
  const weekGrid = buildTemplateWeekGrid({
    items,
    dayStart: dayHours.startTime,
    dayEnd: dayHours.endTime,
  })
  const weekTotals = buildWeekTotals(weekGrid)
  const dayLabel = VIDA_DAY_LABELS[day]
  const guidance = buildTemplateGuidance(templateDay, dayLabel)
  const isDayEmpty = templateDay.timed.length === 0 && templateDay.untimed.length === 0

  return (
    <div className={styles.root}>
      {header()}

      <div className={styles.layout}>
      <div className={styles.main}>

      {/* **La semana entera** (criterios 42–48). En escritorio está siempre;
          en móvil se pinta solo con «Ver la semana entera» y se vuelve al día
          con el botón de arriba — **el mismo estado, la misma ruta**. */}
      <section
        className={styles.week}
        data-open={weekOpen ? 'true' : 'false'}
        aria-label="Tu semana entera"
      >
        <p className={styles.weekTotals}>{weekTotals.text}</p>
        <VidaWeekGrid
          grid={weekGrid}
          today={today}
          selectedDay={day}
          onOpenItem={openSheet}
        />
        <div className={styles.weekBack}>
          <Button variant="secondary" size="sm" onClick={() => setWeekOpen(false)}>
            Volver al día
          </Button>
        </div>
      </section>

      <div className={styles.dayView} data-hidden={weekOpen ? 'true' : 'false'}>
      <VidaTemplateDayTabs value={day} onChange={setDay} counts={counts} today={today}>
        <div className={styles.day}>
          <VidaTemplateDaySummary
            day={templateDay}
            guidance={guidance}
            dayStart={dayHours.startTime}
            dayEnd={dayHours.endTime}
            isDefaultSchedule={dayHours.isDefault}
            actions={
              <>
                <Button variant="secondary" size="sm" onClick={() => setCopyOpen(true)}>
                  Copiar este día a otros
                </Button>
                {/* Solo en móvil: en escritorio la cuadrícula ya está arriba y
                    esto sería una segunda puerta a lo mismo (el CSS lo apaga). */}
                <span className={styles.weekLink}>
                  <Button variant="ghost" size="sm" onClick={() => setWeekOpen(true)}>
                    Ver la semana entera
                  </Button>
                </span>
              </>
            }
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
                  // Desde la tajada 3 la salida **no sale de la pantalla**
                  // (criterio 29): abre el mismo panel de añadir.
                  <Button variant="secondary" onClick={() => setAddOpen(true)}>
                    Añadir a mi Vida
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
                      onOpen={openSheet}
                      onActivate={activate}
                      isActivating={activatingId === entry.item.id}
                    />
                  ))}
                </ol>
              ) : null}

              {/* En el cajón, «Ponerle hora» abre **la misma hoja** con la hora
                  lista para escribirse (criterio 25): no hay un segundo sitio
                  donde ponerle hora a un ítem. */}
              <VidaTemplateNoTimeDrawer
                items={templateDay.untimed}
                onOpen={openSheet}
                onSetTime={openSheet}
                onActivate={activate}
                activatingId={activatingId}
              />
            </>
          )}
        </div>
      </VidaTemplateDayTabs>
      </div>
      </div>

      {/* **En escritorio el panel va suelto al lado** (criterio 29); en móvil
          esta columna no se pinta y quien abre el panel es el «+» flotante de
          abajo. Es **la misma implementación** en los dos sitios. */}
      <aside className={styles.aside} aria-label="Añadir a mi Vida">
        <Card className={styles.panel} padding="lg">
          <VidaTemplateAddPanel day={day} items={items} onOpenItem={openSheet} />
        </Card>
      </aside>
      </div>

      {/* El «+» del marco A. **No navega**: abre la misma hoja inferior que la
          del ítem, con el panel dentro. */}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setAddOpen(true)}
        aria-label="Añadir a mi Vida"
      >
        <span aria-hidden>+</span>
      </button>

      <VidaTemplateAddSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        day={day}
        items={items}
        onOpenItem={(item) => {
          setAddOpen(false)
          openSheet(item)
        }}
      />

      {/* Una `key` por apertura: la hoja se remonta y parte limpia sin que
          nadie tenga que vaciarla a mano (molde de `VidaActividadesPage`).
          **Hasta la primera apertura no se monta**: la hoja pide las categorías
          al montarse y en esta pantalla no hacen falta para leer nada —con
          `lockActivity` ni siquiera se pintan—, así que entrar en la plantilla
          no dispara una consulta que nadie ha pedido. Después de abrirla se
          queda montada, para que la animación de salida se vea. */}
      {sheetSession > 0 ? (
      <VidaActivitySheet
        key={sheetSession}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        vidaItem={editing}
        activityRef={editing?.activity ?? null}
        lockActivity
        onRemoveFromTemplate={(item) => {
          setSheetOpen(false)
          setRemoving(item)
        }}
        pattern={editingPattern}
        patternAnswerNote={editingPattern?.answerNote ?? null}
        onPatternDismiss={patterns.answerSuggestion}
      />
      ) : null}

      <VidaTemplateCopyDay
        // Una `key` por apertura: el diálogo parte con los días sin marcar y
        // sin el resumen de la vez anterior.
        key={`copy-${day}-${copyOpen ? 'open' : 'closed'}`}
        open={copyOpen}
        fromDay={day}
        items={items}
        onClose={() => setCopyOpen(false)}
      />

      <VidaTemplateRemoveDialog
        open={removing !== null}
        item={removing}
        day={day}
        onClose={() => setRemoving(null)}
        onRemoveAll={removeAll}
        onRemoveDay={removeDay}
        isPending={deleteItem.isPending || updateItem.isPending}
      />
    </div>
  )
}
