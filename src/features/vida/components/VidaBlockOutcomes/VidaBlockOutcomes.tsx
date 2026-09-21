import { useState } from 'react'
import styles from './VidaBlockOutcomes.module.scss'

export type VidaBlockOutcomesProps = {
  /** El nombre del bloque: es lo que nombran los rótulos accesibles. */
  title: string
  /** **«Lo hice»**: registra la sesión con lo planeado (criterio 41). */
  onDid: () => void
  /** **«Hice otra cosa»**: abre la hoja de «qué» en el rato del bloque (criterio 42). */
  onDidSomethingElse: () => void
  /** **«No se pudo»**, con razón o sin ella (criterio 43). Se guarda en el aparato. */
  onCouldNot: (reason: string | null) => void
  /** Quita la nota: el bloque vuelve a estar solo sin hacer. */
  onClearCouldNot: () => void
  /** Ya se dijo «No se pudo» en este aparato. */
  couldNot?: boolean
  /** La razón guardada, si se contó. */
  reason?: string | null
  /** Una mutación en vuelo: los tres se inhabilitan a la vez. */
  isBusy?: boolean
}

/** Una razón es una línea corta, no un diario: lo que cabe bajo un bloque. */
const REASON_MAX_LENGTH = 160

/**
 * **Las tres salidas de un bloque que no se hizo** (D7, criterios 40 a 45).
 *
 * Las tres **pesan lo mismo**: mismo tamaño, mismo tono, mismo tipo de control
 * y ninguna es la principal. Es literal del criterio 40 y es lo que pidió el
 * usuario al ampliar D7 — no hay una salida «buena» («Lo hice») y dos de
 * consolación. **Ninguna es obligatoria**: dejar el bloque sin hacer y sin
 * explicación también es una respuesta, y por eso esto no bloquea nada.
 *
 * - **«Lo hice»** crea la sesión con la hora y la duración planeadas. Se puede
 *   **deshacer** desde el «···» del bloque, que es donde vive «Quitar del
 *   registro» (criterio 41).
 * - **«Hice otra cosa»** abre la hoja de «qué» con el rato del bloque ya puesto
 *   (criterio 42). El bloque no se borra ni se reescribe: queda no hecho y
 *   **explicado**.
 * - **«No se pudo»** marca el bloque al instante —sin pedir nada— y **ofrece**
 *   contar qué pasó. No contarlo es una respuesta válida (criterio 43), y lo
 *   que se cuente se puede cambiar o quitar después.
 *
 * **Dónde vive la razón:** en este aparato (criterio 44). El API no tiene campo
 * para ella y **no se le inventa uno**, ni se mete en las notas de otra sesión.
 * Está dicho en pantalla, en una línea discreta dentro del editor, cada vez que
 * se escribe: es donde importa y no nagea desde fuera.
 *
 * El vocabulario es el de Vida: aquí no se «cancela» ni se «elimina» nada, y
 * «No se pudo» describe un día, no juzga a nadie.
 */
export function VidaBlockOutcomes({
  title,
  onDid,
  onDidSomethingElse,
  onCouldNot,
  onClearCouldNot,
  couldNot = false,
  reason = null,
  isBusy = false,
}: VidaBlockOutcomesProps) {
  const [isWriting, setIsWriting] = useState(false)
  const [draft, setDraft] = useState(reason ?? '')

  function handleCouldNot() {
    // Marca primero y pregunta después: el bloque ya queda explicado aunque
    // nadie escriba nada (criterio 43).
    onCouldNot(reason)
    setDraft(reason ?? '')
    setIsWriting(true)
  }

  function saveReason() {
    onCouldNot(draft.trim() ? draft : null)
    setIsWriting(false)
  }

  return (
    <div className={styles.root}>
      <div className={styles.actions} role="group" aria-label={`Qué pasó con ${title}`}>
        <button
          type="button"
          className={styles.outcome}
          disabled={isBusy}
          onClick={onDid}
        >
          Lo hice
        </button>
        <button
          type="button"
          className={styles.outcome}
          disabled={isBusy}
          onClick={onDidSomethingElse}
        >
          Hice otra cosa
        </button>
        <button
          type="button"
          className={styles.outcome}
          data-chosen={couldNot ? '' : undefined}
          aria-pressed={couldNot}
          disabled={isBusy}
          onClick={handleCouldNot}
        >
          No se pudo
        </button>
      </div>

      {isWriting ? (
        <div className={styles.reason}>
          <label className={styles.reasonLabel} htmlFor={`vida-reason-${title}`}>
            Si quieres, cuenta qué pasó
          </label>
          <input
            id={`vida-reason-${title}`}
            className={styles.reasonInput}
            type="text"
            value={draft}
            maxLength={REASON_MAX_LENGTH}
            placeholder="Me quedé dormido"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                saveReason()
              }
            }}
          />
          <div className={styles.reasonActions}>
            <button type="button" className={styles.reasonSave} onClick={saveReason}>
              Guardar
            </button>
            <button
              type="button"
              className={styles.reasonSkip}
              onClick={() => setIsWriting(false)}
            >
              Dejarlo sin razón
            </button>
          </div>
          {/* Criterio 44: se dice, no se esconde. */}
          <p className={styles.deviceNote}>Esta nota se queda en este dispositivo.</p>
        </div>
      ) : couldNot ? (
        <div className={styles.reasonActions}>
          <button
            type="button"
            className={styles.reasonSkip}
            onClick={() => {
              setDraft(reason ?? '')
              setIsWriting(true)
            }}
          >
            {reason ? 'Cambiar lo que pasó' : 'Contar qué pasó'}
          </button>
          <button type="button" className={styles.reasonSkip} onClick={onClearCouldNot}>
            Quitar la nota
          </button>
        </div>
      ) : null}
    </div>
  )
}
