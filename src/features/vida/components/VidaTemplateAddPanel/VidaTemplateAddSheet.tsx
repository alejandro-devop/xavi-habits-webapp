import {
  VidaTemplateAddPanel,
  type VidaTemplateAddPanelProps,
} from './VidaTemplateAddPanel'
import { SteppedModal } from '@/shared/ui/SteppedModal'

type VidaTemplateAddSheetProps = VidaTemplateAddPanelProps & {
  open: boolean
  onClose: () => void
}

/**
 * El envoltorio **de móvil** del panel de añadir: la misma implementación,
 * dentro de la hoja inferior que ya usa la hoja del ítem (`SteppedModal` con
 * `mobileSheet`). Lo abre el «+» flotante (criterio 29) y **no navega a
 * ninguna parte**: la plantilla se arma sin salir de la pantalla.
 */
export function VidaTemplateAddSheet({
  open,
  onClose,
  onSaved,
  ...panel
}: VidaTemplateAddSheetProps) {
  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title="Añadir a mi Vida"
      description="Tus actividades. Eliges una y le pones días, hora y cuánto."
      size="md"
      ds="aura"
      mobileSheet
    >
      <VidaTemplateAddPanel
        {...panel}
        onSaved={() => {
          onSaved?.()
          onClose()
        }}
      />
    </SteppedModal>
  )
}
