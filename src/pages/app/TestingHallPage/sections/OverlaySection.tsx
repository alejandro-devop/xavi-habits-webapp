import { useState } from 'react'
import { Button, Modal, Section } from '@/shared/ui'

export function OverlaySection() {
  const [open, setOpen] = useState(false)

  return (
    <Section id="overlay" title="Overlay" description="Modal con focus trap y animación">
      <Button variant="primary" onClick={() => setOpen(true)}>
        Abrir modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Modal de ejemplo"
        description="Cierra con ESC, el overlay o el botón ×."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirmar
            </Button>
          </>
        }
      >
        <p>Contenido del modal. Sin librerías externas — portal + focus trap básico.</p>
      </Modal>
    </Section>
  )
}
