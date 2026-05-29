import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { RunningActivityTimer } from '@/features/activities/components/RunningActivityTimer'
import {
  useActivityOpenFollowUpQuery,
  useDeleteActivityFollowUpMutation,
  useUpdateActivityFollowUpMutation,
} from '@/features/activities/hooks/useActivityFollowUps'
import { useElapsedTimer } from '@/features/activities/hooks/useElapsedTimer'
import type { RunningActivitySession } from '@/features/activities/types/activity-followup.types'
import { getCurrentLocalDate } from '@/features/activities/utils/activity-time.utils'
import { openFollowUpToRunningSession } from '@/features/activities/utils/activity-followup-form'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { reducedTransition, transitions } from '@/shared/motion'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import styles from './RunningActivityWidget.module.scss'

type WidgetBarProps = {
  session: RunningActivitySession
  onViewDetails: () => void
}

function WidgetBar({ session, onViewDetails }: WidgetBarProps) {
  const elapsed = useElapsedTimer(session.startedAt, 'compact')
  const accentColor = session.categoryColor ?? 'var(--color-primary)'

  return (
    <div className={styles.bar}>
      <span
        className={styles.iconWrap}
        style={{
          color: accentColor,
          borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
          background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
        }}
        aria-hidden
      >
        <AppIcon name={session.categoryIcon ?? 'clock'} size="sm" decorative />
      </span>

      <div className={styles.info}>
        <span className={styles.label}>En curso</span>
        <span className={styles.title}>{session.activityTitle}</span>
      </div>

      <span className={styles.timer} aria-live="polite">
        {elapsed}
      </span>

      <Button
        variant="ghost"
        size="sm"
        className={styles.viewBtn}
        onClick={onViewDetails}
        aria-label="Ver detalles de la actividad en curso"
      >
        Ver
      </Button>
    </div>
  )
}

export function RunningActivityWidget() {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotionPreference()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: openFollowUp } = useActivityOpenFollowUpQuery()
  const session = useMemo(
    () => (openFollowUp ? openFollowUpToRunningSession(openFollowUp) : null),
    [openFollowUp],
  )
  const updateMutation = useUpdateActivityFollowUpMutation()
  const deleteMutation = useDeleteActivityFollowUpMutation()

  const isOnTracking = location.pathname === activitiesPaths.tracking
  const visible = !isOnTracking && Boolean(session)

  function handleFinish() {
    if (!session) return
    updateMutation.mutate(
      { id: session.followUpId },
      { onSuccess: () => setDrawerOpen(false) },
    )
  }

  function handleCancel() {
    if (!session) return
    deleteMutation.mutate(
      {
        id: session.followUpId,
        date: openFollowUp?.date ?? getCurrentLocalDate(),
        activityId: session.activityId,
        wasOpen: true,
      },
      { onSuccess: () => setDrawerOpen(false) },
    )
  }

  return (
    <>
      <AnimatePresence>
        {visible && session ? (
          <motion.div
            className={styles.root}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={prefersReducedMotion ? reducedTransition : transitions.normal}
          >
            <WidgetBar session={session} onViewDetails={() => setDrawerOpen(true)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {session ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          side="bottom"
          title="Actividad en curso"
        >
          <RunningActivityTimer
            session={session}
            onFinish={handleFinish}
            onCancel={handleCancel}
            loading={updateMutation.isPending || deleteMutation.isPending}
          />
        </Drawer>
      ) : null}
    </>
  )
}
