import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  fadeIn,
  fadeUp,
  pageTransition,
  scaleIn,
  staggerContainer,
  staggerItem,
  transitions,
  useReducedMotionPreference,
} from '@/shared/motion'
import { Button, Section } from '@/shared/ui'
import styles from '../TestingHallPage.module.scss'

const VIEWPORT = { once: false, amount: 0.45 as const }

export function MotionSection() {
  const prefersReducedMotion = useReducedMotionPreference()
  const [replayKey, setReplayKey] = useState(0)

  const variants = prefersReducedMotion
    ? undefined
    : { fadeIn, fadeUp, scaleIn, pageTransition, staggerContainer, staggerItem }

  const transition = prefersReducedMotion ? { duration: 0 } : transitions.normal

  return (
    <Section
      id="motion"
      title="Motion"
      description={
        prefersReducedMotion
          ? 'Reduced motion activo en el sistema'
          : 'Las animaciones se reproducen al entrar en vista o con Reproducir'
      }
    >
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setReplayKey((k) => k + 1)}
        disabled={prefersReducedMotion}
      >
        Reproducir animaciones
      </Button>

      <div key={replayKey} className={styles.motionBlock}>
        <div className={styles.row}>
          <motion.div
            className={styles.motionDemo}
            variants={variants?.fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={transition}
          >
            fadeIn
          </motion.div>
          <motion.div
            className={styles.motionDemo}
            variants={variants?.fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={transition}
          >
            fadeUp
          </motion.div>
          <motion.div
            className={styles.motionDemo}
            variants={variants?.scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={transition}
          >
            scaleIn
          </motion.div>
        </div>

        <motion.div
          className={styles.motionDemo}
          variants={variants?.pageTransition}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          transition={transition}
        >
          pageTransition preview
        </motion.div>

        <motion.ul
          className={styles.staggerList}
          variants={variants?.staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {['Uno', 'Dos', 'Tres'].map((item) => (
            <motion.li
              key={item}
              className={styles.motionDemo}
              variants={variants?.staggerItem}
              transition={transition}
            >
              stagger: {item}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </Section>
  )
}
