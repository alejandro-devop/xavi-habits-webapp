import { appIcons } from '@/shared/icons'
import { Inline } from '@/shared/layout'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Section } from '@/shared/ui/Section'
import styles from '../TestingHallPage.module.scss'

const NORMALIZATION_EXAMPLES = [
  { input: 'faBell', stored: 'bell' },
  { input: 'fa-bell', stored: 'bell' },
  { input: 'bell', stored: 'bell' },
  { input: 'faHouse', stored: 'home' },
  { input: 'fa-home', stored: 'home' },
]

export function IconsSection() {
  return (
    <Section id="icons" title="Icons" description="Catálogo controlado y nombres almacenados">
      <p className={styles.sectionNote}>
        Los valores persistidos usan nombres limpios. Nunca <code>fa-bell</code> ni{' '}
        <code>faBell</code>.
      </p>
      <div className={styles.iconCatalogGrid} role="list" aria-label="Catálogo de iconos">
        {appIcons.map((entry) => (
          <div key={entry.name} className={styles.iconCatalogCell} role="listitem">
            <span className={styles.iconCatalogIcon}>
              <AppIcon name={entry.name} size="lg" />
            </span>
            <span className={styles.iconCatalogLabel}>{entry.label}</span>
            <code className={styles.iconCatalogName}>{entry.name}</code>
          </div>
        ))}
      </div>
      <h3 className={styles.subsectionTitle}>Normalización</h3>
      <Inline gap="md" wrap>
        {NORMALIZATION_EXAMPLES.map((ex) => (
          <span key={ex.input} className={styles.normExample}>
            <code>{ex.input}</code> → <code>{ex.stored}</code>
          </span>
        ))}
      </Inline>
    </Section>
  )
}
