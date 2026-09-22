import { VidaPatternAdvice } from '@/features/vida/components/VidaPatternAdvice'
import type { VidaAnsweredSuggestion } from '@/features/vida/hooks/useVidaPatterns'
import type { VidaPatternSuggestion } from '@/features/vida/utils/vida-patterns.utils'
import { Card } from '@/shared/ui/Card'
import styles from './VidaPatternsAside.module.scss'

/** Lo que se aplicó en esta visita: qué cambió y cuándo (criterio 99). */
export type VidaAppliedSuggestion = {
  id: string
  title: string
  /** «Pasó de 45 min a 1h 10, hoy.» Ya escrito por quien aplicó el cambio. */
  note: string
}

type VidaPatternsAsideProps = {
  /** Las preguntas vivas, las mismas que las tarjetas y con las mismas salidas. */
  suggestions: VidaPatternSuggestion[]
  answered: VidaAnsweredSuggestion[]
  applied: VidaAppliedSuggestion[]
  onApply: (suggestion: VidaPatternSuggestion) => void
  onDismiss: (suggestion: VidaPatternSuggestion) => void
  isSaving?: boolean
}

/**
 * **De dónde sale todo esto** (criterio 100).
 *
 * Vive fuera del lateral a propósito: en escritorio va en la columna de al
 * lado, y en móvil —donde no hay lateral— va al final de la sección. Un
 * sistema que «entiende» tiene que ser el primero en explicarse, y esa
 * explicación no puede existir solo en las pantallas grandes.
 *
 * Dice las cuatro cosas, y la cuarta antes de que sorprenda: **las respuestas
 * viven en este navegador** (la deuda del aparato del criterio 63 de
 * FEAT-006).
 */
export function VidaPatternsSource() {
  return (
    <Card className={styles.panel} padding="md">
      <h3 className={styles.title}>De dónde sale todo esto</h3>
      <p className={styles.sub}>Sin nada nuevo que guardar</p>
      <p className={styles.line}>
        De <b>tu plan y tu registro</b> de las últimas 6 semanas, con las consultas que ya
        existen. Se calcula <b>en este dispositivo</b>, cada vez que abres.
      </p>
      <p className={styles.line}>
        Lo único que se guarda es <b>tu respuesta</b> a cada sugerencia, para no repetírtela. Se
        guarda <b>en este navegador</b>: en otro no está, y allí las preguntas vuelven a
        aparecer.
      </p>
      <p className={styles.line}>
        Nada de esto <b>cambia tu plantilla ni tu plan por su cuenta</b>: hace falta que toques
        el botón que dice el número.
      </p>
    </Card>
  )
}

/**
 * **El lateral de escritorio** (criterios 98–100, marco E del render).
 *
 * Tres paneles y ningún atajo: las sugerencias **sin contestar** con las
 * mismas dos salidas que su tarjeta —no una versión recortada—, las
 * **contestadas** con qué se contestó, cuándo y **la fecha en la que vuelven**,
 * y de dónde sale todo.
 *
 * Lo que aquí se cuida y no se ve en el dibujo: una respuesta puede venir de
 * **dos sitios** —de aquí o del puente de «La semana»—, y la del puente **no
 * trae número** (`answer: null`). Por eso se mira `source` antes de dar por
 * hecho que hay cifra: una respuesta que calla una pregunta sin aparecer en
 * ninguna lista sería una respuesta invisible.
 */
export function VidaPatternsAside({
  suggestions,
  answered,
  applied,
  onApply,
  onDismiss,
  isSaving = false,
}: VidaPatternsAsideProps) {
  return (
    <aside className={styles.root} aria-label="Sugerencias y respuestas">
      <Card className={styles.panel} padding="md">
        <h3 className={styles.title}>Sin contestar</h3>
        <p className={styles.sub}>
          Las sugerencias esperan aquí · no caduca ninguna y no cambian nada solas
        </p>
        {suggestions.length === 0 ? (
          <p className={styles.line}>
            Ahora mismo no hay ninguna pregunta esperando. Lo que se repite sigue contado arriba.
          </p>
        ) : (
          <div className={styles.list}>
            {suggestions.map((suggestion) => (
              <VidaPatternAdvice
                key={suggestion.id}
                eyebrow="De tus últimas semanas"
                activity={{
                  icon: suggestion.icon,
                  title: suggestion.title,
                  color: suggestion.color,
                  meta: suggestion.basis,
                }}
                text={suggestion.ask}
                suggestion={suggestion}
                onApply={onApply}
                onDismiss={onDismiss}
                isSaving={isSaving}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className={styles.panel} padding="md">
        <h3 className={styles.title}>Contestadas</h3>
        <p className={styles.sub}>Lo que ya decidiste · se puede volver sobre ello cuando quieras</p>
        {answered.length === 0 && applied.length === 0 ? (
          <p className={styles.line}>Todavía no has contestado ninguna.</p>
        ) : (
          <ul className={styles.answered}>
            {applied.map((entry) => (
              <li className={styles.line} key={`applied-${entry.id}`}>
                <b>{entry.title}</b> · {entry.note}
              </li>
            ))}
            {answered.map((entry) => (
              <li className={styles.line} key={entry.id}>
                <b>{entry.title}</b> · {entry.note}
                {/* `answer` es `null` cuando la respuesta vino del puente: lo
                    que manda es `source`, y se dice dónde se contestó para que
                    nadie busque aquí una fecha que está en otra pantalla. */}
                {entry.source === 'bridge' ? (
                  <span className={styles.where}> Lo contestaste en «La semana».</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <VidaPatternsSource />
    </aside>
  )
}
