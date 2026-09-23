import { useMemo, useState } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useUpdateUserSettingsMutation } from '@/features/settings/hooks/useUserSettings'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useSetVidaGoalDaysMutation } from '@/features/vida/hooks/useVidaGoals'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import { isEndAfterStart, isValidHhMm } from '@/features/vida/utils/vida-time.utils'
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

  function shell(children: React.ReactNode) {
    return (
      <div className={styles.root}>
        <PageHeader
          title="Ajustes de Vida"
          subtitle="A qué hora empieza y termina tu día."
          actions={
            <Button variant="ghost" size="sm" to={vidaPaths.hoy}>
              ← A Hoy
            </Button>
          }
        />
        {children}
        {goalsSection()}
      </div>
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
