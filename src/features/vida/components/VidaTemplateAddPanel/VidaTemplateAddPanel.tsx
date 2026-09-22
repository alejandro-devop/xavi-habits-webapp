import { useEffect, useMemo, useRef, useState } from 'react'
import { VidaDurationPills } from '@/features/vida/components/VidaDurationPills'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import { useSaveVidaItemForActivity } from '@/features/vida/hooks/useSaveVidaItemForActivity'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import { filterActivitiesBySearch } from '@/features/vida/utils/activity-filters'
import {
  buildVidaItemsByActivityAll,
  CATALOG_LIMIT,
  excludeArchivedActivities,
  groupActivitiesByCategory,
  UNCATEGORIZED_GROUP_ICON,
} from '@/features/vida/utils/vida-catalog.utils'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import {
  describeExistingHours,
  describeFitAt,
  templateItemsForDay,
} from '@/features/vida/utils/vida-template.utils'
import { formatTimeForDisplay } from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaTemplateAddPanel.module.scss'

/**
 * Lo que trae **un hueco pulsado** en la plantilla (FEAT-009, tajada 2): la
 * hora y la duración del hueco entero, más la frase que dice de dónde vienen.
 *
 * El `token` es lo que distingue «he pulsado otro hueco» de «no ha pasado
 * nada»: **sube en cada toque**, así que dos huecos con los mismos valores se
 * aplican los dos (criterio 160). Sin él, pulsar un hueco idéntico después de
 * haber editado la hora a mano no haría nada.
 */
export type VidaTemplateGapPrefill = {
  token: number
  /** `HH:mm`, el inicio del hueco. */
  startTime: string
  /** Los minutos del hueco **entero**, sin tope y sin redondeo (criterio 155). */
  durationMinutes: number
  /** «para las 8:40 · 20m libres»: la compone la página, que es quien tiene la fila. */
  label: string
}

export type VidaTemplateAddPanelProps = {
  /** El día que se está viendo: viene marcado y es contra el que se avisa. */
  day: VidaDayOfWeek
  /** La plantilla entera (los siete días, con los desactivados). */
  items: VidaItem[]
  /** «Ponerle hora»: lo resuelve la página abriendo **la misma hoja** del ítem. */
  onOpenItem?: (item: VidaItem) => void
  /** Se llama al guardar bien; en móvil es lo que cierra la hoja. */
  onSaved?: () => void
  /**
   * El hueco que se acaba de pulsar, o `null` cuando se llega por el «+»
   * flotante. Es **aditiva**: sin ella el panel es exactamente el de antes.
   */
  gapPrefill?: VidaTemplateGapPrefill | null
}

/**
 * **«Añadir a mi Vida»** (FEAT-005, tajada 3, criterios 29–34 y 40): el
 * catálogo buscable y, al elegir una actividad, **el mini-formulario en el
 * mismo panel** —días, hora y cuánto— para dejarla puesta sin salir de la
 * plantilla. Es el marco C del render.
 *
 * **Una sola implementación, dos envoltorios**: en escritorio va suelto en el
 * aside de `VidaPlantillaPage`; en móvil, dentro de `VidaTemplateAddSheet`
 * (`SteppedModal` con `mobileSheet`), que abre el «+» flotante. La lógica no
 * sabe en cuál está.
 *
 * **No escribe un segundo buscador ni un segundo agrupador**:
 * `filterActivitiesBySearch` (sin tildes), `excludeArchivedActivities` y
 * `groupActivitiesByCategory` son los del catálogo, tal cual. Y guarda por la
 * puerta de siempre, `useSaveVidaItemForActivity` con **`targetItem: null`**
 * (decisión A3): por eso una actividad que ya está en la plantilla puede
 * recibir **otra hora** —son dos `VidaItem`, criterio 34— en vez de que se le
 * reescriba la que tenía.
 *
 * Lo que **no** hace: crear una actividad nueva con su nombre y su categoría
 * (eso es del catálogo) y **bloquear un solape** (criterio 33: se dice qué hay
 * a esa hora y se guarda igual; quien los resuelve es «Armar» en Hoy).
 */
