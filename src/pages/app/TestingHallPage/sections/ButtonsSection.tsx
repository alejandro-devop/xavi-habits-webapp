import { Button, Section } from '@/shared/ui'
import styles from '../TestingHallPage.module.scss'

export function ButtonsSection() {
  return (
    <Section id="buttons" title="Buttons" description="Variantes, tamaños y estados">
      <div className={styles.row}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div className={styles.row}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className={styles.row}>
        <Button isLoading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button fullWidth>Full width</Button>
      </div>
    </Section>
  )
}
