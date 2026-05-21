import { useState } from 'react'
import { Button, Drawer, Modal, Popover, Section, Tooltip } from '@/shared/ui'
import styles from '../TestingHallPage.module.scss'

export function OverlaySection() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerRight, setDrawerRight] = useState(false)
  const [drawerBottom, setDrawerBottom] = useState(false)

  return (
    <Section id="overlay" title="Overlay" description="Modal, Drawer, Popover y Tooltip">
      <div className={styles.row}>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          Modal
        </Button>
        <Button variant="secondary" onClick={() => setDrawerRight(true)}>
          Drawer derecho
        </Button>
        <Button variant="secondary" onClick={() => setDrawerBottom(true)}>
          Drawer inferior
        </Button>
        <Popover
          trigger={<Button variant="ghost">Popover</Button>}
          content={<p style={{ margin: 0 }}>Contenido del popover. Click fuera o ESC para cerrar.</p>}
        />
        <Tooltip content="Tooltip en hover/focus">
          <Button variant="ghost">Tooltip</Button>
        </Tooltip>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal de ejemplo"
        description="Cierra con ESC, el overlay o el botón ×."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirmar
            </Button>
          </>
        }
      >
        <p>Portal + focus trap básico.</p>
      </Modal>

      <Drawer
        open={drawerRight}
        onClose={() => setDrawerRight(false)}
        side="right"
        title="Panel lateral"
        description="Estilo glass — ESC o overlay para cerrar."
      >
        <p>Contenido del drawer.</p>
      </Drawer>

      <Drawer
        open={drawerBottom}
        onClose={() => setDrawerBottom(false)}
        side="bottom"
        title="Sheet inferior"
      >
        <p>Útil en móvil para acciones o filtros.</p>
      </Drawer>
    </Section>
  )
}
