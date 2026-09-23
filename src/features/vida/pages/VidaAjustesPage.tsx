import { useMemo, useState } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useUpdateUserSettingsMutation } from '@/features/settings/hooks/useUserSettings'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useSetVidaGoalDaysMutation } from '@/features/vida/hooks/useVidaGoals'
import { useVidaNight } from '@/features/vida/hooks/useVidaNight'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import {
  describeNightKind,
  formatNightDuration,
  nightDurationMinutes,
  normalizeNightDays,
} from '@/features/vida/utils/vida-night.utils'
import {
  isEndAfterStart,
  isValidHhMm,
  normalizeTimeForDisplay,
} from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaAjustesPage.module.scss'

type HoursDraft = { startTime: string; endTime: string }

/**
 * El borrador de la noche. **Las horas empiezan vacías**, no en una hora
 * propuesta: proponer «23:00» sería una elección que el usuario no hizo
 * (criterio 268).
 */
type NightDraft = { bedTime: string; wakeTime: string; days: VidaDayOfWeek[] }

/** Lo guardado, listo para un `<input type="time">`. Lo que no vale, vacío. */
function timeForInput(saved: string | null): string {
  return isValidHhMm(saved) ? normalizeTimeForDisplay(saved!) : ''
}

/**
 * Las metas del catálogo, sin repetir. **No hay consulta de metas**: llegan
 * dentro de la categoría (`ActivityCategory.goal`), así que se agrupan por
 * `goal.id` igual que hace `buildGoalArcs`, y con el mismo orden
 * (`orderIndex`, y el nombre para desempatar).
 */
function goalsOfCatalog(categories: { goal?: VidaGoal | null }[] | undefined): VidaGoal[] {
  const byId = new Map<string, VidaGoal>()
  for (const category of categories ?? []) {
    if (category.goal) byId.set(category.goal.id, category.goal)
  }
  return [...byId.values()].sort(
    (a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name, 'es'),
  )
}

/**
 * Los ajustes del módulo Vida: **a qué hora empieza y a qué hora termina tu
 * día**, y nada más (D2). Son los dos bordes de los que cuelga toda la agenda:
 * el ancho de la barra del día, dónde cae la marca de «ahora» y qué cuenta como
 * hueco.
 *
 * Vive en `/app/vida/ajustes`, en el popover «Ajustes» del módulo, igual que
 * Categorías / Medidas / Mi Persona en hábitos. **No** en `/app/settings` —eso
 * es la cuenta, no el módulo— ni en una hoja desde Hoy: son dos campos que casi
 * nunca cambian y que merecen una URL.
 *
 * Se guardan con `updateMySettings` tal cual (`useUpdateUserSettingsMutation`):
 * no hay hook de ajustes nuevo ni clave de caché nueva. La mutación ya escribe
 * la respuesta en `settingsKeys.my()`, así que al volver se ve lo guardado sin
 * pedir nada otra vez.
 *
 * El formulario **deriva** lo guardado hasta que alguien lo toca —igual que el
 * bloque de plantilla de `VidaActivitySheet`—: si la consulta llega después de
 * montar la página, los campos se ponen solos en su sitio y no hace falta un
 * `useEffect` que copie props al estado.
 *
 * Molde: `src/pages/app/SettingsPage/SettingsPage.tsx` para la forma, y
 * `VidaCategoriasPage` para los cuatro estados separados de verdad.
 */
