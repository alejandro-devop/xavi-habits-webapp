import { motion } from 'framer-motion'
import { Link, Outlet } from 'react-router'
import { authPaths } from '@/features/auth/router/auth-paths'
import { reducedTransition, transitions } from '@/shared/motion/transitions'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { AuraRing, AuroraCanvas } from '@/shared/ui'
import styles from './AuthLayout.module.scss'

const HIGHLIGHTS = [
  { emoji: '🌿', tone: 'mint', text: 'Rachas que no castigan un mal día' },
  { emoji: '🫧', tone: 'violet', text: 'Sesiones de foco y respiración' },
  { emoji: '✨', tone: 'amber', text: 'Un resumen diario, no un tablero' },
] as const

export function AuthLayout() {
  const prefersReducedMotion = useReducedMotionPreference()

  return (
    <div className={styles.root} data-ds="aura">
      <AuroraCanvas />

      <main className={styles.main}>
        <motion.div
          className={styles.card}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? reducedTransition : transitions.slow}
        >
          <aside className={styles.brandside}>
            <Link className={styles.lockup} to={authPaths.home}>
              <AuraRing />
              <span className={styles.brandName}>Xavi</span>
            </Link>

            <h2 className={styles.claim}>
              Vuelve a tu ritmo,
              <br />
              <em>sin ruido.</em>
            </h2>

            <p className={styles.claimSub}>
              Tus hábitos, tus rachas y tus sesiones te esperan justo donde los dejaste.
            </p>

            <ul className={styles.highlights}>
              {HIGHLIGHTS.map((highlight) => (
                <li key={highlight.text} className={styles.highlight}>
                  <span className={[styles.highlightDot, styles[highlight.tone]].join(' ')}>
                    {highlight.emoji}
                  </span>
                  <span className={styles.highlightText}>{highlight.text}</span>
                </li>
              ))}
            </ul>
          </aside>

          <section className={styles.formside}>
            <Outlet />
          </section>
        </motion.div>
      </main>
    </div>
  )
}
