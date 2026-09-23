import { useState } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import styles from './VidaNoteSheet.module.scss'

/** Una línea, no un diario: el tope del render 19. */
export const VIDA_NOTE_MAX_LENGTH = 140

type VidaNoteSheetProps = {
  open: boolean
  onClose: () => void
  /** La **pregunta**: «¿Qué hiciste?» o «¿Qué estás haciendo?» (criterio 532). */
  title: string
  /** De qué rato hablamos: actividad y hora. */
  subtitle?: string
  initialValue: string
  maxLength?: number
  /** «Lo de otras veces», de un toque (tajada 2). */
  suggestions?: string[]
  /** Con la consulta en vuelo no se pinta la sección de píldoras (criterio 547). */
  isSuggestionsPending?: boolean
  /**
   * Guarda. **Resuelve, no lanza** (el molde de `VidaFinishSessionModal`): si
   * falla, la hoja se queda abierta con lo escrito y el fallo se lee dentro.
   * Recibe `null` cuando el campo se deja vacío: eso **borra** la nota.
   */
  onSave: (notes: string | null) => Promise<{ ok: boolean; message?: string }> | void
}

/**
 * **El editor de la nota, uno para los cuatro momentos**: la fila del día, la
 * sesión en marcha, antes de empezar y —cuando llegue— la propuesta de la
 * plantilla.
 *
 * **Molde: `VidaFinishSessionModal`** (`SteppedModal` con `ds="aura"`,
 * `mobileSheet`, `size="md"`, el estado local aquí dentro, una `key` por
 * apertura que pone quien la monta y el fallo leído dentro sin perder lo
 * escrito).
 *
 * **No muta nada**: recibe `onSave`. Por eso el mismo componente sirve también
 * **antes de empezar**, cuando todavía no hay ninguna sesión que editar.
 *
 * ## Una nota más larga que el tope: ni se trunca ni se pierde
 *
 * Las dos cajas que ya existen (`VidaFinishSessionModal`, `VidaLogSessionSheet`)
 * guardan hasta 2000 caracteres, y esta hoja pide una línea de 140. Unificarlas
 * es decisión del usuario y está fuera de alcance, así que aquí se resuelve el
 * choque de la forma más honesta que encontramos:
 *
 * - El texto que llega **se pinta entero**. Nunca se corta al abrir.
 * - El tope efectivo del campo es `max(maxLength, lo que ya había)`: una nota
 *   larga **se sigue pudiendo editar** —corregir una palabra en medio, acortar—
 *   en vez de quedarse congelada porque el navegador bloquea toda inserción.
 * - El contador lo dice en voz alta («312 / 140») y una línea explica que cabe
 *   entera. **Guardar manda lo que se ve**: nadie pierde texto sin enterarse.
 */
export function VidaNoteSheet({
  open,
  onClose,
  title,
  subtitle,
  initialValue,
  maxLength = VIDA_NOTE_MAX_LENGTH,
  suggestions,
  isSuggestionsPending = false,
  onSave,
}: VidaNoteSheetProps) {
  const [value, setValue] = useState(initialValue)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // El tope de verdad del campo: lo que pide la feature, o lo que ya había
  // escrito si era más largo. Ver la cabecera.
  const effectiveMax = Math.max(maxLength, initialValue.length)
  const isOverLimit = value.length > maxLength
  const pills = isSuggestionsPending ? [] : (suggestions ?? [])

  async function handleSave() {
    setFormError(null)
    setIsSaving(true)
    const trimmed = value.trim()
    const result = await onSave(trimmed ? trimmed : null)
    setIsSaving(false)
    if (result && !result.ok) {
      setFormError(result.message ?? 'No pudimos guardarlo. Inténtalo otra vez.')
      return
    }
    onClose()
  }

  const footer = (
    <div className={styles.footer}>
      <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
        Volver
      </Button>
      <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={title}
      description={subtitle}
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        <textarea
          className={styles.field}
          value={value}
          rows={2}
          maxLength={effectiveMax}
          disabled={isSaving}
          autoFocus
          placeholder="Ej. Revisando MRs"
          aria-label={title}
          onChange={(event) => setValue(event.target.value)}
        />
        <p className={styles.count} data-over={isOverLimit ? '' : undefined}>
          {value.length} / {maxLength}
        </p>
        {/* Solo cuando de verdad sobra texto de una caja más larga: callarlo
            sería dejar que alguien crea que se ha truncado. */}
        {isOverLimit ? (
          <p className={styles.overNote}>
            Esta la escribiste en una caja más larga. Cabe entera: si la guardas tal cual, no se
            pierde nada.
          </p>
        ) : null}

        {/* «Lo de otras veces» (tajada 2). Sin píldoras **no se pinta nada**:
            ni esqueleto, ni hueco, ni explicación (criterio 547). */}
        {pills.length > 0 ? (
          <section className={styles.pills} aria-label="Lo de otras veces">
            {pills.map((pill) => (
              <button
                key={pill}
                type="button"
                className={styles.pill}
                disabled={isSaving}
                onClick={() => setValue(pill)}
              >
                {pill}
              </button>
            ))}
          </section>
        ) : null}

        {formError ? (
          <Alert variant="danger" title="No pudimos guardarlo">
            <p className={styles.errorText}>{formError}</p>
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
}