export function VidaAjustesPage() {
  const hours = useVidaDayHours()
  const updateMutation = useUpdateUserSettingsMutation()

  const nightState = useVidaNight()
  /**
   * **Otra instancia de la misma mutación**, no otra mutación: `useMutation`
   * devuelve un estado por llamada, así que un fallo al guardar la noche no
   * pinta un error en «Tu día» ni al revés (criterio 267). El documento y la
   * clave de caché son los de siempre, y quien escribe la respuesta sigue
   * siendo el `onSuccess` del hook de ajustes.
   */
  const nightMutation = useUpdateUserSettingsMutation()

  const categoriesQuery = useActivityCategoriesQuery()
  const goalDaysMutation = useSetVidaGoalDaysMutation()

  const [draft, setDraft] = useState<HoursDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedNow, setSavedNow] = useState(false)

  /**
   * Lo que se está guardando, por meta. Mientras el viaje está en vuelo los
   * botones ya enseñan el día tocado: el catálogo tarda en volver y el usuario
   * pulsó hace un instante. Se suelta al volver, y lo que manda entonces es lo
   * guardado.
   */
  const [goalDaysDraft, setGoalDaysDraft] = useState<Record<string, VidaDayOfWeek[]>>({})
  const [goalDaysError, setGoalDaysError] = useState<Record<string, string>>({})

  const [nightDraft, setNightDraft] = useState<NightDraft | null>(null)
  const [nightError, setNightError] = useState<string | null>(null)
  const [nightSavedNow, setNightSavedNow] = useState(false)

  const goals = useMemo(() => goalsOfCatalog(categoriesQuery.data), [categoriesQuery.data])

  function toggleGoalDay(goal: VidaGoal, day: VidaDayOfWeek) {
    const current = goalDaysDraft[goal.id] ?? goal.activeDays
    const next = current.includes(day)
      ? current.filter((other) => other !== day)
      : VIDA_DAY_ORDER.filter((other) => other === day || current.includes(other))

    // **Quedarse en cero no llega al servidor.** El CHECK de la columna lo
    // rechazaría, pero el usuario se enteraría por un error de red de algo que
    // aquí se puede decir antes y con las palabras del módulo.
    if (next.length === 0) {
      setGoalDaysError((previous) => ({
        ...previous,
        [goal.id]: 'Déjale al menos un día: sin ninguno, esta meta no contaría nunca.',
      }))
      return
    }

    setGoalDaysError((previous) => {
      const { [goal.id]: _removed, ...rest } = previous
      return rest
    })
    setGoalDaysDraft((previous) => ({ ...previous, [goal.id]: next }))

    // Un toque, un guardado: ni pantalla ni confirmación en medio (criterio 581).
    goalDaysMutation.mutate(
      { goalId: goal.id, activeDays: next },
      {
        onSettled: () => {
          setGoalDaysDraft((previous) => {
            const { [goal.id]: _done, ...rest } = previous
            return rest
          })
        },
      },
    )
  }

  const startTime = draft?.startTime ?? hours.startTime
  const endTime = draft?.endTime ?? hours.endTime
  const isDirty = draft !== null

  function patch(next: Partial<HoursDraft>) {
    setError(null)
    setSavedNow(false)
    setDraft({ startTime, endTime, ...next })
  }

  function handleSubmit() {
    if (!isValidHhMm(startTime) || !isValidHhMm(endTime)) {
      setError('Pon las dos horas en formato 24 h, por ejemplo 06:30.')
      return
    }
    // Criterio 10: el fin tiene que ser posterior al inicio. Nada sale hacia el
    // API si no lo es, y el campo queda señalado.
    if (!isEndAfterStart(startTime, endTime)) {
      setError('La hora de fin tiene que ser posterior a la de inicio.')
      return
    }

    setError(null)
    updateMutation.mutate(
      { vidaDayStartTime: startTime, vidaDayEndTime: endTime },
      {
        onSuccess: () => {
          // El borrador se suelta: a partir de aquí lo que manda es lo guardado.
          setDraft(null)
          setSavedNow(true)
        },
      },
    )
  }

  // ───────────────────────── Tu noche (FEAT-012, tajada 1) ─────────────────
  // El borrador **no pisa lo guardado**: mientras nadie toque nada, lo que se
  // ve es lo del API, así que si la consulta llega después de montar la página
  // los campos se ponen solos. Mismo patrón que «Tu día», sin `useEffect`.
  const bedTime = nightDraft?.bedTime ?? timeForInput(nightState.saved.bedTime)
  const wakeTime = nightDraft?.wakeTime ?? timeForInput(nightState.saved.wakeTime)
  const nightDays = nightDraft?.days ?? normalizeNightDays(nightState.saved.days)
  const isNightDirty = nightDraft !== null
  const hasSavedNight = nightState.night !== null

  const nightMinutes = nightDurationMinutes(bedTime, wakeTime)
  const nightDurationLabel = formatNightDuration(nightMinutes)

  function patchNight(next: Partial<NightDraft>) {
    setNightError(null)
    setNightSavedNow(false)
    setNightDraft({ bedTime, wakeTime, days: nightDays, ...next })
  }

  function toggleNightDay(day: VidaDayOfWeek) {
    // **Ninguna noche marcada es una respuesta válida** (criterio 265): aquí no
    // hay el «déjale al menos uno» de las metas. Lo que sí hay es que el
    // servidor rechaza `[]` (`.min(1)`), y por eso al guardar se manda `null`.
    const next = nightDays.includes(day)
      ? nightDays.filter((other) => other !== day)
      : VIDA_DAY_ORDER.filter((other) => other === day || nightDays.includes(other))
    patchNight({ days: [...next] })
  }

  function handleNightSubmit() {
    // Vaciar las dos horas es **quitar la noche** (criterio 270): no es un error.
    if (!bedTime && !wakeTime) {
      saveNight(null, null, [])
      return
    }
    if (!isValidHhMm(bedTime) || !isValidHhMm(wakeTime)) {
      setNightError('Pon las dos horas en formato 24 h, por ejemplo 23:00.')
      return
    }
    // Criterio 263. **Esta comprobación es solo del cliente**: el servidor mira
    // el formato y nada más, así que si no está aquí no está en ningún sitio.
    if (bedTime === wakeTime) {
      setNightError('Las dos horas no pueden ser la misma: una noche de cero minutos no es una noche.')
      return
    }
    // Y lo que **no** se comprueba, a propósito: que te levantes después de
    // acostarte. `23:00 → 5:00` cruza la medianoche y es una noche perfectamente
    // normal (criterio 262). Nada de `isEndAfterStart` aquí.
    saveNight(bedTime, wakeTime, nightDays)
  }

  function saveNight(
    vidaNightBedTime: string | null,
    vidaNightWakeTime: string | null,
    days: VidaDayOfWeek[],
  ) {
    setNightError(null)
    nightMutation.mutate(
      {
        vidaNightBedTime,
        vidaNightWakeTime,
        // **`[]` lo rechaza el servidor** (`.min(1)`): «ninguna noche» viaja
        // como `null` (criterio 265).
        vidaNightDays: days.length > 0 ? days : null,
      },
      {
        onSuccess: () => {
          setNightDraft(null)
          setNightSavedNow(true)
        },
      },
    )
  }

  function handleNightClear() {
    setNightDraft({ bedTime: '', wakeTime: '', days: [] })
    saveNight(null, null, [])
  }

  function shell(children: React.ReactNode) {
    return (
      <div className={styles.root}>
        <PageHeader
          title="Ajustes de Vida"
          subtitle="A qué hora empieza y termina tu día, y a qué hora duermes."
          actions={
            <Button variant="ghost" size="sm" to={vidaPaths.hoy}>
              ← A Hoy
            </Button>
          }
        />
        {children}
        {nightSection()}
        {goalsSection()}
      </div>
    )
  }

  /**
   * **Tu noche** (criterios 260 a 270). Tres cosas y ninguna más: a qué hora te
   * acuestas, a qué hora te levantas y qué noches.
   *
   * **No es un ítem de la plantilla**: no aparece en el catálogo, no crea
   * ninguna actividad y no se puede arrastrar a ninguna parte. Es un borde del
   * día, como «Tu día», y por eso vive aquí al lado y no en Hoy.
   *
   * Lo que esta sección hace distinto de todo lo demás del módulo: **no valida
   * el orden de las horas**. `23:00 → 5:00` cruza la medianoche y `1:00 → 6:40`
   * no, y las dos son noches legales (criterio 262). La única regla es que no
   * sean la misma (criterio 263), y esa regla **es del cliente**: el validador
   * del servidor dice en un comentario que la comprueba, pero no la comprueba.
   *
   * Cargando no se pinta nada (criterio 311) y sin sesión tampoco: lo que se
   * vería sería una noche vacía que parecería una elección.
   */
  function nightSection() {
    if (nightState.isDisabled || nightState.isPending) return null

    if (nightState.isError) {
      return (
        <Card className={styles.panel} padding="lg">
          <h2 className={styles.sectionTitle}>Tu noche</h2>
          {/* Criterio 312: se dice que no cargó y **no** se afirma «no tienes
              noche» — que es justo lo que un formulario vacío parecería. */}
          <Alert variant="danger" title="No pudimos cargar tu noche">
            <p className={styles.hint}>
              No sabemos qué tienes puesto ahora mismo, así que no lo enseñamos.
            </p>
          </Alert>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => nightState.refetch()}>
              Reintentar
            </Button>
          </div>
        </Card>
      )
    }

    return (
      <Card className={styles.panel} padding="lg">
        <h2 className={styles.sectionTitle}>Tu noche</h2>

        {/* Criterio 268: con los tres nulos esto es una **invitación**, no un
            error, y los campos están vacíos: ninguna hora propuesta. */}
        {!hasSavedNight && !isNightDirty ? (
          <p className={styles.hint}>
            Todavía no has puesto tu noche. Ponla y aparecerá como una franja arriba y abajo de cada
            día, fuera de la lista.
          </p>
        ) : null}

        <div className={styles.fields}>
          <FormField id="vida-night-bed" label="Me acuesto a las">
            <Input
              id="vida-night-bed"
              type="time"
              value={bedTime}
              disabled={nightMutation.isPending}
              aria-invalid={nightError ? true : undefined}
              onChange={(event) => patchNight({ bedTime: event.target.value })}
            />
          </FormField>

          <FormField id="vida-night-wake" label="Me levanto a las">
            <Input
              id="vida-night-wake"
              type="time"
              value={wakeTime}
              disabled={nightMutation.isPending}
              aria-invalid={nightError ? true : undefined}
              onChange={(event) => patchNight({ wakeTime: event.target.value })}
            />
          </FormField>
        </div>

        {/* Criterio 261: debajo de las dos horas, la duración y **qué clase de
            noche es**. Sin las dos horas no se afirma ninguna duración. */}
        {nightMinutes !== null ? (
          <div className={styles.nightRead}>
            <p className={styles.nightDuration}>
              Son <strong>{nightDurationLabel}</strong> de sueño.
            </p>
            <p className={styles.hint}>
              {describeNightKind(
                { bedTime, wakeTime, days: nightDays },
                nightDays[0] ?? undefined,
              )}
            </p>
          </div>
        ) : null}

        <div className={styles.nightDays}>
          <p className={styles.goalName}>Qué noches</p>
          {/* Criterio 264, con estas palabras exactas: el usuario no tiene que
              deducir por qué extremo se cuenta la noche. */}
          <p className={styles.hint}>
            Marca <strong>la noche en la que te acuestas</strong>: marcar «viernes» es la noche del
            viernes al sábado.
          </p>
          <div className={styles.days} role="group" aria-label="Qué noches">
            {VIDA_DAY_ORDER.map((day) => {
              const isOn = nightDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  className={[styles.day, isOn ? styles.dayOn : ''].filter(Boolean).join(' ')}
                  aria-pressed={isOn}
                  aria-label={`La noche del ${VIDA_DAY_LABELS[day]}`}
                  disabled={nightMutation.isPending}
                  onClick={() => toggleNightDay(day)}
                >
                  <span aria-hidden>{VIDA_DAY_SHORT_LABELS[day]}</span>
                </button>
              )
            })}
          </div>
          {/* Criterio 265: ninguna marcada es una respuesta, no un fallo. */}
          {nightDays.length === 0 ? (
            <p className={styles.hint}>
              Sin ninguna noche marcada tu noche no se aplica a ningún día, y el módulo se comporta
              como si no la tuvieras.
            </p>
          ) : null}
        </div>

        {/* Criterio 269: «Tu día» y «Tu noche» conviven, y en una línea se dice
            cuál manda (D1). */}
        <p className={styles.hint}>
          Manda tu noche: los días que marques, el día empezará y acabará donde diga ella. «Tu día»
          se queda para los días sin noche.
        </p>

        {nightError ? (
          <p className={styles.error} role="alert">
            {nightError}
          </p>
        ) : null}

        {/* Criterio 267: en lenguaje humano, sin perder lo escrito —el borrador
            sigue en pie— y sin tocar la noche que ya estaba guardada. */}
        {nightMutation.isError ? (
          <Alert variant="danger">
            No pudimos guardar tu noche. Revisa la conexión y vuelve a intentarlo; lo que pusiste
            sigue aquí y tu noche de antes sigue vigente.
          </Alert>
        ) : null}

        {nightSavedNow && !nightMutation.isError ? (
          <p className={styles.saved} role="status">
            Guardado.
          </p>
        ) : null}

        <div className={styles.actions}>
          {/* Criterio 270: quitarla es posible y no deja nada colgando. */}
          {hasSavedNight ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleNightClear}
              disabled={nightMutation.isPending}
            >
              Quitar mi noche
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={handleNightSubmit}
            isLoading={nightMutation.isPending}
            disabled={nightMutation.isPending}
          >
            Guardar mi noche
          </Button>
        </div>
      </Card>
    )
  }

  /**
   * Los días de cada meta. **Sin metas no se pinta nada** (criterio 582): desde
   * aquí no se crea ninguna — nacen en el formulario de categoría o en la
   * pregunta de Hoy —, así que una sección vacía solo sería un hueco que no
   * lleva a ningún sitio.
   *
   * Cargando tampoco se pinta: todavía no se sabe si hay alguna, y un esqueleto
   * prometería una fila que puede no existir.
   */
  function goalsSection() {
    if (categoriesQuery.isError) {
      return (
        <Card className={styles.panel} padding="lg">
          <h2 className={styles.sectionTitle}>Los días de tus metas</h2>
          <p className={styles.hint}>
            No pudimos cargar tus metas. Vuelve a entrar en un momento y aparecen.
          </p>
        </Card>
      )
    }

    if (goals.length === 0) return null

    return (
      <Card className={styles.panel} padding="lg">
        <h2 className={styles.sectionTitle}>Los días de tus metas</h2>
        <p className={styles.hint}>
          Los días en que cada meta cuenta. El resto se registra igual, solo que no suma contra
          nada.
        </p>

        {goals.map((goal) => {
          const days = goalDaysDraft[goal.id] ?? goal.activeDays
          const isSaving = goalDaysDraft[goal.id] !== undefined
          const dayError = goalDaysError[goal.id]
          return (
            <div key={goal.id} className={styles.goal}>
              <p className={styles.goalName}>{goal.name}</p>
              <div className={styles.days} role="group" aria-label={`Días de ${goal.name}`}>
                {VIDA_DAY_ORDER.map((day) => {
                  const isOn = days.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      className={[styles.day, isOn ? styles.dayOn : ''].filter(Boolean).join(' ')}
                      aria-pressed={isOn}
                      aria-label={VIDA_DAY_LABELS[day]}
                      disabled={isSaving}
                      onClick={() => toggleGoalDay(goal, day)}
                    >
                      <span aria-hidden>{VIDA_DAY_SHORT_LABELS[day]}</span>
                    </button>
                  )
                })}
              </div>
              {dayError ? (
                <p className={styles.error} role="alert">
                  {dayError}
                </p>
              ) : null}
            </div>
          )
        })}
      </Card>
    )
  }

  // Sin sesión la consulta queda deshabilitada (`isPending` + `fetchStatus:
  // 'idle'`): sin esta rama el esqueleto giraría para siempre.
  if (hours.isDisabled) {
    return shell(
      <Card className={styles.panel} padding="lg">
        <EmptyState
          title="Entra para ajustar tu día"
          description="El horario viaja con tu cuenta. Inicia sesión y aparece."
          action={
            <Button to={authPaths.login} variant="secondary">
              Iniciar sesión
            </Button>
          }
        />
      </Card>,
    )
  }

  // Cargando **no** se pinta con las horas por defecto: saltarían en cuanto
  // llegaran las de verdad (criterio 50).
  if (hours.isPending) {
    return shell(
      <Card className={styles.panel} padding="lg">
        <div className={styles.loading} aria-busy="true" aria-live="polite">
          <span className={styles.srOnly}>Cargando tu horario…</span>
          <Skeleton width="45%" height={14} />
          <Skeleton width={140} height={38} radius="0.6rem" />
          <Skeleton width="45%" height={14} />
          <Skeleton width={140} height={38} radius="0.6rem" />
        </div>
      </Card>,
    )
  }

  return shell(
    <Card className={styles.panel} padding="lg">
      {hours.isError ? (
        <Alert variant="danger" title="No pudimos cargar tu horario">
          <p className={styles.hint}>
            Puedes ponerlo igualmente y guardarlo; mientras tanto, la agenda usa 06:30 y 23:00.
          </p>
        </Alert>
      ) : null}

      <div className={styles.fields}>
        <FormField id="vida-day-start" label="Empieza mi día">
          <Input
            id="vida-day-start"
            type="time"
            value={startTime}
            disabled={updateMutation.isPending}
            aria-invalid={error ? true : undefined}
            onChange={(event) => patch({ startTime: event.target.value })}
          />
        </FormField>

        <FormField id="vida-day-end" label="Termina mi día">
          <Input
            id="vida-day-end"
            type="time"
            value={endTime}
            disabled={updateMutation.isPending}
            aria-invalid={error ? true : undefined}
            onChange={(event) => patch({ endTime: event.target.value })}
          />
        </FormField>
      </div>

      {/* Criterio 9: que se lea que 06:30 y 23:00 son el valor por defecto y no
          algo que el usuario eligiera. Mientras haya un borrador sin guardar no
          se dice nada: lo que se ve ya no es el valor por defecto. */}
      {hours.isDefault && !isDirty && !hours.isError ? (
        <p className={styles.hint}>
          06:30 y 23:00 son el horario por defecto: todavía no has elegido el tuyo. Cámbialo y
          guarda para que la agenda use el tuyo.
        </p>
      ) : (
        <p className={styles.hint}>
          Es el tramo que la agenda reparte: la barra del día va de una hora a la otra.
        </p>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {updateMutation.isError ? (
        <Alert variant="danger">
          No pudimos guardar tu horario. Revisa la conexión y vuelve a intentarlo; lo que pusiste
          sigue aquí.
        </Alert>
      ) : null}

      {savedNow && !updateMutation.isError ? (
        <p className={styles.saved} role="status">
          Guardado.
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button
          type="button"
          onClick={handleSubmit}
          isLoading={updateMutation.isPending}
          disabled={updateMutation.isPending}
        >
          Guardar
        </Button>
      </div>
    </Card>,
  )
}
