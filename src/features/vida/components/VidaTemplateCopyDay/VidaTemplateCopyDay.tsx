import { useState } from 'react'
import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import { useCopyTemplateDay } from '@/features/vida/hooks/useCopyTemplateDay'
import {
  VIDA_DAY_LABELS,
  VIDA_DAY_ORDER,
  VIDA_DAY_SHORT_LABELS,
} from '@/features/vida/utils/vida-date.utils'
import { describeCopySkips, planCopyDay } from '@/features/vida/utils/vida-template.utils'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import styles from './VidaTemplateCopyDay.module.scss'

/** Cuántas se nombran en la vista previa antes de copiar; el resto se cuentan. */
const PREVIEW_SKIPS = 3

type VidaTemplateCopyDayProps = {
  open: boolean
  /** El día del que se parte: **el que se está viendo** (criterio 49). */
  fromDay: VidaDayOfWeek
  /** La plantilla entera, tal como la tiene la pantalla. */
  items: VidaItem[]
  /** La salida: **«Volver»**, que no llama a ninguna mutación. */
  onClose: () => void
}

/**
 * **«Copiar este día a otros»** (criterios 49–52): el atajo que sustituye al
 * arrastrar.
 *
 * Se marcan los días destino, se dice cuántos son y se confirma con «Copiar a 3
 * días». Antes de tocar nada la pantalla ya dice **qué va a pasar y qué no**,
 * calculado con `planCopyDay` —el mismo plan que se ejecuta—: cuántas cosas se
 * llevan y **qué se queda como está** porque esa actividad ya estaba en el día
 * destino (criterio 50). Copiar **no borra nunca nada** y **no crea ítems**: le
 * añade días al que ya existe (A7), y de ahí sale el aviso del criterio 51 —un
 * día copiado comparte el mismo ítem, así que cambiarle la hora después cambia
 * los dos días, y la salida para separarlos es el «quitarlo solo del viernes»
 * del criterio 22—.
 *
 * Es un `Modal` corto y **no `useConfirmDialog`**, por lo mismo que
 * `VidaTemplateRemoveDialog`: aquel resuelve una `Promise<boolean>` con dos
 * botones fijos y aquí hace falta elegir días dentro del propio diálogo.
 * Ninguna salida es `danger`: ese rojo **no se lee en tema oscuro** (1,7:1
 * medido en la tajada 2) y aquí, además, no se destruye nada.
 */
export function VidaTemplateCopyDay({
  open,
  fromDay,
  items,
  onClose,
}: VidaTemplateCopyDayProps) {
  const [toDays, setToDays] = useState<VidaDayOfWeek[]>([])
  const copy = useCopyTemplateDay()
  const result = copy.data ?? null

  const plan = planCopyDay(items, fromDay, toDays)
  const fromLabel = VIDA_DAY_LABELS[fromDay]
  const count = toDays.length

  function toggle(day: VidaDayOfWeek) {
    setToDays((current) =>
      current.includes(day) ? current.filter((other) => other !== day) : [...current, day],
    )
  }

  function close() {
    copy.reset()
    setToDays([])
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Copiar tu ${fromLabel} a otros días`}
      size="sm"
      ds="aura"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={close} disabled={copy.isPending}>
            {result ? 'Listo' : 'Volver'}
          </Button>
          {result ? null : (
            <Button
              variant="primary"
              disabled={count === 0 || copy.isPending}
              isLoading={copy.isPending}
              onClick={() => copy.mutate({ items, fromDay, toDays })}
            >
              {count === 0
                ? 'Elige los días'
                : `Copiar a ${count} ${count === 1 ? 'día' : 'días'}`}
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.body}>
        {result ? (
          // **El resumen de lo que pasó de verdad** (criterios 50 y 52): nunca
          // dice «copiado» de lo que no lo está.
          <div className={styles.result}>
            <p className={styles.resultHead}>
              {result.done.length > 0
                ? `Copiamos ${result.done.length} ${
                    result.done.length === 1 ? 'cosa' : 'cosas'
                  } a ${result.daysTouched} ${result.daysTouched === 1 ? 'día' : 'días'}.`
                : 'No hizo falta copiar nada.'}
            </p>
            {result.failed.length > 0 ? (
              <ul className={styles.list}>
                {result.failed.map((entry) => (
                  <li key={entry.title}>
                    <b>{entry.title}</b> se quedó sin copiar · {entry.reason}
                  </li>
                ))}
              </ul>
            ) : null}
            {result.skipped.length > 0 ? (
              <ul className={styles.list}>
                {describeCopySkips(result.skipped).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <>
            <p className={styles.lead}>
              La forma rápida de armar la semana: coges un día que ya te gusta y lo llevas a los
              demás.
            </p>

            <fieldset className={styles.days}>
              <legend className={styles.legend}>A qué días</legend>
              {VIDA_DAY_ORDER.filter((day) => day !== fromDay).map((day) => {
                const checked = toDays.includes(day)
                return (
                  <label key={day} className={styles.day} data-checked={checked ? 'true' : undefined}>
                    <input
                      type="checkbox"
                      className={styles.check}
                      checked={checked}
                      onChange={() => toggle(day)}
                    />
                    <span aria-hidden>{VIDA_DAY_SHORT_LABELS[day]}</span>
                    <span className={styles.srOnly}>{VIDA_DAY_LABELS[day]}</span>
                  </label>
                )
              })}
            </fieldset>

            <p className={styles.note}>
              Se añade lo que falta; <b>lo que ya tienes a esa hora se queda como está</b>.
            </p>

            {count > 0 ? (
              <p className={styles.preview}>
                {plan.updates.length > 0
                  ? `Se llevan ${plan.updates.length} ${
                      plan.updates.length === 1 ? 'cosa' : 'cosas'
                    } de tu ${fromLabel}.`
                  : `Tu ${fromLabel} no tiene nada que llevarse a esos días.`}
              </p>
            ) : null}

            {/* Lo que se va a quedar como está, **dicho antes** (criterio 50).
                Con una semana llena esta lista sería de diez líneas y taparía
                el botón: se nombran las tres primeras y se cuenta el resto. El
                resumen de después sí las nombra todas. */}
            {plan.skipped.length > 0 ? (
              <ul className={styles.list}>
                {describeCopySkips(plan.skipped)
                  .slice(0, PREVIEW_SKIPS)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                {describeCopySkips(plan.skipped).length > PREVIEW_SKIPS ? (
                  <li>
                    y {describeCopySkips(plan.skipped).length - PREVIEW_SKIPS} más que también se
                    quedan como están
                  </li>
                ) : null}
              </ul>
            ) : null}

            {/* La consecuencia, dicha antes (criterio 51). */}
            <p className={styles.shared}>
              Un día copiado <b>comparte el mismo ítem</b>: si después le cambias la hora, cambia
              en los dos días. Para separarlos, quítalo de un solo día desde su hoja.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}
