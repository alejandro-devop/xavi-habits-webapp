import { Card, DataCard, GlassPanel, Section, StatCard } from '@/shared/ui'
import { Grid, GridItem } from '@/shared/layout'

export function SurfacesSection() {
  return (
    <Section id="surfaces" title="Surfaces" description="Card, glass y métricas">
      <Grid columns={12} gap="md">
        <GridItem span={12} md={6}>
          <Card>
            <strong>Card</strong>
            <p>Superficie opaca con sombra suave.</p>
          </Card>
        </GridItem>
        <GridItem span={12} md={6}>
          <GlassPanel>
            <strong>GlassPanel</strong>
            <p>Glassmorphism controlado.</p>
          </GlassPanel>
        </GridItem>
        <GridItem span={12} md={6} lg={4}>
          <DataCard title="Hábitos completados" value="24" description="Esta semana" trend={{ value: '+12%', direction: 'up' }} icon="✓" />
        </GridItem>
        <GridItem span={12} md={6} lg={4}>
          <DataCard title="Racha actual" value="7 días" variant="glass" trend={{ value: 'Estable', direction: 'neutral' }} />
        </GridItem>
        <GridItem span={12} md={6} lg={4}>
          <DataCard title="Pendientes" value="3" variant="warning" description="Requieren atención" />
        </GridItem>
        <GridItem span={12} md={4}>
          <StatCard label="Sesiones" value="128" helperText="Últimos 30 días" delta={{ value: '+8%', positive: true }} />
        </GridItem>
        <GridItem span={12} md={4}>
          <StatCard label="Tiempo medio" value="12 min" delta={{ value: '-2 min', positive: false }} />
        </GridItem>
        <GridItem span={12} md={4}>
          <StatCard label="Cargando" value="" skeleton />
        </GridItem>
      </Grid>
    </Section>
  )
}
