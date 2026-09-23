import { useState } from 'react'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { filterActivitiesBySearch } from '@/features/vida/utils/activity-filters'
import {
  CATALOG_LIMIT,
  UNCATEGORIZED_GROUP_ICON,
  excludeArchivedActivities,
} from '@/features/vida/utils/vida-catalog.utils'
import { formatDurationFromMinutes } from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaActivityPicker.module.scss'

/** Lo poco que hace falta saber de una actividad para elegirla. */
export type PickedActivity = {
  id: string
  title: string
  icon: string | null
  color: string | null
}

/** Cuántos resultados del buscador se enseñan. */
const MAX_SEARCH_RESULTS = 8

type VidaActivityPickerProps = {
  /** Lo elegido ahora mismo, o `null`. */
  value: PickedActivity | null
  /**
   * Lo que se acaba de elegir. `templateMinutes` es lo que su ítem de plantilla
   * decía que dura, o `null`: quien llama decide si lo usa (la hoja del hueco
   * lo preselecciona, «Empezar algo» no lo mira porque no pide duración).
   */
  onChange: (activity: PickedActivity, templateMinutes: number | null) => void
  /** La plantilla de ese día, tal cual llega de `vidaSuggestionsForDate`. */
  suggestions: VidaSuggestion[]
  /** Actividades que **no** se ofrecen desde la plantilla (las que ya están puestas). */
  excludeActivityIds?: string[]
  /** «viernes»: de qué día es la plantilla que se ofrece primero. */
  dayLabel: string
  disabled?: boolean
  /** El `id` del rótulo, para que la sección lo pueda referenciar. */
  headingId: string
  /** El rótulo de la pregunta. Casi siempre «Qué». */
  label?: string
  /**
   * ¿La ficha enseña la duración que dice la plantilla? Por defecto **sí**, que
   * es lo de siempre: en el hueco y al registrar ese número se preselecciona y
   * significa algo. **«Empezar algo» la apaga** porque ahí no viaja a ningún
   * sitio —`chooseActivity` la descarta en modo `start`— y la hoja promete que
   * la duración se dice al terminar (FEAT-023, criterio 625).
   */
  showTemplateDuration?: boolean
  /** La clase del contenedor: la pone la hoja, para que sus separadores casen. */
  className?: string
}

/**
 * **La hoja de «qué», escrita una sola vez** (criterio 38 de FEAT-004).
 *
 * Es el paso «qué» que nació dentro de `VidaPlaceInGapSheet` en FEAT-003 y que
 * aquí **se extrae** —no se copia— para que lo usen las cuatro entradas que lo
 * necesitan: poner algo en un hueco (FEAT-003), **«Empezar algo»** y
 * **«Registrar tiempo pasado»** (tajada 3) y, en la tajada 4, «Hice otra cosa»
 * y el «¿Qué pasó?» de un tramo sin dato. `VidaPlaceInGapSheet` pasa a usarlo
 * **el mismo día** en que se extrae: es lo único que impide que acaben siendo
 * dos buscadores.
 *
 * El orden es el del render y el de los criterios 30 y 31: **primero la
 * plantilla de ese día** —lo que ya dijiste que sueles hacer— y debajo un
 * **buscador** sobre las actividades **no archivadas** del catálogo. Se usa la
 * misma clave de caché que el catálogo (`{ page: 1, limit: CATALOG_LIMIT }`),
 * así que abrir esto viniendo de Actividades no pide nada.
 *
 * **No se escribe un quinto normalizador de texto**: la búsqueda es
 * `filterActivitiesBySearch`, que ya quita acentos («banar» encuentra
 * «Bañarme»). Y **no se usa `SearchSelect`**: tiene dos tests rojos en la línea
 * base del repositorio y arrastrarlo aquí metería ruido.
 *
 * **No crea actividades** (criterio 34): si no existe, se enlaza al catálogo.
 * Tampoco guarda nada ni conoce ninguna mutación: recibe `value` y avisa con
 * `onChange`. Lo único suyo es lo que hay escrito en el buscador.
 */
export function VidaActivityPicker({
  value,
  onChange,
  suggestions,
  excludeActivityIds = [],
  dayLabel,
  disabled = false,
  headingId,
  label = 'Qué',
  className,
  showTemplateDuration = true,
}: VidaActivityPickerProps) {
  const [search, setSearch] = useState('')

  const activitiesQuery = useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })
  const excluded = new Set(excludeActivityIds)

  const templateOptions = suggestions
    .filter((suggestion) => suggestion.item.isActive !== false)
    .filter((suggestion) => !excluded.has(suggestion.item.activityId))
    .map((suggestion) => ({
      activity: toPicked(suggestion),
      durationMinutes: suggestion.item.durationMinutes,
    }))

  const searchResults = search.trim()
    ? filterActivitiesBySearch(
        excludeArchivedActivities(activitiesQuery.data?.activities ?? []),
        search,
      ).slice(0, MAX_SEARCH_RESULTS)
    : []

  return (
    <section className={[styles.root, className].filter(Boolean).join(' ')} aria-labelledby={headingId}>
      <h3 className={styles.legend} id={headingId}>
        {label}
      </h3>

      {templateOptions.length > 0 ? (
        <ul className={styles.options}>
          {templateOptions.map(({ activity, durationMinutes: templateMinutes }) => (
            <li key={activity.id}>
              <button
                type="button"
                className={[styles.option, value?.id === activity.id ? styles.optionOn : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={value?.id === activity.id}
                disabled={disabled}
                onClick={() => onChange(activity, templateMinutes)}
              >
                <AppIcon name={activity.icon ?? UNCATEGORIZED_GROUP_ICON} size="2xs" decorative />
                <span className={styles.optionName}>{activity.title}</span>
                {showTemplateDuration && templateMinutes !== null ? (
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
        disabled={disabled}
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
                  className={[styles.option, value?.id === activity.id ? styles.optionOn : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={value?.id === activity.id}
                  disabled={disabled}
                  onClick={() => onChange(fromActivity(activity), null)}
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
          // No se crea nada desde aquí (criterio 34): se enlaza al catálogo,
          // que es donde una actividad nace con su categoría y sus días.
          <p className={styles.hint}>
            Nada con ese nombre.{' '}
            <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
              Crearla en Actividades
            </Button>
          </p>
        )
      ) : null}
    </section>
  )
}

function toPicked(suggestion: VidaSuggestion): PickedActivity {
  const activity = suggestion.item.activity ?? null
  return {
    id: suggestion.item.activityId,
    title: activity?.title ?? 'Actividad',
    icon: activity?.category?.icon ?? null,
    color: activity?.category?.color ?? null,
  }
}

function fromActivity(activity: Activity): PickedActivity {
  return {
    id: activity.id,
    title: activity.title,
    icon: activity.category?.icon ?? null,
    color: activity.category?.color ?? null,
  }
}
