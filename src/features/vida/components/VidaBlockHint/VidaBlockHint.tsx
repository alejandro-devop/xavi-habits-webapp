import type { VidaBlockHint as BlockHint } from '@/features/vida/utils/vida-patterns.utils'
import { Button } from '@/shared/ui/Button'
import styles from './VidaBlockHint.module.scss'

type VidaBlockHintProps = {
  hint: BlockHint
  /** **Sí**: cambia el bloque de **este** día, nunca la plantilla (criterio 89). */
  onApply: (hint: BlockHint) => void
  /** **«Así está bien»**: no llama a nadie, se guarda en el aparato (90). */
  onDismiss: (hint: BlockHint) => void
  /** Hay un cambio en vuelo: las dos salidas no admiten un segundo toque. */
  isSaving?: boolean
}

/**
 * **El aviso pegado al bloque del que habla** (FEAT-007, criterios 87 a 94, y
 * el marco C del render aprobado).
 *
 * Es una **nota al margen**, no un error: va en violeta punteado
 * (`--aura-ring-to`, el token que ya usan el presupuesto de Vida y medio módulo
 * de hábitos), sin rojo, sin icono de alarma y sin una palabra de reproche. El
 * día **se puede armar entero ignorándolos todos**, que es exactamente lo que
 * pasa si no se toca nada.
 *
 * Tres cosas que la hacen honrada, y que no son de estilo:
 *
 * 1. **Va numerada** —«1 de 2»— para que se vea que son dos y no una lista sin
 *    fondo. La cuenta la pone `pickBlockHints`, no este componente.
 * 2. **Las dos salidas están escritas**, y la segunda —«Así está bien»— es una
 *    respuesta de pleno derecho: se guarda y calla la pregunta cuatro semanas
 *    (D1), no es una evasiva.
 * 3. **La consecuencia va antes de los botones**: «Esto cambia solo para hoy:
 *    tu plantilla se queda como está» (criterio 89, decisión D2). Nada cambia
 *    más de lo que el botón dice.
 *
 * Es un `<li>` propio, hermano del bloque y **debajo** de él —el mismo camino
 * que `VidaAgendaNoData`—, para no tapar ni desplazar fuera de vista el bloque
 * del que habla (criterio 94) y para no tocar `VidaAgendaBlock`, que está
 * entregado y revisado desde FEAT-004.
 */
export function VidaBlockHint({ hint, onApply, onDismiss, isSaving = false }: VidaBlockHintProps) {
  return (
    <li className={styles.row}>
      <span className={styles.gutter} aria-hidden />

      <section
        className={styles.card}
        // Lo que deja fuera a este aviso del «trazo suave» de la agenda en
        // modo plan: su fondo violeta es lo que lo hace una nota al margen.
        data-kind="hint"
        aria-label={`Aviso ${hint.counterLabel}: ${hint.basis}`}
      >
        <p className={styles.head}>
          <span className={styles.title}>{hint.header}</span>
          <span className={styles.count}>{hint.counterLabel}</span>
        </p>

        <p className={styles.body}>
          <strong className={styles.basis}>{hint.basis}</strong> · {hint.ask}
        </p>

        <p className={styles.scope}>{hint.scopeNote}</p>

        <div className={styles.actions}>
          <Button variant="primary" size="sm" disabled={isSaving} onClick={() => onApply(hint)}>
            {hint.affirmativeLabel}
          </Button>
          <Button variant="secondary" size="sm" disabled={isSaving} onClick={() => onDismiss(hint)}>
            {hint.dismissLabel}
          </Button>
        </div>
      </section>
    </li>
  )
}
