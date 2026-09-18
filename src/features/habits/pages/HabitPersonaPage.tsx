import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CreateHabitPurposeStep } from '@/features/habits/components/CreateHabitPurposeStep'
import { HabitTraitCard } from '@/features/habits/components/HabitTraitCard'
import { useHabitIdentityClaim } from '@/features/habits/hooks/useHabitIdentityClaim'
import {
  useHabitFollowUpsInDatesQuery,
  useHabitsQuery,
  useUpdateHabitMutation,
} from '@/features/habits/hooks/useHabits'
import {
  useHabitPurposesQuery,
  useRemoveHabitPurposeMutation,
} from '@/features/habits/hooks/useHabitPurposes'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import {
  getDismissedSuggestionIds,
  useHabitIdentityStore,
} from '@/features/habits/store/habit-identity.store'
import type { Habit } from '@/features/habits/types/habit.types'
import { getIdentitySuggestions } from '@/features/habits/data/identity-suggestions'
import { parseIntention } from '@/features/habits/utils/habit-form.utils'
import {
  buildPersonaView,
  composeTraitProgressLine,
  formatEvidenceSentence,
  PORTRAIT_HONEST_LINE,
  readPurposeDescription,
  type HabitMilestoneKind,
} from '@/features/habits/utils/habit-identity.utils'
import { addDaysToString, getTodayString } from '@/features/habits/utils/habit-type.utils'
import { buildFollowUpsByHabit } from '@/features/habits/utils/habit-stats.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Select } from '@/shared/ui/Select'
import { Skeleton } from '@/shared/ui/Skeleton'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import styles from './HabitPersonaPage.module.scss'

/** Ventana con la que se mide el cumplimiento reciente de los compromisos. */
const COMMITMENT_WINDOW_DAYS = 30
/** Ventana corta del estado «en camino». */
const WAYTO_WINDOW_DAYS = 7

