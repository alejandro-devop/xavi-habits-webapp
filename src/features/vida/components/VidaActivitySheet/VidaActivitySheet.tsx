import { useState } from 'react'
import { CreateVidaCategoryStep } from '@/features/vida/components/CreateVidaCategoryStep'
import { VidaDurationPills } from '@/features/vida/components/VidaDurationPills'
import { useCreateActivityMutation, useUpdateActivityMutation } from '@/features/vida/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import { useSaveVidaItemForActivity } from '@/features/vida/hooks/useSaveVidaItemForActivity'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import { normalizeTimeForDisplay } from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import { Switch } from '@/shared/ui/Switch'
import styles from './VidaActivitySheet.module.scss'

type TemplateDraft = {
  inTemplate: boolean
  days: VidaDayOfWeek[]
  /** `HH:mm` o `''` si no tiene hora: es lo que da y toma un `input type="time"`. */
  startTime: string
  /** Minutos, o `null` si no tiene duración. */
  durationMinutes: number | null
}

type VidaActivitySheetProps = {
  open: boolean
  onClose: () => void
  /** `null` o nada, se crea. Con actividad, se edita con sus datos ya puestos. */
  activity?: Activity | null
  /**
   * El `VidaItem` de esa actividad, **activo o desactivado**. La página lo
   * resuelve con un mapa: la hoja no consulta la plantilla por su cuenta.
   * Desactivado sigue importando: es lo que evita crear un segundo `VidaItem`
   * al volver a encender el interruptor (criterios 19 y 20).
   */
  vidaItem?: VidaItem | null
  /**
   * La plantilla todavía viene en camino: `vidaItem` es `null` porque **no se
   * sabe**, no porque no haya. Mientras dure, el bloque de plantilla no se
   * puede tocar y no se puede guardar; y en cuanto llega, lo que se pinta sale
   * de la prop sin que nadie tenga que resincronizar nada.
   */
  isTemplatePending?: boolean
}

/**
 * La hoja de crear y editar una actividad. Dos campos obligatorios —cómo la
 * llamas y a qué categoría pertenece, que es quien le da el icono y el color— y
 * un bloque opcional: ponerla en tu plantilla con los días que suele tocar, **a
 * qué hora y cuánto** (FEAT-003: la plantilla es una agenda, no una bolsa).
 *
 * Se monta con una `key` por apertura (ver `VidaActividadesPage`): así cada vez
 * que se abre parte limpia sin un efecto que copie las props al estado.
 *
 * Imita `HabitCreateWizard`: `SteppedModal` con `ds="aura"` y `mobileSheet`
 * (que es literalmente la hoja inferior del render), el estado del formulario
 * **aquí arriba** para que apilar «+ nueva» no lo borre, y el cierre en el
 * `onSuccess` local del `mutate` y no en el hook: si la mutación falla, la hoja
 * se queda abierta con lo escrito y el fallo se lee dentro (criterio 16). El
 * toast del hook avisa, pero no es lo que sostiene el criterio.
 *
 * Guardar son **dos pasos encadenados**: primero la actividad, después su
 * plantilla —que necesita el id de la actividad, y al crear ese id no existe
 * hasta que vuelve el API—. Si el segundo falla, la hoja no se cierra y lo dice
 * sin mentir: la actividad **sí** quedó guardada.
 *
 * El bloque de plantilla se **deriva** de `vidaItem` hasta que alguien lo toca,
 * y mientras `isTemplatePending` no deja guardar: abrir «Editar» en el hueco en
 * que la plantilla aún viajaba nacía con el interruptor apagado y, al guardar,
 * desactivaba un `VidaItem` que nadie había tocado.
 *
 * Lo que **no** trae: «archivar» (tajada 4). La hora y la duración **sí**
 * llegaron, en FEAT-003: el API las guarda en el `VidaItem` y las dos son
 * opcionales —marcar días sin hora sigue siendo legal y no bloquea el guardado
 * (criterio 5)—.
 */
