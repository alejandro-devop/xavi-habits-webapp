import type { ReactNode } from 'react'
import styles from './Section.module.scss'

type SectionProps = {
  title: string
  description?: string
  children: ReactNode
  id?: string
}

export function Section({ title, description, children, id }: SectionProps) {
  return (
    <section className={styles.section} id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <header className={styles.header}>
        <h2 className={styles.title} id={id ? `${id}-title` : undefined}>
          {title}
        </h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
