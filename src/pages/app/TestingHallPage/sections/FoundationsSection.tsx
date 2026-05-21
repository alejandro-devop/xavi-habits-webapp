import { Section } from '@/shared/ui'
import styles from '../TestingHallPage.module.scss'

const COLORS = [
  '--color-bg',
  '--color-surface',
  '--color-glass',
  '--color-primary',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-text',
  '--color-text-secondary',
  '--color-border',
] as const

const SPACING = [
  { name: 'xs', var: '--spacing-xs' },
  { name: 'sm', var: '--spacing-sm' },
  { name: 'md', var: '--spacing-md' },
  { name: 'lg', var: '--spacing-lg' },
  { name: 'xl', var: '--spacing-xl' },
] as const

export function FoundationsSection() {
  return (
    <Section id="foundations" title="Foundations" description="Tokens CSS activos según el tema">
      <div className={styles.tokenGrid}>
        {COLORS.map((token) => (
          <div key={token} className={styles.tokenSwatch}>
            <div className={styles.swatch} style={{ background: `var(${token})` }} />
            <code>{token}</code>
          </div>
        ))}
      </div>

      <Section title="Typography" description="Escala tipográfica del sistema">
        <p className={styles.typeSample} style={{ fontSize: '2rem', fontWeight: 800 }}>
          Display — Xavi
        </p>
        <p className={styles.typeSample} style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Heading — Sección
        </p>
        <p className={styles.typeSample} style={{ fontSize: '1rem' }}>
          Body — Texto de párrafo legible en light y dark mode.
        </p>
        <p className={styles.typeSample} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Secondary — Metadatos y descripciones
        </p>
      </Section>

      <Section title="Spacing" description="Escala de espaciado">
        <div className={styles.tokenGrid}>
          {SPACING.map((s) => (
            <div key={s.var} className={styles.tokenSwatch}>
              <div className={styles.spacingBar} style={{ width: `var(${s.var})` }} />
              <code>
                {s.name} ({s.var})
              </code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius & shadows" description="Bordes y elevación">
        <div className={styles.row}>
          {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((r) => (
            <div key={r} className={styles.tokenSwatch}>
              <div className={styles.radiusBox} style={{ borderRadius: `var(--radius-${r})` }} />
              <code>--radius-{r}</code>
            </div>
          ))}
        </div>
        <div className={styles.row}>
          {(['sm', 'md', 'lg', 'glass'] as const).map((s) => (
            <div key={s} className={styles.tokenSwatch}>
              <div className={styles.shadowBox} style={{ boxShadow: `var(--shadow-${s})` }} />
              <code>--shadow-{s}</code>
            </div>
          ))}
        </div>
        <div className={styles.blurBox}>Blur glass sample</div>
      </Section>
    </Section>
  )
}
