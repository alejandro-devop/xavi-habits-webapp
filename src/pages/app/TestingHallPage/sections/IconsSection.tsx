import { useMemo, useState } from 'react'
import {
  APP_ICON_CATEGORY_ORDER,
  appIcons,
  filterAppIcons,
  groupIconsByCategory,
  normalizeIconName,
} from '@/shared/icons'
import { Inline } from '@/shared/layout'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Input } from '@/shared/ui/Input'
import { Section } from '@/shared/ui/Section'
import styles from '../TestingHallPage.module.scss'

const NORMALIZATION_EXAMPLES = [
  { input: 'faBell', stored: 'bell' },
  { input: 'fa-bell', stored: 'bell' },
  { input: 'bell', stored: 'bell' },
  { input: 'faHouse', stored: 'home' },
  { input: 'fa-home', stored: 'home' },
  { input: 'faPersonRunning', stored: 'running' },
  { input: 'faBriefcase', stored: 'briefcase' },
]

const ACTIVITY_EXAMPLES = [
  { label: 'Trabajo', name: 'briefcase' },
  { label: 'Coding', name: 'code' },
  { label: 'Gym', name: 'dumbbell' },
  { label: 'Leer', name: 'book-open' },
  { label: 'Dormir', name: 'bed' },
  { label: 'Meditar', name: 'spa' },
  { label: 'Finanzas', name: 'wallet' },
  { label: 'Reunión', name: 'video' },
  { label: 'Limpieza', name: 'broom' },
  { label: 'Gaming', name: 'gamepad' },
] as const

export function IconsSection() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => filterAppIcons(appIcons, search, { pickerOnly: true }),
    [search],
  )

  const grouped = useMemo(
    () => groupIconsByCategory(filtered, APP_ICON_CATEGORY_ORDER),
    [filtered],
  )

  const isSearching = search.trim().length > 0

  return (
    <Section
      id="icons"
      title="Icons"
      description="Catálogo por categorías, búsqueda por keywords y nombres almacenados"
    >
      <p className={styles.sectionNote}>
        Los valores persistidos usan nombres limpios. Nunca <code>fa-bell</code> ni{' '}
        <code>faBell</code>. Catálogo: {filtered.length} iconos visibles en picker.
      </p>

      <Input
        type="search"
        placeholder="Buscar en catálogo (ej. gym, finanzas, coding)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar iconos en catálogo"
      />

      <h3 className={styles.subsectionTitle}>Actividades ejemplo</h3>
      <Inline gap="md" wrap>
        {ACTIVITY_EXAMPLES.map((ex) => (
          <div key={ex.name} className={styles.iconActivityExample}>
            <AppIcon name={ex.name} size="lg" />
            <span>{ex.label}</span>
            <code>{ex.name}</code>
          </div>
        ))}
      </Inline>

      <h3 className={styles.subsectionTitle}>Catálogo</h3>
      {isSearching ? (
        <div className={styles.iconCatalogGrid} role="list" aria-label="Resultados de búsqueda">
          {filtered.map((entry) => (
            <div key={entry.name} className={styles.iconCatalogCell} role="listitem">
              <span className={styles.iconCatalogIcon}>
                <AppIcon name={entry.name} size="lg" />
              </span>
              <span className={styles.iconCatalogLabel}>{entry.label}</span>
              <code className={styles.iconCatalogName}>{entry.name}</code>
            </div>
          ))}
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.category} className={styles.iconCategoryBlock}>
            <h4 className={styles.iconCategoryHeading}>{group.label}</h4>
            <div className={styles.iconCatalogGrid} role="list" aria-label={group.label}>
              {group.icons.map((entry) => (
                <div key={entry.name} className={styles.iconCatalogCell} role="listitem">
                  <span className={styles.iconCatalogIcon}>
                    <AppIcon name={entry.name} size="lg" />
                  </span>
                  <span className={styles.iconCatalogLabel}>{entry.label}</span>
                  <code className={styles.iconCatalogName}>{entry.name}</code>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <h3 className={styles.subsectionTitle}>Normalización</h3>
      <Inline gap="md" wrap>
        {NORMALIZATION_EXAMPLES.map((ex) => (
          <span key={ex.input} className={styles.normExample}>
            <code>{ex.input}</code> → <code>{normalizeIconName(ex.input)}</code>
          </span>
        ))}
      </Inline>
    </Section>
  )
}
