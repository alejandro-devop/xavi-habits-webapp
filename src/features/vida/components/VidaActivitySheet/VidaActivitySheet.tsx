import { useState } from 'react'
import { CreateVidaCategoryStep } from '@/features/vida/components/CreateVidaCategoryStep'
import { useCreateActivityMutation, useUpdateActivityMutation } from '@/features/vida/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import type { Activity } from '@/features/vida/types/activity.types'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { FormField } from '@/shared/ui/FormField'
import { Input } from '@/shared/ui/Input'
import { SteppedModal, useModalStep } from '@/shared/ui/SteppedModal'
import styles from './VidaActivitySheet.module.scss'

type VidaActivitySheetProps = {
  open: boolean
  onClose: () => void
  /** `null` o nada, se crea. Con actividad, se edita con sus datos ya puestos. */
  activity?: Activity | null
}

/**
 * La hoja de crear y editar una actividad. Dos campos y los dos obligatorios:
 * cómo la llamas y a qué categoría pertenece —la categoría es quien le da el
 * icono y el color a la tarjeta—.
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
 * Lo que **no** trae esta tajada: el interruptor «ponerla en mi plantilla» con
 * sus siete días (tajada 3) y «archivar» (tajada 4). La duración típica no
 * llega nunca: no hay dónde guardarla (D2).
 */
export function VidaActivitySheet({ open, onClose, activity = null }: VidaActivitySheetProps) {
  const isEditing = Boolean(activity)
  const { data: categories = [] } = useActivityCategoriesQuery()
  const createMutation = useCreateActivityMutation()
  const updateMutation = useUpdateActivityMutation()

  // Parte de cero al crear y de lo que ya tiene la actividad al editar. No hay
  // ningún efecto que sincronice esto: quien abre la hoja la monta con una
  // `key` nueva, así que cada apertura empieza limpia —incluido el estado de
  // error de las mutaciones—. Un `useEffect` que copiara las props al estado
  // sería una cascada de renders y el linter del repositorio la marca.
  const [name, setName] = useState(activity?.title ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(activity?.categoryId ?? null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const isMutating = createMutation.isPending || updateMutation.isPending
  const hasFailed = createMutation.isError || updateMutation.isError

  function handleSubmit() {
    const trimmed = name.trim()
    const missingName = !trimmed
    const missingCategory = !categoryId

    setNameError(missingName ? 'Ponle un nombre: es cómo la vas a reconocer.' : null)
    setCategoryError(missingCategory ? 'Elige una categoría: le da el icono y el color.' : null)
    // Nada sale hacia la API si falta alguno de los dos (criterio 12).
    if (missingName || missingCategory) return

    if (activity) {
      updateMutation.mutate(
        { id: activity.id, title: trimmed, categoryId },
        { onSuccess: onClose },
      )
      return
    }
    createMutation.mutate({ title: trimmed, categoryId }, { onSuccess: onClose })
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
        disabled={isMutating}
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
          {categoryError ? (
            <p className={styles.error} role="alert">
              {categoryError}
            </p>
          ) : null}
        </div>

        {hasFailed ? (
          <Alert variant="danger">
            {isEditing
              ? 'No pudimos guardar los cambios. Revisa la conexión y vuelve a intentarlo; lo que escribiste sigue aquí.'
              : 'No pudimos crear la actividad. Revisa la conexión y vuelve a intentarlo; lo que escribiste sigue aquí.'}
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
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
