import { VIDA_NOTE_QUESTION_DONE } from '@/features/vida/utils/vida-notes.utils'
import styles from './VidaNoteLine.module.scss'

type VidaNoteLineProps = {
  /** Lo que se escribió. `null` o en blanco se trata igual: no hay nota. */
  text: string | null
  /**
   * Lo que se lee cuando no hay nota. Sin `text` **y** sin `placeholder` la
   * línea **no pinta nada**: una sesión sin nota que nadie puede editar no deja
   * hueco ni sombra en la fila (criterio 554).
   */
  placeholder?: string | null
  /** Con esto la línea es un botón; sin esto, un párrafo de solo lectura. */
  onEdit?: () => void
  /** `done` en la línea del día, `running` en la barra, `plan` en la plantilla. */
  tone?: 'done' | 'running' | 'plan'
  /**
   * La pregunta que oye un lector de pantalla delante del texto escrito. Por
   * defecto «¿Qué hiciste?», que es la de la línea del día; **antes de
   * empezar** es «¿Qué vas a hacer?» (criterio 532: siempre una pregunta,
   * nunca «nota»).
   */
  question?: string
  /**
   * Con qué etiqueta se pinta la línea de **solo lectura**. `p` por defecto,
   * que es lo que pide una fila de agenda; `span` donde la fila entera ya es
   * un `<button>` —la del ítem de plantilla (tajada 4)— porque el contenido
   * de un botón es contenido de frase y un `<p>` ahí dentro no es HTML
   * válido. No cambia ni un píxel: la clase `.line` es la misma y ya trae su
   * `display: flex`.
   */
  as?: 'p' | 'span'
}

/**
 * **La línea que se lee**: lo que hiciste dentro de un rato, en una sola línea,
 * debajo del nombre de la actividad.
 *
 * Es un componente y no tres `<p>` sueltos porque la misma línea aparece en la
 * fila del plan, en la fila de lo que pasó fuera del plan, en la barra de la
 * sesión en marcha y en la fila del ítem de plantilla — y porque **aquí y solo
 * aquí** viven el recorte (criterios 533 y 541) y las palabras. Si el recorte se
 * rompe, se arregla en un archivo.
 *
 * **Nunca reprocha** (regla del módulo): sin nota no se lee «falta», se lee
 * «＋ añadir qué hiciste» en gris, y solo donde de verdad se puede escribir.
 *
 * El texto completo va en `title`, así que una nota recortada se lee entera al
 * posar el ratón sin que la fila crezca.
 */
export function VidaNoteLine({
  text,
  placeholder = null,
  onEdit,
  tone = 'done',
  question = VIDA_NOTE_QUESTION_DONE,
  as: Tag = 'p',
}: VidaNoteLineProps) {
  const value = text && text.trim() ? text.trim() : null
  const label = value ?? placeholder

  if (!label) return null

  const body = (
    <>
      <span className={styles.mark} aria-hidden>
        {value ? '✎' : '＋'}
      </span>
      <span className={styles.text}>{label}</span>
    </>
  )

  if (!onEdit) {
    return (
      <Tag className={styles.line} data-tone={tone} data-filled={value ? '' : undefined} title={value ?? undefined}>
        {body}
      </Tag>
    )
  }

  return (
    <button
      type="button"
      className={styles.line}
      data-tone={tone}
      data-filled={value ? '' : undefined}
      title={value ?? undefined}
      // Sin esto un lector de pantalla oiría la nota suelta y no sabría que se
      // puede cambiar. La palabra «nota» no aparece: es la misma pregunta que
      // se lee en la hoja (criterio 532).
      aria-label={value ? `${question} ${value}` : undefined}
      onClick={onEdit}
    >
      {body}
    </button>
  )
}