export function HabitPersonaPage() {
  const today = getTodayString()
  const windowStart = addDaysToString(today, -(COMMITMENT_WINDOW_DAYS - 1))
  const waytoStart = addDaysToString(today, -(WAYTO_WINDOW_DAYS - 1))

  const purposesQuery = useHabitPurposesQuery()
  const habitsQuery = useHabitsQuery({ isActive: true })
  const followUpsQuery = useHabitFollowUpsInDatesQuery(windowStart, today)

  const dismissedSuggestions = useHabitIdentityStore((state) => state.dismissedSuggestions)
  const dismissSuggestion = useHabitIdentityStore((state) => state.dismissSuggestion)

  const claim = useHabitIdentityClaim()
  const updateHabit = useUpdateHabitMutation()
  const removePurpose = useRemoveHabitPurposeMutation()
  const { confirm } = useConfirmDialog()

  const [showOrphans, setShowOrphans] = useState(false)
  const [isWritingPurpose, setIsWritingPurpose] = useState(false)

  const purposes = useMemo(() => purposesQuery.data ?? [], [purposesQuery.data])
  const habits = useMemo(() => habitsQuery.data?.habits ?? [], [habitsQuery.data])

  const followUpsByHabit = useMemo(
    () => buildFollowUpsByHabit(followUpsQuery.data),
    [followUpsQuery.data],
  )

  /** Días cumplidos por hábito dentro de una ventana. Cliente puro. */
  const countAccomplished = useMemo(() => {
    return (habitId: string, from: string): number => {
      const byDate = followUpsByHabit.get(habitId)
      if (!byDate) return 0
      let total = 0
      for (const followUp of byDate.values()) {
        if (followUp.date < from) continue
        if (followUp.isAccomplished || followUp.isLifeline) total += 1
      }
      return total
    }
  }, [followUpsByHabit])

  const persona = useMemo(
    () =>
      buildPersonaView({
        habits,
        purposes,
        accomplishedLastWeek: new Map(
          habits.map((habit) => [habit.id, countAccomplished(habit.id, waytoStart)]),
        ),
        today,
      }),
    [habits, purposes, countAccomplished, waytoStart, today],
  )

  const commitments = useMemo(
    () =>
      habits
        .filter((habit) => !habit.shouldAvoid)
        .map((habit) => ({
          habit,
          intention: parseIntention(habit.description),
          done: countAccomplished(habit.id, windowStart),
        })),
    [habits, countAccomplished, windowStart],
  )

  const isLoading = purposesQuery.isLoading || habitsQuery.isLoading
  const isError = purposesQuery.isError || habitsQuery.isError

  function handleConfirmTrait(habit: Habit, milestone: HabitMilestoneKind) {
    const suggestion = suggestFor(habit)
    claim.mutate({ habit, milestone, name: suggestion.name, icon: suggestion.icon, today })
  }

  function suggestFor(habit: Habit) {
    return getIdentitySuggestions({
      habitName: habit.name,
      categoryName: habit.category?.name,
      shouldAvoid: habit.shouldAvoid,
      excludeIds: getDismissedSuggestionIds(dismissedSuggestions, habit.id),
    })[0]
  }

  async function handleRemovePurpose(id: string, name: string) {
    const ok = await confirm({
      title: 'Eliminar propósito',
      description: `¿Eliminar "${name}"? Se borra el texto que escribiste.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return
    removePurpose.mutate(id)
  }

  const header = (
    <header className={styles.head}>
      <p className={styles.eyebrow}>Mi Persona</p>
      <h1 className={styles.title}>Esto es lo que dicen tus registros</h1>
      <p className={styles.lead}>
        No lo escribiste tú en un formulario: lo escribieron tus registros. Confirma lo que te suene
        verdad y descarta lo que no.
      </p>
    </header>
  )

  if (isLoading) {
    return (
      <div className={styles.root}>
        {header}
        <div className={styles.traits} aria-busy="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} height={172} radius="1.375rem" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    const error = purposesQuery.error ?? habitsQuery.error
    return (
      <div className={styles.root}>
        {header}
        <Alert variant="danger" title="No pudimos componer tu retrato">
          <p className={styles.errorText}>
            {error instanceof Error ? error.message : 'Revisa tu conexión e inténtalo otra vez.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void purposesQuery.refetch()
              void habitsQuery.refetch()
            }}
          >
            Reintentar
          </Button>
        </Alert>
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <div className={styles.root}>
        {header}
        <EmptyState
          title="Todavía no hay registros que leer"
          description="Marca un hábito unos días y esta pantalla empezará a decirte quién eres."
          action={<Button to={habitsPaths.myDay}>Ir a Mi Día</Button>}
        />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {header}

      {/* 1 · El retrato */}
      <section className={styles.portrait} aria-label="Tu retrato">
        {persona.portrait ? (
          <>
            <p className={styles.portraitLead}>{persona.portrait.lead}</p>
            <p className={styles.portraitSupport}>{persona.portrait.support}</p>
            <p className={styles.portraitSource}>
              <AppIcon name="chart-line" size="2xs" decorative />
              {persona.portrait.source}
            </p>
          </>
        ) : (
          <p className={styles.portraitHonest}>{PORTRAIT_HONEST_LINE}</p>
        )}
      </section>

      {/* 2 · Rasgos */}
      <p className={styles.section}>Rasgos</p>
      <div className={styles.traits}>
        {persona.won.map(({ purpose, habit, note }) => (
          <HabitTraitCard
            key={purpose.id}
            state="won"
            name={purpose.name}
            icon={purpose.icon}
            evidence={formatEvidenceSentence(note.evidence)}
            freeText={note.freeText}
            chips={[
              { icon: habit.icon, label: habit.name },
              { label: habit.shouldAvoid ? `${habit.streak} sin caer` : `racha ${habit.streak}` },
            ]}
          />
        ))}

        {persona.claimable.map(({ habit, milestone }) => {
          const suggestion = suggestFor(habit)
          return (
            <HabitTraitCard
              key={habit.id}
              state="proposed"
              name={suggestion.name}
              icon={suggestion.icon}
              evidence={`Llevas ${habit.streak} días seguidos con ${habit.name}. La app te lo propone; tú decides si es verdad.`}
              chips={[{ icon: habit.icon, label: habit.name }]}
              isBusy={claim.isPending}
              onConfirm={() => handleConfirmTrait(habit, milestone)}
              onDismiss={() => dismissSuggestion(habit.id, suggestion.id)}
            />
          )
        })}

        {persona.wayto.map(({ habit, progress }) => (
          <HabitTraitCard
            key={habit.id}
            state="wayto"
            name={suggestFor(habit).name}
            icon={suggestFor(habit).icon}
            evidence={composeTraitProgressLine(progress)}
            progress={progress}
            chips={[{ icon: habit.icon, label: habit.name }]}
          />
        ))}
      </div>

      {/* 3 · Mis compromisos */}
      <p className={styles.section}>Mis compromisos</p>
      <div className={styles.commitments}>
        {commitments.map(({ habit, intention, done }) => (
          <div
            key={habit.id}
            className={[styles.commitment, intention ? '' : styles.commitmentMuted]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={styles.capsule}>
              <AppIcon name={habit.icon ?? 'seedling'} size="sm" decorative />
            </span>
            <div className={styles.commitmentText}>
              {intention ? (
                <>
                  <p className={styles.commitmentSentence}>
                    {intention.anchor ? (
                      <>
                        Cuando <strong>{intention.anchor}</strong>, haré{' '}
                      </>
                    ) : (
                      'Haré '
                    )}
                    <strong>{intention.action}</strong>
                    {intention.place ? (
                      <>
                        {' '}
                        en <strong>{intention.place}</strong>
                      </>
                    ) : null}
                    .
                  </p>
                  <p className={styles.commitmentHint}>
                    Cumplido {done} de los últimos {COMMITMENT_WINDOW_DAYS} días
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.commitmentSentence}>
                    {habit.name} todavía no tiene un momento fijo del día.
                  </p>
                  <p className={styles.commitmentHint}>
                    Los hábitos con un ancla concreta se cumplen mucho más
                  </p>
                </>
              )}
            </div>
            <Link className={styles.link} to={habitsPaths.edit(habit.id)}>
              {intention ? 'Editar' : 'Ponerle uno'}
            </Link>
          </div>
        ))}
      </div>

      {/* 4 · Lo que dejo atrás */}
      {persona.avoidHabits.length > 0 ? (
        <>
          <p className={styles.section}>Lo que dejo atrás</p>
          <div className={styles.commitments}>
            {persona.avoidHabits.map((habit) => (
              <div key={habit.id} className={styles.commitment}>
                <span className={styles.capsule}>
                  <AppIcon name={habit.icon ?? 'seedling'} size="sm" decorative />
                </span>
                <div className={styles.commitmentText}>
                  <p className={styles.commitmentSentence}>{habit.name}</p>
                  <p className={styles.commitmentHint}>
                    <strong>{habit.streak} días</strong> sin caer · tu mejor marca{' '}
                    {habit.maxStreak > 0 ? `fueron ${habit.maxStreak}` : 'está por llegar'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* 5 · Al pie, discreto */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          {persona.orphanPurposes.length > 0
            ? `Tienes ${persona.orphanPurposes.length} propósito${
                persona.orphanPurposes.length === 1 ? ' que escribiste' : 's que escribiste'
              } antes y ningún hábito ha llegado a ganar.`
            : 'Todos tus propósitos están sostenidos por un hábito.'}
        </span>
        {persona.orphanPurposes.length > 0 ? (
          <button
            type="button"
            className={styles.link}
            onClick={() => setShowOrphans((value) => !value)}
            aria-expanded={showOrphans}
          >
            {showOrphans ? 'Ocultarlos' : 'Verlos'}
          </button>
        ) : null}
        <button
          type="button"
          className={styles.link}
          onClick={() => setIsWritingPurpose(true)}
        >
          Escribir un propósito a mano
        </button>
      </div>

      {showOrphans ? (
        <div className={styles.orphans}>
          {persona.orphanPurposes.map((purpose) => {
            const note = readPurposeDescription(purpose.description)
            return (
              <div key={purpose.id} className={styles.orphan}>
                <div className={styles.commitmentText}>
                  <p className={styles.commitmentSentence}>
                    {purpose.icon ? <AppIcon name={purpose.icon} size="xs" decorative /> : null}{' '}
                    {purpose.name}
                  </p>
                  {note.freeText ? (
                    <p className={styles.orphanText}>{note.freeText}</p>
                  ) : null}
                </div>

                <div className={styles.orphanSelect}>
                  <Select
                    id={`link-${purpose.id}`}
                    label="Enlazar a un hábito"
                    placeholder="Elegir hábito…"
                    value=""
                    disabled={updateHabit.isPending}
                    options={habits
                      .filter((habit) => habit.purposeId == null)
                      .map((habit) => ({ value: habit.id, label: habit.name }))}
                    onChange={(habitId) => {
                      if (!habitId) return
                      updateHabit.mutate({ id: habitId, purposeId: purpose.id })
                    }}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleRemovePurpose(purpose.id, purpose.name)}
                  disabled={removePurpose.isPending}
                >
                  Eliminar
                </Button>
              </div>
            )
          })}
        </div>
      ) : null}

      <SteppedModal
        open={isWritingPurpose}
        onClose={() => setIsWritingPurpose(false)}
        title="Escribir un propósito"
        description="La salida de emergencia: si ya sabes quién quieres ser, escríbelo tú."
        ds="aura"
        size="md"
        mobileSheet
      >
        <CreateHabitPurposeStep placement="want" onCreated={() => setIsWritingPurpose(false)} />
      </SteppedModal>
    </div>
  )
}
