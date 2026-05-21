import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeUp, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import styles from './DataCard.module.scss'

export type DataCardVariant = 'default' | 'glass' | 'success' | 'warning' | 'danger'

type Trend = {
  value: string
  direction: 'up' | 'down' | 'neutral'
}

type DataCardProps = {
  title: string
  value: ReactNode
  description?: string
  trend?: Trend
  icon?: ReactNode
  variant?: DataCardVariant
  className?: string
}

const TREND_CLASS: Record<Trend['direction'], string> = {
  up: styles.trendUp,
  down: styles.trendDown,
  neutral: styles.trendNeutral,
}

export function DataCard({
  title,
  value,
  description,
  trend,
  icon,
  variant = 'default',
  className,
}: DataCardProps) {
  const prefersReducedMotion = useReducedMotionPreference()

  return (
    <motion.article
      className={[styles.card, styles[variant], className].filter(Boolean).join(' ')}
      variants={prefersReducedMotion ? undefined : fadeUp}
      initial="hidden"
      animate="visible"
      transition={prefersReducedMotion ? { duration: 0 } : transitions.normal}
    >
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      <div className={styles.value}>{value}</div>
      {description ? <p className={styles.description}>{description}</p> : null}
      {trend ? (
        <p className={[styles.trend, TREND_CLASS[trend.direction]].join(' ')}>
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
        </p>
      ) : null}
    </motion.article>
  )
}
