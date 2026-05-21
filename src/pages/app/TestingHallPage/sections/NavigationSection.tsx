import { useState } from 'react'
import { Section, Tabs } from '@/shared/ui'

export function NavigationSection() {
  const [tab, setTab] = useState('overview')

  return (
    <Section id="navigation" title="Navigation" description="Tabs controladas con teclado">
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="overview">Resumen</Tabs.Tab>
          <Tabs.Tab value="details">Detalles</Tabs.Tab>
          <Tabs.Tab value="settings">Ajustes</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview">
          <p>Panel de resumen — usa ← → para cambiar de pestaña.</p>
        </Tabs.Panel>
        <Tabs.Panel value="details">
          <p>Panel de detalles con contenido adicional.</p>
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <p>Panel de ajustes del laboratorio.</p>
        </Tabs.Panel>
      </Tabs>
    </Section>
  )
}
