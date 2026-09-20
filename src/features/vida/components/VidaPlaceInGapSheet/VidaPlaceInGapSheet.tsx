import { useMemo, useState } from 'react'
import { VidaDurationPills } from '@/features/vida/components/VidaDurationPills'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import {
  useAddDayPlanItemMutation,
  useEditDayPlanItemMutation,
} from '@/features/vida/hooks/useActivityDayPlan'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { filterActivitiesBySearch } from '@/features/vida/utils/activity-filters'
import {
  CATALOG_LIMIT,
  UNCATEGORIZED_GROUP_ICON,
  excludeArchivedActivities,
} from '@/features/vida/utils/vida-catalog.utils'
import type { GapWindow } from '@/features/vida/utils/vida-gap-form.utils'
import {
  buildStartTimeOptions,
  describeLeftovers,
  describeWindow,
  getMaxDurationForStartTime,
  toDayPlanTimes,
  validatePlacement,
} from '@/features/vida/utils/vida-gap-form.utils'
import {
  formatDurationFromMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import styles from './VidaPlaceInGapSheet.module.scss'

type ChosenActivity = { id: string; title: string; icon: string | null; color: string | null }

type VidaPlaceInGapSheetProps = {
  open: boolean
  onClose: () => void
  /** `YYYY-MM-DD` local del día al que se añade. */
  date: string
  /** El espacio libre donde tiene que caber: es quien sostiene D4. */
  gapWindow: GapWindow
  /** «viernes»: de qué día es la plantilla que se ofrece primero. */
  dayLabel: string
  /** La plantilla de ese día, tal cual llega de `vidaSuggestionsForDate`. */
  suggestions: VidaSuggestion[]
  /** El plan del día: lo que ya está puesto no se vuelve a ofrecer. */
  planItems: ActivityDayPlanItem[]
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes?: number | null
  /**
   * Editando un bloque que ya existe: «qué» viene fijo y se guarda con
   * `activityDayPlanItemEdit` en vez de `…ItemAdd` (criterio 30).
   */
  editing?: { itemId: string; activity: ChosenActivity; startTime: string; durationMinutes: number } | null
  /** Con qué actividad abre ya elegida (una ficha sin duración, criterio 19). */
  preselected?: ChosenActivity | null
}

/**
 * «Poner algo a las HH:MM»: **qué · cuánto · cuándo**, en ese orden.
 *
 * Mismo molde que `VidaActivitySheet` (que a su vez imita `HabitCreateWizard`):
 * `SteppedModal` con `ds="aura"` y `mobileSheet` —la hoja inferior del render—,
 * el estado aquí arriba, **una `key` por apertura** puesta por quien la abre, y
 * el cierre en el `onSuccess` **local** del `mutate`, nunca en el hook: si la
 * mutación falla, la hoja se queda abierta con lo elegido y el fallo se lee
 * dentro (criterio 29). El toast del hook avisa, pero no es lo que sostiene el
 * criterio.
 *
 * **D4, no hay solapes**, y lo sostiene entero el cliente: el API no valida
 * nada. Todo lo que sale de aquí ha pasado por `validatePlacement` contra la
 * ventana libre, así que ni se sale del hueco ni pisa un bloque. Las duraciones
 * que no caben **se apagan** en vez de desaparecer (criterio 26) y «otra hora»
 * no admite una hora de fuera (criterio 27).
 *
 * Un hueco que ya empezó llega con su principio en el reloj —lo parte
 * `buildDayAgenda`—, así que «ahora mismo» es literalmente la primera opción.
 */
export function VidaPlaceInGapSheet({
  open,
  onClose,
  date,
  gapWindow,
  dayLabel,
  suggestions,
  planItems,
  nowMinutes = null,
  editing = null,
  preselected = null,
}: VidaPlaceInGapSheetProps) {
  const isEditing = editing !== null
  const addMutation = useAddDayPlanItemMutation()
  const editMutation = useEditDayPlanItemMutation()
  const mutation = isEditing ? editMutation : addMutation

  const [chosen, setChosen] = useState<ChosenActivity | null>(editing?.activity ?? preselected)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    editing?.durationMinutes ?? preselectedDuration(preselected, suggestions, gapWindow),
  )
  const [startTime, setStartTime] = useState<string>(
    editing?.startTime ?? minutesToTime(gapWindow.startMinutes),
  )
  const [customStart, setCustomStart] = useState(
    isEditing && editing.startTime !== minutesToTime(gapWindow.startMinutes),
  )
  const [search, setSearch] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const startOptions = useMemo(
    () => buildStartTimeOptions(gapWindow, { nowMinutes }),
    [gapWindow, nowMinutes],
  )
  const maxMinutes = getMaxDurationForStartTime(startTime, gapWindow)

  // El buscador de «qué»: las actividades no archivadas, con la misma clave de
  // caché que el catálogo (`{ page: 1, limit: CATALOG_LIMIT }`), así que abrir
  // la hoja viniendo de Actividades no pide nada. **No se usa `SearchSelect`**:
  // tiene dos tests rojos en la línea base y arrastrarlo metería ruido.
  const activitiesQuery = useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })
  const plannedIds = new Set(planItems.map((item) => item.activityId))

  const templateOptions = suggestions
    .filter((suggestion) => suggestion.item.isActive !== false)
    .filter((suggestion) => !plannedIds.has(suggestion.item.activityId))
    .map((suggestion) => ({
      activity: toChosen(suggestion),
      durationMinutes: suggestion.item.durationMinutes,
    }))

  const searchResults = search.trim()
    ? filterActivitiesBySearch(
        excludeArchivedActivities(activitiesQuery.data?.activities ?? []),
        search,
      ).slice(0, 8)
    : []

  const validation = validatePlacement({ startTime, durationMinutes }, gapWindow)
  const canSubmit = chosen !== null && validation.valid && !mutation.isPending

  function chooseActivity(activity: ChosenActivity, templateMinutes: number | null) {
    setChosen(activity)
    setFormError(null)
    // Lo que la plantilla ya decía para esa cosa viene **preseleccionado** y se
    // puede cambiar (criterio 25). Si no cabe aquí, no se preselecciona nada:
    // sería una píldora encendida y apagada a la vez.
    if (durationMinutes === null && templateMinutes !== null && templateMinutes <= maxMinutes) {
      setDurationMinutes(templateMinutes)
    }
  }

  function handleSubmit() {
    if (!chosen) {
      setFormError('Elige qué vas a poner aquí.')
      return
    }
    const result = validatePlacement({ startTime, durationMinutes }, gapWindow)
    if (!result.valid) {
      setFormError(result.message)
      return
    }
    setFormError(null)
    const times = toDayPlanTimes(startTime, durationMinutes!)

    if (isEditing) {
      editMutation.mutate({ itemId: editing.itemId, ...times }, { onSuccess: onClose })
      return
    }
    addMutation.mutate({ date, activityId: chosen.id, ...times }, { onSuccess: onClose })
  }

  const footer = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
        Volver
      </Button>
      <Button
        type="button"
        onClick={handleSubmit}
        isLoading={mutation.isPending}
        disabled={!canSubmit}
      >
        {isEditing ? 'Guardar' : 'Poner'}
      </Button>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={
        isEditing
          ? 'Cambiar hora o duración'
          : `Poner algo a las ${formatTimeForDisplay(minutesToTime(gapWindow.startMinutes))}`
      }
      description={describeWindow(gapWindow)}
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        {!isEditing ? (
          <section className={styles.block} aria-labelledby="vida-gap-what">
            <h3 className={styles.legend} id="vida-gap-what">
              Qué
            </h3>

            {templateOptions.length > 0 ? (
              <ul className={styles.options}>
                {templateOptions.map(({ activity, durationMinutes: templateMinutes }) => (
                  <li key={activity.id}>
                    <button
                      type="button"
                      className={[styles.option, chosen?.id === activity.id ? styles.optionOn : '']
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={chosen?.id === activity.id}
                      disabled={mutation.isPending}
                      onClick={() => chooseActivity(activity, templateMinutes)}
                    >
                      <AppIcon name={activity.icon ?? UNCATEGORIZED_GROUP_ICON} size="2xs" decorative />
                      <span className={styles.optionName}>{activity.title}</span>
                      {templateMinutes !== null ? (
                        <span className={styles.optionMeta}>
                          {formatDurationFromMinutes(templateMinutes)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.hint}>
                Tu plantilla de {dayLabel} no tiene nada más que ofrecer aquí. Búscalo abajo.
              </p>
            )}

            <Input
              type="search"
              value={search}
              placeholder="Busca otra cosa…"
              aria-label="Buscar entre tus actividades"
              disabled={mutation.isPending}
              onChange={(event) => setSearch(event.target.value)}
            />

            {activitiesQuery.isPending && activitiesQuery.fetchStatus !== 'idle' && search.trim() ? (
              <span aria-busy="true" aria-live="polite">
                <Skeleton width="100%" height={30} radius="999px" />
              </span>
            ) : null}

            {search.trim() ? (
              searchResults.length > 0 ? (
                <ul className={styles.options}>
                  {searchResults.map((activity) => (
                    <li key={activity.id}>
                      <button
                        type="button"
                        className={[
                          styles.option,
                          chosen?.id === activity.id ? styles.optionOn : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-pressed={chosen?.id === activity.id}
                        disabled={mutation.isPending}
                        onClick={() => chooseActivity(fromActivity(activity), null)}
                      >
                        <AppIcon
                          name={activity.category?.icon ?? UNCATEGORIZED_GROUP_ICON}
                          size="2xs"
                          decorative
                        />
                        <span className={styles.optionName}>{activity.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.hint}>Nada con ese nombre. Puedes crearla en Actividades.</p>
              )
            ) : null}
          </section>
        ) : (
          <p className={styles.editing}>
            <AppIcon name={editing.activity.icon ?? UNCATEGORIZED_GROUP_ICON} size="2xs" decorative />
            <span className={styles.optionName}>{editing.activity.title}</span>
          </p>
        )}

        <section className={styles.block} aria-labelledby="vida-gap-how-long">
          <h3 className={styles.legend} id="vida-gap-how-long">
            Cuánto
          </h3>
          <VidaDurationPills
            label="Cuánto dura"
            value={durationMinutes}
            maxMinutes={maxMinutes}
            disabled={mutation.isPending}
            onChange={(minutes) => {
              setDurationMinutes(minutes)
              setFormError(null)
            }}
          />
        </section>

        <section className={styles.block} aria-labelledby="vida-gap-when">
          <h3 className={styles.legend} id="vida-gap-when">
            Cuándo
          </h3>
          <div className={styles.pills} role="group" aria-label="A qué hora empieza">
            {startOptions.map((option) => {
              const isOn = !customStart && option.value === startTime
              return (
                <button
                  key={option.value}
                  type="button"
                  className={[styles.pill, isOn ? styles.pillOn : ''].filter(Boolean).join(' ')}
                  aria-pressed={isOn}
                  disabled={mutation.isPending}
                  onClick={() => {
                    setCustomStart(false)
                    setStartTime(option.value)
                    setFormError(null)
                  }}
                >
                  {option.label}
                  {option.hint ? <span className={styles.pillHint}> · {option.hint}</span> : null}
                </button>
              )
            })}
            <button
              type="button"
              className={[styles.pill, customStart ? styles.pillOn : ''].filter(Boolean).join(' ')}
              aria-pressed={customStart}
              aria-expanded={customStart}
              disabled={mutation.isPending}
              onClick={() => setCustomStart((value) => !value)}
            >
              otra hora
            </button>
          </div>

          {customStart ? (
            <label className={styles.custom} htmlFor="vida-gap-start">
              <span className={styles.srOnly}>Otra hora</span>
              <Input
                id="vida-gap-start"
                type="time"
                value={startTime}
                min={minutesToTime(gapWindow.startMinutes)}
                max={minutesToTime(Math.max(gapWindow.startMinutes, gapWindow.endMinutes - 1))}
                disabled={mutation.isPending}
                onChange={(event) => {
                  setStartTime(event.target.value)
                  setFormError(null)
                }}
              />
            </label>
          ) : null}
        </section>

        {/* Lo que queda libre después, y la previsualización de lo elegido
            (criterio 28). Solo cuando las tres preguntas están resueltas: antes
            sería una cuenta sobre algo que todavía no existe. */}
        {chosen && validation.valid && durationMinutes !== null ? (
          <p className={styles.preview}>
            <strong className={styles.previewLine}>
              {chosen.title} · {formatTimeForDisplay(startTime)} ·{' '}
              {formatDurationFromMinutes(durationMinutes)}
            </strong>
            {describeLeftovers({ startTime, durationMinutes }, gapWindow)}
          </p>
        ) : null}

        {formError ?? (!validation.valid && durationMinutes !== null ? validation.message : null) ? (
          <p className={styles.error} role="alert">
            {formError ?? validation.message}
          </p>
        ) : null}

        {mutation.isError ? (
          <Alert variant="danger">
            {isEditing
              ? 'No pudimos cambiar ese bloque. Vuelve a intentarlo; lo que elegiste sigue aquí.'
              : 'No pudimos ponerlo en tu día. Vuelve a intentarlo; lo que elegiste sigue aquí.'}
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
}

function toChosen(suggestion: VidaSuggestion): ChosenActivity {
  const activity = suggestion.item.activity ?? null
  return {
    id: suggestion.item.activityId,
    title: activity?.title ?? 'Actividad',
    icon: activity?.category?.icon ?? null,
    color: activity?.category?.color ?? null,
  }
}

function fromActivity(activity: Activity): ChosenActivity {
  return {
    id: activity.id,
    title: activity.title,
    icon: activity.category?.icon ?? null,
    color: activity.category?.color ?? null,
  }
}

/**
 * Una ficha sin duración abre la hoja con la actividad puesta y **sin** que
 * nadie le invente cuánto dura (criterio 19). Si la plantilla sí lo dice y cabe,
 * viene preseleccionado (criterio 25).
 */
function preselectedDuration(
  preselected: ChosenActivity | null,
  suggestions: VidaSuggestion[],
  gapWindow: GapWindow,
): number | null {
  if (!preselected) return null
  const match = suggestions.find((suggestion) => suggestion.item.activityId === preselected.id)
  const minutes = match?.item.durationMinutes ?? null
  if (minutes === null) return null
  return minutes <= gapWindow.endMinutes - gapWindow.startMinutes ? minutes : null
}