export function VidaActivitySheet({
  open,
  onClose,
  activity = null,
  vidaItem = null,
  isTemplatePending = false,
}: VidaActivitySheetProps) {
  const isEditing = Boolean(activity)
  const categoriesQuery = useActivityCategoriesQuery()
  const categories = categoriesQuery.data ?? []
  const createMutation = useCreateActivityMutation()
  const updateMutation = useUpdateActivityMutation()
  const templateSave = useSaveVidaItemForActivity()

  // Parte de cero al crear y de lo que ya tiene la actividad al editar. No hay
  // ningún efecto que sincronice esto: quien abre la hoja la monta con una
  // `key` nueva, así que cada apertura empieza limpia —incluido el estado de
  // error de las mutaciones—. Un `useEffect` que copiara las props al estado
  // sería una cascada de renders y el linter del repositorio la marca.
  const [name, setName] = useState(activity?.title ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(activity?.categoryId ?? null)
  // El bloque de plantilla **no copia la prop al estado**: la deriva mientras
  // nadie lo haya tocado. Si la consulta de la plantilla llega después de abrir
  // la hoja —el hueco que la tarjeta ya pintaba—, el interruptor y los días se
  // ponen solos en su sitio; copiarlo en `useState` dejaba la hoja mintiendo y,
  // al guardar, desactivaba un `VidaItem` que nadie tocó.
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null)
  // Encendido solo si la actividad está **de verdad** en la plantilla: un
  // `VidaItem` desactivado es justo lo contrario (criterio 20).
  const inTemplate = templateDraft?.inTemplate ?? Boolean(vidaItem?.isActive)
  const days = templateDraft?.days ?? vidaItem?.days ?? []
  // La hora y la duración se derivan igual que los días: nada de `useEffect`.
  // El API devuelve `HH:mm`, pero normalizamos por si alguna vez trae segundos:
  // un `input type="time"` con `08:00:00` se queda vacío sin decir nada.
  const startTime =
    templateDraft?.startTime ??
    (vidaItem?.startTime ? normalizeTimeForDisplay(vidaItem.startTime) : '')
  const durationMinutes =
    templateDraft !== null ? templateDraft.durationMinutes : (vidaItem?.durationMinutes ?? null)
  // Editando y con la plantilla en vuelo, lo que hay **no se sabe**. Al crear no
  // hay nada que saber: una actividad que no existe no está en ninguna plantilla.
  const templateUnknown = isTemplatePending && isEditing
  const [nameError, setNameError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [daysError, setDaysError] = useState<string | null>(null)
  // Si la actividad se creó y la plantilla falló, el segundo intento **no**
  // puede crear otra actividad. Se recuerda la que nació y se la trata como si
  // hubiera llegado por props: el reintento la edita y vuelve a por la plantilla.
  const [createdActivity, setCreatedActivity] = useState<Activity | null>(null)

  const isMutating =
    createMutation.isPending || updateMutation.isPending || templateSave.isPending
  const activityFailed = createMutation.isError || updateMutation.isError
  const templateFailed = templateSave.isError

  /** Un solo sitio donde nace el borrador: los cuatro campos, siempre juntos. */
  function patchTemplate(patch: Partial<TemplateDraft>) {
    setTemplateDraft({ inTemplate, days, startTime, durationMinutes, ...patch })
  }

  function toggleDay(day: VidaDayOfWeek) {
    setDaysError(null)
    const next = days.includes(day) ? days.filter((other) => other !== day) : [...days, day]
    patchTemplate({ days: next })
  }

  function toggleTemplate(checked: boolean) {
    setDaysError(null)
    patchTemplate({ inTemplate: checked })
  }

  function saveTemplateFor(target: Activity) {
    templateSave.save(
      {
        activityId: target.id,
        item: vidaItem,
        inTemplate,
        days,
        // Vacío es «no tiene hora», no un error: el hook ya lo entiende así.
        startTime: startTime || null,
        durationMinutes,
      },
      { onSuccess: onClose },
    )
  }

  function handleSubmit() {
    // Con la plantilla en vuelo no se guarda: lo que saliera de aquí sería una
    // decisión tomada sobre datos que todavía no han llegado.
    if (templateUnknown) return

    const trimmed = name.trim()
    const missingName = !trimmed
    const missingCategory = !categoryId
    // Encendido y sin ningún día no se guarda nada: ni la actividad (criterio 18).
    const missingDays = inTemplate && days.length === 0

    setNameError(missingName ? 'Ponle un nombre: es cómo la vas a reconocer.' : null)
    setCategoryError(missingCategory ? 'Elige una categoría: le da el icono y el color.' : null)
    setDaysError(missingDays ? 'Marca al menos un día, o apaga el interruptor.' : null)
    // Nada sale hacia la API si falta alguno de los tres (criterios 12 y 18).
    if (missingName || missingCategory || missingDays) return

    const existing = activity ?? createdActivity
    if (existing) {
      updateMutation.mutate(
        { id: existing.id, title: trimmed, categoryId },
        { onSuccess: () => saveTemplateFor(existing) },
      )
      return
    }
    createMutation.mutate(
      { title: trimmed, categoryId },
      {
        onSuccess: (created) => {
          setCreatedActivity(created)
          saveTemplateFor(created)
        },
      },
    )
  }

  const footer = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={onClose} disabled={isMutating}>
        Cancelar
      </Button>
      <Button
        type="button"
        className={styles.submit}
        onClick={handleSubmit}
        isLoading={isMutating}
        disabled={isMutating || templateUnknown}
      >
        {isEditing ? 'Guardar' : 'Crear'}
      </Button>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar actividad' : 'Nueva actividad'}
      description="Dos cosas: cómo la llamas y a qué categoría pertenece."
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        <FormField id="vida-activity-name" label="Cómo la llamas" error={nameError}>
          <Input
            id="vida-activity-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (nameError) setNameError(null)
            }}
            placeholder="Ej. Regar las plantas"
            disabled={isMutating}
            autoFocus
          />
        </FormField>

        <div className={styles.field}>
          <span className={styles.label} id="vida-activity-category-label">
            Categoría <span className={styles.labelHint}>· le da el icono y el color</span>
          </span>
          <div
            className={styles.options}
            role="group"
            aria-labelledby="vida-activity-category-label"
          >
            {categoriesQuery.isPending && categoriesQuery.fetchStatus !== 'idle' ? (
              // Cargando de verdad: tres píldoras fantasma. Sin esto, una hoja
              // que aparece con solo «+ nueva» parece una hoja rota.
              <span className={styles.optionsLoading} aria-busy="true" aria-live="polite">
                <span className={styles.srOnly}>Cargando tus categorías…</span>
                {[0, 1, 2].map((pill) => (
                  <Skeleton key={pill} width={84} height={30} radius="999px" />
                ))}
              </span>
            ) : null}

            {categories.map((category) => {
              const isSelected = category.id === categoryId
              return (
                <button
                  key={category.id}
                  type="button"
                  className={[styles.option, isSelected ? styles.optionOn : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={isSelected}
                  disabled={isMutating}
                  onClick={() => {
                    setCategoryId(category.id)
                    setCategoryError(null)
                  }}
                >
                  <AppIcon name={category.icon ?? 'circle-dot'} size="2xs" decorative />
                  {category.name}
                </button>
              )
            })}

            <NewVidaCategoryButton
              disabled={isMutating}
              onCreated={(id) => {
                setCategoryId(id)
                setCategoryError(null)
              }}
            />
          </div>

          <CategoriesHint query={categoriesQuery} hasCategories={categories.length > 0} />

          {categoryError ? (
            <p className={styles.error} role="alert">
              {categoryError}
            </p>
          ) : null}
        </div>

        <div className={styles.template}>
          {templateUnknown ? (
            <div className={styles.templateLoading} aria-busy="true" aria-live="polite">
              <Skeleton width={34} height={20} radius="999px" />
              <p className={styles.hint}>Mirando si ya está en tu plantilla…</p>
            </div>
          ) : (
            <Switch
              id="vida-activity-template"
              label="Ponerla en mi plantilla"
              description="Los días que suele tocar. Se cambia luego en Plantilla."
              checked={inTemplate}
              disabled={isMutating}
              onChange={(event) => toggleTemplate(event.target.checked)}
            />
          )}

          {inTemplate && !templateUnknown ? (
            <>
              <div
                className={styles.days}
                role="group"
                aria-label="Días de la plantilla"
              >
                {VIDA_DAY_ORDER.map((day) => {
                  const isOn = days.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      className={[styles.day, isOn ? styles.dayOn : ''].filter(Boolean).join(' ')}
                      aria-pressed={isOn}
                      aria-label={VIDA_DAY_LABELS[day]}
                      disabled={isMutating}
                      onClick={() => toggleDay(day)}
                    >
                      <span aria-hidden>{VIDA_DAY_SHORT_LABELS[day]}</span>
                    </button>
                  )
                })}
              </div>
              {daysError ? (
                <p className={styles.error} role="alert">
                  {daysError}
                </p>
              ) : null}

              {/* «A esta hora hago esto, este tiempo»: las dos son opcionales y
                  guardar sin ellas no se bloquea (criterio 5). */}
              <div className={styles.schedule}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="vida-activity-start-time">
                    A qué hora <span className={styles.labelHint}>· opcional</span>
                  </label>
                  <Input
                    id="vida-activity-start-time"
                    type="time"
                    value={startTime}
                    disabled={isMutating}
                    onChange={(event) => patchTemplate({ startTime: event.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <span className={styles.label} id="vida-activity-duration-label">
                    Cuánto <span className={styles.labelHint}>· opcional, en minutos</span>
                  </span>
                  <VidaDurationPills
                    label="Cuánto dura"
                    value={durationMinutes}
                    disabled={isMutating}
                    onChange={(minutes) => patchTemplate({ durationMinutes: minutes })}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {activityFailed || templateFailed ? (
          <Alert variant="danger">
            {templateFailed
              ? isEditing || createdActivity
                ? 'Guardamos la actividad, pero no pudimos poner los días en tu plantilla. Vuelve a intentarlo; lo que marcaste sigue aquí.'
                : 'No pudimos guardar los días en tu plantilla. Vuelve a intentarlo; lo que marcaste sigue aquí.'
              : isEditing
                ? 'No pudimos guardar los cambios. Revisa la conexión y vuelve a intentarlo; lo que escribiste sigue aquí.'
                : 'No pudimos crear la actividad. Revisa la conexión y vuelve a intentarlo; lo que escribiste sigue aquí.'}
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
}

type CategoriesHintProps = {
  query: ReturnType<typeof useActivityCategoriesQuery>
  hasCategories: boolean
}

/**
 * Cargando, sin sesión, error y vacío **se ven distintos** dentro de la hoja.
 * Antes los cuatro se leían igual —la etiqueta y solo «+ nueva»—, que es el
 * agujero que dejó anotado el revisor de la tajada 2. La salida siempre existe:
 * «+ nueva» sigue ahí en los cuatro casos.
 */
function CategoriesHint({ query, hasCategories }: CategoriesHintProps) {
  // Sin sesión la consulta queda deshabilitada: `isPending` con
  // `fetchStatus: 'idle'`. Mirar solo `isPending` sería un esqueleto eterno.
  if (query.isPending && query.fetchStatus === 'idle') {
    return <p className={styles.hint}>Entra en tu cuenta para ver tus categorías.</p>
  }
  if (query.isPending) return null
  if (query.isError) {
    return (
      <p className={styles.hint} role="alert">
        No pudimos cargar tus categorías.{' '}
        <button type="button" className={styles.hintAction} onClick={() => void query.refetch()}>
          Reintentar
        </button>
      </p>
    )
  }
  if (!hasCategories) {
    return <p className={styles.hint}>Todavía no tienes ninguna: créala con «+ nueva».</p>
  }
  return null
}

type NewVidaCategoryButtonProps = {
  disabled: boolean
  onCreated: (categoryId: string) => void
}

/**
 * Tiene que renderizarse **dentro** del `SteppedModal`: lee el contexto de
 * pasos para apilar el formulario de categoría al vuelo, igual que
 * `NewCategoryButton` en hábitos.
 */
function NewVidaCategoryButton({ disabled, onCreated }: NewVidaCategoryButtonProps) {
  const { push } = useModalStep()

  return (
    <button
      type="button"
      className={[styles.option, styles.optionNew].join(' ')}
      disabled={disabled}
      onClick={() =>
        push({
          title: 'Nueva categoría',
          description: 'Le pone el icono y el color a todo lo que metas dentro.',
          content: <CreateVidaCategoryStep onCreated={onCreated} />,
        })
      }
    >
      + nueva
    </button>
  )
}
