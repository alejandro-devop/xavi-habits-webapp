import { Card, Divider, Section } from '@/shared/ui'
import { Container, Grid, GridItem, Inline, Stack } from '@/shared/layout'
import styles from '../TestingHallPage.module.scss'

export function LayoutSection() {
  return (
    <Section id="layout" title="Layout" description="Container, Grid 12 cols, Stack e Inline">
      <Section title="Container" description="Tamaños de ancho máximo">
        <Stack gap="sm">
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <Container key={size} size={size} padding="md">
              <Card padding="sm">
                Container {size}
              </Card>
            </Container>
          ))}
        </Stack>
      </Section>

      <Divider label="Grid 12 columnas" />

      <Grid columns={12} gap="md">
        {[12, 6, 4, 3].map((span) => (
          <GridItem key={span} span={12} md={span}>
            <Card padding="sm">
              span 12 / md {span}
            </Card>
          </GridItem>
        ))}
      </Grid>

      <Section title="Stack & Inline">
        <div className={styles.row} style={{ alignItems: 'flex-start', gap: '2rem' }}>
          <Stack gap="md" style={{ flex: 1 }}>
            <Card padding="sm">Stack 1</Card>
            <Card padding="sm">Stack 2</Card>
            <Card padding="sm">Stack 3</Card>
          </Stack>
          <Inline gap="sm" wrap style={{ flex: 1 }}>
            <Card padding="sm">Inline A</Card>
            <Card padding="sm">Inline B</Card>
            <Card padding="sm">Inline C</Card>
            <Card padding="sm">Inline D</Card>
          </Inline>
        </div>
      </Section>
    </Section>
  )
}
