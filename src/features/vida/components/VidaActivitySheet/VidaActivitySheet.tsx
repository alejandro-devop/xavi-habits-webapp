import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { CreateVidaCategoryStep } from '@/features/vida/components/CreateVidaCategoryStep'
import { VidaDurationPills } from '@/features/vida/components/VidaDurationPills'
import { VidaPatternAdvice } from '@/features/vida/components/VidaPatternAdvice'
import { useCreateActivityMutation, useUpdateActivityMutation } from '@/features/vida/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import { useSaveVidaItemForActivity } from '@/features/vida/hooks/useSaveVidaItemForActivity'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { ActivityFollowUpActivityRef } from '@/features/vida/types/activity-followup.types'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import {
  buildTemplateSheetAdvice,
  type VidaActivityPattern,
  type VidaPatternSuggestion,
} from '@/features/vida/utils/vida-patterns.utils'
import { describeTemplatePreview } from '@/features/vida/utils/vida-template.utils'
import { normalizeTimeForDisplay } from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import { Switch } from '@/shared/ui/Switch'
import { Textarea } from '@/shared/ui/Textarea'
import styles from './VidaActivitySheet.module.scss'

type TemplateDraft = {
  inTemplate: boolean
  days: VidaDayOfWeek[]
  /** `HH:mm` o `''` si no tiene hora: es lo que da y toma un `input type="time"`. */
  startTime: string
  /** Minutos, o `null` si no tiene duración. */
  durationMinutes: number | null
  /** La nota del ítem, en texto plano. `''` es «no tiene». */
  notes: string
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

  /* ── Todo lo de aquí abajo es **aditivo** (FEAT-005, tajada 2) ────────────
   *
   * Mismo contrato de frontera que `VidaAgendaBlock`: **sin ninguna de estas
   * props la hoja se pinta exactamente como la dejó FEAT-002** —el catálogo no
   * pasa ninguna y no cambia ni un píxel—. Son lo que permite que la plantilla
   * abra **la misma hoja** (criterio 16) en vez de escribir una segunda.
   */

  /**
   * La actividad **como viaja dentro del `VidaItem`** (`id`, `title`, `status`
   * y `category`). No es un `Activity`: **no trae `categoryId`** (decisión A4),
   * y por eso con `lockActivity` la hoja no lo mira.
   */
  activityRef?: ActivityFollowUpActivityRef | null
  /**
   * La actividad **no se edita aquí**: la cabecera enseña nombre, icono y
   * categoría y no los pide (criterio 18), y guardar **se salta la mutación de
   * actividad** —que es lo que necesitaría el `categoryId` que el ítem no
   * trae—. Cambiar nombre o categoría sigue siendo del catálogo.
   */
  lockActivity?: boolean
  /** Con ella se pinta «Quitar de la plantilla» (criterio 21). Sin ella, no existe. */
  onRemoveFromTemplate?: (item: VidaItem) => void
  /**
   * La línea del criterio 35 («esta actividad tiene 2 horas en tu plantilla»).
   * La cablea el catálogo en la tajada 3; aquí solo se pinta si llega.
   */
  multipleItemsNote?: string | null

  /* ── El dato de tus semanas (FEAT-007, tajada 4) ─────────────────────────
   *
   * También **aditivo**: sin `pattern` la hoja es **la de FEAT-005, sin una
   * línea de más ni un hueco reservado** (criterio 97). La hoja **no monta la
   * ventana de seis semanas**: la trae `VidaPlantillaPage`, que es quien la
   * tiene; si la montara aquí, abrir una hoja costaría 43 consultas.
   */

  /** El patrón de esta actividad, ya derivado. `null` si no hay datos. */
  pattern?: VidaActivityPattern | null
  /** Lo que ya se contestó, con la fecha en la que la pregunta vuelve (D1). */
  patternAnswerNote?: string | null
  /** «Dejarlo»: no llama a nadie, se guarda en el aparato (criterio 82). */
  onPatternDismiss?: (suggestion: VidaPatternSuggestion) => void
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
  activityRef = null,
  lockActivity = false,
  onRemoveFromTemplate,
  multipleItemsNote = null,
  pattern = null,
  patternAnswerNote = null,
  onPatternDismiss,
}: VidaActivitySheetProps) {
  const isEditing = Boolean(activity) || lockActivity
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
  const notes = templateDraft?.notes ?? vidaItem?.notes ?? ''
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
    setTemplateDraft({ inTemplate, days, startTime, durationMinutes, notes, ...patch })
  }

  /**
   * **El dato de tus semanas, ya escrito** (criterios 95–97). Puro y
   * derivado de la prop: sin patrón es `null` y no se pinta ni un hueco.
   */
  const advice = pattern ? buildTemplateSheetAdvice(pattern) : null
  /**
   * Lo que se acaba de mover **en la hoja**, no en el API: aquí la salida
   * afirmativa **no manda ninguna mutación**, escribe en el borrador y se
   * guarda con «Guardar», como cualquier otro campo. Es lo que sostiene el
   * criterio 96 por construcción —mientras no se pulse, el cuerpo es el
   * mismo— y evita que la hoja y un `vidaItemUpdate` suelto escriban a la vez
   * sobre el mismo ítem con dos versiones de los días.
   */
  const [advicePatched, setAdvicePatched] = useState<string | null>(null)

  function applyAdvice(suggestion: VidaPatternSuggestion) {
    setDaysError(null)
    patchTemplate(
      'days' in suggestion.templatePatch
        ? { days: suggestion.templatePatch.days }
        : 'startTime' in suggestion.templatePatch
          ? { startTime: normalizeTimeForDisplay(suggestion.templatePatch.startTime) }
          : { durationMinutes: suggestion.templatePatch.durationMinutes },
    )
    setAdvicePatched(suggestion.affirmativeLabel)
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

  function saveTemplateFor(target: { id: string }) {
    templateSave.save(
      {
        activityId: target.id,
        // **El ítem sobre el que se escribe** (decisión A3). Desde la plantilla
        // es el que se está editando, por su id; desde el catálogo, el que
        // resolvió `findVidaItemForActivity`. La función es la misma.
        targetItem: vidaItem,
        inTemplate,
        days,
        // Vacío es «no tiene hora», no un error: el hook ya lo entiende así.
        startTime: startTime || null,
        durationMinutes,
        notes,
      },
      { onSuccess: onClose },
    )
  }

  function handleSubmit() {
    // Con la plantilla en vuelo no se guarda: lo que saliera de aquí sería una
    // decisión tomada sobre datos que todavía no han llegado.
    if (templateUnknown) return

    // Encendido y sin ningún día no se guarda nada: ni la actividad (criterio
    // 18 de FEAT-002; criterio 23 de FEAT-005, que es el mismo límite del API
    // dicho en el campo y no con un error del servidor).
    const missingDays = inTemplate && days.length === 0
    setDaysError(
      missingDays
        ? lockActivity
          ? 'Déjale al menos un día, o desactívala con el interruptor.'
          : 'Marca al menos un día, o apaga el interruptor.'
        : null,
    )

    // Con la actividad bloqueada no hay nombre ni categoría que validar: no se
    // piden, no se pintan y no se mandan (decisión A4).
    if (lockActivity) {
      if (missingDays || !activityRef) return
      saveTemplateFor(activityRef)
      return
    }

    const trimmed = name.trim()
    const missingName = !trimmed
    const missingCategory = !categoryId

    setNameError(missingName ? 'Ponle un nombre: es cómo la vas a reconocer.' : null)
    setCategoryError(missingCategory ? 'Elige una categoría: le da el icono y el color.' : null)
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

  // La cabecera de la hoja abierta desde la plantilla: **enseña** el nombre, el
  // icono y la categoría, y no los pide (criterio 18). Todo sale de lo que ya
  // viaja dentro del `VidaItem`: ni una consulta más (decisión A4).
  const lockedCategory = activityRef?.category ?? null
  const lockedTitle = lockActivity ? (activityRef?.title ?? 'Esta actividad') : null
  const lockedSubtitle = lockActivity
    ? `En tu plantilla${lockedCategory?.name ? ` · ${lockedCategory.name}` : ''} · se cambia desde aquí y desde Actividades`
    : undefined
  const preview = describeTemplatePreview({
    days,
    startTime: startTime || null,
    durationMinutes,
  })

  const footer = (
    <div className={styles.footer}>
      {onRemoveFromTemplate && vidaItem ? (
        // La salida de la izquierda **es otra** cuando la hoja se abre desde la
        // plantilla (criterio 21): ahí no se descarta un formulario, se quita un
        // ítem —y quien lo confirma es el diálogo, no este botón—.
        <Button
          type="button"
          variant="ghost"
          className={styles.remove}
          onClick={() => onRemoveFromTemplate(vidaItem)}
          disabled={isMutating}
        >
          Quitar de la plantilla
        </Button>
      ) : (
        <Button type="button" variant="ghost" onClick={onClose} disabled={isMutating}>
          Cancelar
        </Button>
      )}
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
      title={lockedTitle ?? (isEditing ? 'Editar actividad' : 'Nueva actividad')}
      description={
        lockActivity
          ? lockedSubtitle
          : 'Dos cosas: cómo la llamas y a qué categoría pertenece.'
      }
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        {lockActivity ? (
          <div
            className={styles.locked}
            style={
              lockedCategory?.color
                ? ({ '--vida-category-color': lockedCategory.color } as CSSProperties)
                : undefined
            }
          >
            <span className={styles.lockedIcon} aria-hidden>
              <AppIcon
                name={lockedCategory?.icon ?? UNCATEGORIZED_GROUP_ICON}
                size="sm"
                decorative
              />
            </span>
            <span className={styles.lockedCategory}>
              {lockedCategory?.name ?? 'Sin categoría'}
            </span>
          </div>
        ) : null}

        {/* Criterio 35: la línea **con su enlace**, para que cambiar las dos
            horas esté a un toque desde donde se ve el problema. */}
        {multipleItemsNote ? (
          <p className={styles.hint}>
            {multipleItemsNote}{' '}
            <Link className={styles.hintLink} to={vidaPaths.plantilla}>
              Ir a Plantilla
            </Link>
          </p>
        ) : null}

        {lockActivity ? null : (
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
        )}

        {lockActivity ? null : (
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
        )}

        <div className={styles.template}>
          {templateUnknown ? (
            <div className={styles.templateLoading} aria-busy="true" aria-live="polite">
              <Skeleton width={34} height={20} radius="999px" />
              <p className={styles.hint}>Mirando si ya está en tu plantilla…</p>
            </div>
          ) : (
            <Switch
              id="vida-activity-template"
              // Desde la plantilla el ítem **ya está**: lo que el interruptor
              // decide es si sale en Hoy (criterio 19), y eso es lo que dice.
              // Desde el catálogo sigue diciendo lo de FEAT-002, palabra por
              // palabra.
              label={lockActivity ? 'Activa en mi plantilla' : 'Ponerla en mi plantilla'}
              description={
                lockActivity
                  ? 'Desactivada se queda aquí guardada con sus días y su hora, y deja de salir en Hoy.'
                  : 'Los días que suele tocar. Se cambia luego en Plantilla.'
              }
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
                  // **Marcado no es tocado** (criterio 96): el día del que
                  // habla el aviso se señala y nada más; la plantilla se queda
                  // exactamente como está hasta que se pulse la salida.
                  const isFlagged = advice?.flaggedDay === day && isOn
                  return (
                    <button
                      key={day}
                      type="button"
                      className={[
                        styles.day,
                        isOn ? styles.dayOn : '',
                        isFlagged ? styles.dayFlagged : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={isOn}
                      aria-label={
                        isFlagged
                          ? `${VIDA_DAY_LABELS[day]} · el día del que habla el aviso`
                          : VIDA_DAY_LABELS[day]
                      }
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
                  {/* Lo que dicen tus semanas, **debajo del campo del que
                      habla** (criterio 95). Sin patrón no hay línea. */}
                  {advice?.timeText ? (
                    <VidaPatternAdvice
                      eyebrow={advice.header}
                      text={advice.timeText}
                      suggestion={advice.timeSuggestion}
                      note={patternAnswerNote}
                      isSaving={isMutating}
                      onApply={applyAdvice}
                      onDismiss={(suggestion) => onPatternDismiss?.(suggestion)}
                    />
                  ) : null}
                </div>

                <div className={styles.field}>
                  <span className={styles.label} id="vida-activity-duration-label">
                    Cuánto <span className={styles.labelHint}>· opcional</span>
                  </span>
                  <VidaDurationPills
                    label="Cuánto dura"
                    freeInput="hoursAndMinutes"
                    value={durationMinutes}
                    disabled={isMutating}
                    onChange={(minutes) => patchTemplate({ durationMinutes: minutes })}
                  />
                  {/* Esta línea sale **también cuando va bien** (criterio 95):
                      si solo apareciera al desviarse, el dato se leería como
                      una señal de alarma. */}
                  {advice?.durationText ? (
                    advice.durationSuggestion ? (
                      <VidaPatternAdvice
                        eyebrow={advice.header}
                        text={advice.durationText}
                        suggestion={advice.durationSuggestion}
                        isSaving={isMutating}
                        onApply={applyAdvice}
                        onDismiss={(suggestion) => onPatternDismiss?.(suggestion)}
                      />
                    ) : (
                      <p className={styles.patternNote}>{advice.durationText}</p>
                    )
                  ) : null}
                </div>
              </div>

              {/* Lo que se movió aquí **todavía no está guardado**, y se dice:
                  la hoja no escribe nada sola. */}
              {advicePatched ? (
                <p className={styles.patternDone} role="status">
                  «{advicePatched}», hecho aquí. Se guarda cuando pulses <b>Guardar</b>.
                </p>
              ) : null}

              {/* La nota del ítem, **texto plano** (criterio 18 y decisión (e)
                  del analista). Vive en `VidaItem.notes` desde F0 y hasta ahora
                  ninguna pantalla la pedía: lo único que la escribía era el
                  API. */}
              <Textarea
                id="vida-activity-notes"
                className={styles.notesInput}
                label="Nota · opcional, texto plano"
                rows={2}
                value={notes}
                maxLength={280}
                disabled={isMutating}
                placeholder="Ej. Empezar por la cocina"
                onChange={(event) => patchTemplate({ notes: event.target.value })}
              />

              {/* Cómo queda en Hoy (criterio 20), calculado de lo elegido: sin
                  hora o sin duración **dice qué falta** en vez de enseñar un
                  rango que no existe. */}
              <div className={styles.preview}>
                <p className={styles.previewLine}>
                  {preview.complete ? (
                    <>
                      Así queda en <b>Hoy</b>: {preview.daysText}{' '}
                      <b>{preview.rangeText}</b>.
                    </>
                  ) : (
                    preview.text
                  )}{' '}
                  <span className={styles.previewSmall}>
                    Los días que ya tienes armados <b>no se reescriben solos</b>.
                  </span>
                </p>
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
