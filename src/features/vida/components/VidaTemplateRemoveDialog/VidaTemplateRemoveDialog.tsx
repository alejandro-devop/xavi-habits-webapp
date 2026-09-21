import type { VidaDayOfWeek, VidaItem } from '@/features/vida/types/vida-item.types'
import { VIDA_DAY_LABELS } from '@/features/vida/utils/vida-date.utils'
import {
  daysWithout,
  describeOtherDays,
  templateItemTitle,
} from '@/features/vida/utils/vida-template.utils'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import styles from './VidaTemplateRemoveDialog.module.scss'

type VidaTemplateRemoveDialogProps = {
  open: boolean
  /** El ítem que se quita; `null` mientras no hay ninguno (el diálogo no se pinta). */
  item: VidaItem | null
  /** El día desde el que se está quitando: el que da la salida «solo del viernes». */
  day: VidaDayOfWeek
  /** La salida: **«Volver»**, que no llama a ninguna mutación. */
  onClose: () => void
  /** Quitarlo **de todos sus días**: `vidaItemDelete` (criterio 21). */
  onRemoveAll: (item: VidaItem) => void
  /** Restarle **solo este día**: `vidaItemUpdate` con un día menos (criterio 22). */
  onRemoveDay: (item: VidaItem, remainingDays: VidaDayOfWeek[]) => void
  isPending?: boolean
}

/**
 * La confirmación de «Quitar de la plantilla» (criterios 21 y 22).
 *
 * **Por qué no es `useConfirmDialog`:** lo comprobé antes de escribir nada
 * —era la bifurcación que el arquitecto dejó abierta en «lo que no pude
 * averiguar»—. `ConfirmDialogProvider` resuelve una `Promise<boolean>` y pinta
 * exactamente **dos** botones, uno afirmativo y uno de salida
 * (`ConfirmDialogProvider.tsx:87-104`): no admite dos salidas afirmativas. El
 * criterio 22 pide **tres** botones cuando el ítem está en varios días
 * —«Quitarlo solo del viernes», «Quitarlo de los tres días» y «Volver»—, así
 * que esto es un `Modal` corto, que es la otra mitad de la bifurcación.
 *
 * Con **un solo día** hay una sola salida afirmativa y el texto no inventa
 * plural. En los dos casos se dice lo que de verdad pasa: **la actividad se
 * queda en tu catálogo**, que es lo que separa «quitar de la plantilla» de
 * «archivar».
 */
export function VidaTemplateRemoveDialog({
  open,
  item,
  day,
  onClose,
  onRemoveAll,
  onRemoveDay,
  isPending = false,
}: VidaTemplateRemoveDialogProps) {
  if (!item) return null

  const title = templateItemTitle(item)
  const others = describeOtherDays(item, day)
  const remaining = daysWithout(item, day)
  // «del viernes», que es como lo escribe el criterio 22.
  const dayLabel = VIDA_DAY_LABELS[day]
  const totalDays = item.days.length

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`¿Quitar «${title}» de tu plantilla?`}
      size="sm"
      ds="aura"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Volver
          </Button>
          {remaining.length > 0 ? (
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => onRemoveDay(item, remaining)}
            >
              Quitarlo solo del {dayLabel}
            </Button>
          ) : null}
          {/* **No es `danger`**, y es una decisión medida, no un descuido: el
              rojo de `Button variant="danger"` pinta texto blanco sobre
              `rgb(255,180,171)` en tema oscuro —**1,7:1**, ilegible— y el
              render de esta pantalla no tiene rojo en ninguna parte. Las dos
              salidas afirmativas comparten peso, que es lo que pide el
              criterio 22; la que separa es el texto. */}
          <Button variant="secondary" isLoading={isPending} onClick={() => onRemoveAll(item)}>
            {remaining.length > 0 ? `Quitarlo de los ${totalDays} días` : 'Quitarlo'}
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        {others ? (
          // El aviso **antes**, no después: quitarlo desde el viernes se lo
          // lleva de los tres días, y eso no se puede descubrir al volver.
          <p className={styles.warn}>
            <b>{title}</b> {others}: quitarlo de tu plantilla lo quita de {totalDays} días.
          </p>
        ) : null}
        <p className={styles.calm}>
          <b>La actividad se queda en tu catálogo</b>: esto solo la saca de tu semana tipo, y
          puedes volver a traerla cuando quieras.
        </p>
      </div>
    </Modal>
  )
}
