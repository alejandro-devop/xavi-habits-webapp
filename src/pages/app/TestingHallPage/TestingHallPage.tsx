import { Container, Inline } from '@/shared/layout'
import { PageHeader, ThemeToggle } from '@/shared/ui'
import styles from './TestingHallPage.module.scss'
import { ButtonsSection } from './sections/ButtonsSection'
import { DataDisplaySection } from './sections/DataDisplaySection'
import { FeedbackSection } from './sections/FeedbackSection'
import { FormsSection } from './sections/FormsSection'
import { FoundationsSection } from './sections/FoundationsSection'
import { LayoutSection } from './sections/LayoutSection'
import { MotionSection } from './sections/MotionSection'
import { NavigationSection } from './sections/NavigationSection'
import { OverlaySection } from './sections/OverlaySection'
import { SurfacesSection } from './sections/SurfacesSection'

const NAV_ITEMS = [
  { href: '#foundations', label: 'Foundations' },
  { href: '#buttons', label: 'Buttons' },
  { href: '#forms', label: 'Forms' },
  { href: '#feedback', label: 'Feedback' },
  { href: '#surfaces', label: 'Surfaces' },
  { href: '#data-display', label: 'Data' },
  { href: '#overlay', label: 'Overlay' },
  { href: '#navigation', label: 'Nav' },
  { href: '#layout', label: 'Layout' },
  { href: '#motion', label: 'Motion' },
] as const

export function TestingHallPage() {
  return (
    <div className={styles.page}>
      <Container size="xl" padding="lg">
        <PageHeader
          title="Testing Hall"
          subtitle="Laboratorio visual del Design System — Fase 5.1"
          actions={<ThemeToggle />}
        />

        <nav className={styles.nav} aria-label="Secciones del laboratorio">
          <Inline gap="sm" wrap>
            {NAV_ITEMS.map((item) => (
              <a key={item.href} className={styles.navLink} href={item.href}>
                {item.label}
              </a>
            ))}
          </Inline>
        </nav>

        <FoundationsSection />
        <ButtonsSection />
        <FormsSection />
        <FeedbackSection />
        <SurfacesSection />
        <DataDisplaySection />
        <OverlaySection />
        <NavigationSection />
        <LayoutSection />
        <MotionSection />
      </Container>
    </div>
  )
}