export function VidaTemplateAddPanel({
  day,
  items,
  onOpenItem,
  onSaved,
  gapPrefill = null,
}: VidaTemplateAddPanelProps) {
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<Activity | null>(null)
  const [days, setDays] = useState<VidaDayOfWeek[]>([day])
  const [startTime, setStartTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [daysError, setDaysError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  /**
   * **La precarga del hueco, aplicada en render** (FEAT-009, criterios 153, 155
   * y 160). `appliedToken` es **estado, no un `useRef`**: leer o escribir una
   * `ref` en render es lo que prohíbe el compilador de React —FEAT-008 lo midió
   * en este mismo repositorio: sube el lint de 14 a 16— y esto es el patrón de
   * «ajustar estado cuando cambia una prop».
   *
   * Se tocan **solo la hora y la duración**: ni la actividad elegida ni los días
   * marcados, porque pulsar otro hueco es decir «lo quiero aquí», no empezar de
   * cero (criterio 160). Los dos campos de «Cuánto» se reparten solos: se los
   * reparte `VidaDurationPills` en cuanto `value` le llega distinto de lo último
   * que emitió (FEAT-008), así que 90 min se leen «1» y «30» (criterio 170).
   */
  const [appliedToken, setAppliedToken] = useState<number | null>(null)
  if (gapPrefill && gapPrefill.token !== appliedToken) {
    setAppliedToken(gapPrefill.token)
    setStartTime(gapPrefill.startTime)
    setDurationMinutes(gapPrefill.durationMinutes)
  }
  if (!gapPrefill && appliedToken !== null) setAppliedToken(null)

  // El foco va **al buscador de actividades** (criterio 159): lo que falta
  // después de pulsar un hueco es elegir qué poner ahí. Si ya hay una actividad
  // elegida el buscador no está montado y esto no hace nada —el `?.` es la
  // condición—, que es justo lo que pide el criterio 160: pulsar otro hueco no
  // devuelve al catálogo.
  useEffect(() => {
    if (appliedToken === null) return
    searchRef.current?.focus()
  }, [appliedToken])

  const activitiesQuery = useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })
  const { data: categories = [] } = useActivityCategoriesQuery()
  const save = useSaveVidaItemForActivity()

  const activities = useMemo(
    () => excludeArchivedActivities(activitiesQuery.data?.activities ?? []),
    [activitiesQuery.data],
  )
  const itemsByActivity = useMemo(() => buildVidaItemsByActivityAll(items), [items])
  const groups = useMemo(() => {
    const all = groupActivitiesByCategory(activities, categories)
    if (!search.trim()) return all
    return all
      .map((group) => ({ ...group, activities: filterActivitiesBySearch(group.activities, search) }))
      .filter((group) => group.activities.length > 0)
  }, [activities, categories, search])

  /** Lo que ya hay **ese día**: es contra lo que se dice «a las 18:00 ya tienes…». */
  const dayItems = useMemo(() => templateItemsForDay(items, day), [items, day])
  const fitText = describeFitAt(dayItems, startTime)

  const pickedItems = picked ? (itemsByActivity.get(picked.id) ?? []) : []
  const alreadyHours = describeExistingHours(pickedItems)

  function pick(activity: Activity) {
    setPicked(activity)
    setDays([day])
    // **Elegir la actividad no borra lo que puso el hueco** (criterio 154): en
    // la plantilla añadir es elegir del catálogo, así que se pulsa el hueco y
    // *después* se elige, y vaciar aquí tiraría la precarga entera. Por el «+»
    // flotante `gapPrefill` es `null` y se vacía como siempre.
    if (!gapPrefill) {
      setStartTime('')
      setDurationMinutes(null)
    }
    setDaysError(null)
  }

  function toggleDay(value: VidaDayOfWeek) {
    setDays((current) =>
      current.includes(value)
        ? current.filter((other) => other !== value)
        : [...current, value],
    )
    setDaysError(null)
  }

  function handleSave() {
    if (!picked || save.isPending) return
    if (days.length === 0) {
      setDaysError('Déjale al menos un día para que salga en Hoy.')
      return
    }
    save.save(
      {
        activityId: picked.id,
        // **Siempre `null`**: aquí se añade, nunca se reescribe lo que ya
        // estuviera puesto a otra hora (criterio 34).
        targetItem: null,
        inTemplate: true,
        days,
        startTime: startTime.trim() ? startTime.trim() : null,
        durationMinutes,
      },
      {
        onSuccess: () => {
          setPicked(null)
          setSearch('')
          onSaved?.()
        },
      },
    )
  }

  /** La línea de estado de una actividad en la lista (criterio 31). */
  function describeState(own: VidaItem[]): string {
    if (own.length === 0) return 'aún no está'
    const first = own[0]!
    const daysText = first.days.map((value) => VIDA_DAY_SHORT_LABELS[value]).join(' ')
    const when = first.startTime ? formatTimeForDisplay(first.startTime) : 'sin hora'
    const more = own.length > 1 ? ` · ${own.length} horas` : ''
    return `en tu plantilla · ${daysText} · ${when}${more}`
  }

  function list() {
    if (activitiesQuery.isPending && activitiesQuery.fetchStatus !== 'idle') {
      return (
        <div className={styles.loading} aria-busy="true" aria-live="polite">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} width="100%" height={46} radius="0.875rem" />
          ))}
          <span className={styles.srOnly}>Cargando tus actividades…</span>
        </div>
      )
    }

    // **Un fallo no es un catálogo vacío** (criterio 40): mientras no se sepa
    // qué hay, no se dice «todavía no tienes actividades».
    if (activitiesQuery.isError) {
      return (
        <Alert variant="warning" title="No pudimos cargar tus actividades">
          <Button variant="secondary" size="sm" onClick={() => void activitiesQuery.refetch()}>
            Reintentar
          </Button>
        </Alert>
      )
    }

    if (activities.length === 0) {
      return (
        <EmptyState
          title="Todavía no tienes actividades"
          description="Las cosas que haces viven en tu catálogo: créalas ahí y vuelve a ponerles hora aquí."
          action={
            <Button to={vidaPaths.actividades} variant="secondary" size="sm">
              Ir a Actividades
            </Button>
          }
        />
      )
    }

    if (groups.length === 0) {
      return <p className={styles.none}>Nada con ese nombre. Prueba con otra palabra.</p>
    }

    return (
      <div className={styles.groups}>
        {groups.map((group) => (
          <section key={group.id} className={styles.group}>
            <h4 className={styles.groupName}>
              <AppIcon name={group.icon ?? UNCATEGORIZED_GROUP_ICON} size="2xs" decorative />
              {group.name}
            </h4>
            <ul className={styles.rows}>
              {group.activities.map((activity) => {
                const own = itemsByActivity.get(activity.id) ?? []
                const needsTime = own.length > 0 && !own[0]!.startTime
                return (
                  <li key={activity.id} className={styles.row}>
                    <span className={styles.rowText}>
                      <span className={styles.rowName}>{activity.title}</span>
                      <span className={styles.rowState}>{describeState(own)}</span>
                    </span>
                    {needsTime && onOpenItem ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenItem(own[0]!)}
                      >
                        Ponerle hora
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => pick(activity)}>
                        {own.length > 0 ? '+ Otra hora' : '+ Añadir'}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    )
  }

  return (
    <section className={styles.root} aria-labelledby="vida-add-panel-title">
      <div className={styles.head}>
        <h3 id="vida-add-panel-title" className={styles.title}>
          Añadir a mi Vida
        </h3>
        <p className={styles.lead}>
          Tus actividades. Eliges una y le pones días, hora y cuánto — aquí mismo.
        </p>
        {/* De qué hueco viene (criterio 159). Una sola implementación: vale
            para el aside de escritorio y para la hoja de móvil. */}
        {gapPrefill ? (
          <p className={styles.fromGap}>
            Viene del hueco que pulsaste · <b>{gapPrefill.label}</b>
          </p>
        ) : null}
      </div>

      {picked ? (
        <div className={styles.form}>
          <p className={styles.picked}>
            <b>{picked.title}</b>
          </p>
          {/* Criterio 34: **se dice antes**, no después de crear el segundo. */}
          {alreadyHours ? (
            <p className={styles.note}>
              {picked.title} ya está {alreadyHours} · esto le añade otra hora.
            </p>
          ) : null}

          <span className={styles.label} id="vida-add-days-label">
            Qué días
          </span>
          <div className={styles.days} role="group" aria-labelledby="vida-add-days-label">
            {VIDA_DAY_ORDER.map((value) => {
              const isOn = days.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  className={[styles.day, isOn ? styles.dayOn : ''].filter(Boolean).join(' ')}
                  aria-pressed={isOn}
                  aria-label={VIDA_DAY_LABELS[value]}
                  disabled={save.isPending}
                  onClick={() => toggleDay(value)}
                >
                  <span aria-hidden>{VIDA_DAY_SHORT_LABELS[value]}</span>
                </button>
              )
            })}
          </div>
          {daysError ? (
            <p className={styles.error} role="alert">
              {daysError}
            </p>
          ) : null}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="vida-add-start-time">
              A qué hora <span className={styles.labelHint}>· opcional</span>
            </label>
            <Input
              id="vida-add-start-time"
              type="time"
              value={startTime}
              disabled={save.isPending}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label} id="vida-add-duration-label">
              Cuánto <span className={styles.labelHint}>· opcional</span>
            </span>
            <VidaDurationPills
              label="Cuánto dura"
              freeInput="hoursAndMinutes"
              value={durationMinutes}
              disabled={save.isPending}
              onChange={setDurationMinutes}
            />
          </div>

          {/* Criterio 33: **dice si cabe y no bloquea**. Los solapes se guardan
              igual; quien los resuelve es «Armar desde la plantilla» en Hoy. */}
          {fitText ? <p className={styles.fit}>Cabe: {fitText}</p> : null}

          {save.isError ? (
            <p className={styles.error} role="alert">
              No pudimos guardarlo. Lo que escribiste sigue aquí: inténtalo otra vez.
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>
              Volver
            </Button>
            <Button onClick={handleSave} isLoading={save.isPending} disabled={save.isPending}>
              Añadir a mi Vida
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Input
            ref={searchRef}
            type="search"
            value={search}
            aria-label="Buscar en tus actividades"
            placeholder="Buscar en tus actividades…"
            onChange={(event) => setSearch(event.target.value)}
          />
          {list()}
        </>
      )}
    </section>
  )
}
