import type { CSSProperties } from 'react'
import { useReducedMotionPreference } from '@/shared/motion/useReducedMotionPreference'
import styles from './Skeleton.module.scss'

type SkeletonProps = {
  width?: string | number
  height?: string | number
  radius?: string | number
  circle?: boolean
  animated?: boolean
  className?: string
}

function toCssSize(value: string | number | undefined, fallback: string): string {
  if (value === undefined) return fallback
  return typeof value === 'number' ? `${value}px` : value
}

export function Skeleton({
  width,
  height = '1rem',
  radius,
  circle = false,
  animated = true,
  className,
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotionPreference()
  const style: CSSProperties = {
    width: toCssSize(width, '100%'),
    height: toCssSize(height, '1rem'),
    borderRadius: circle ? '50%' : toCssSize(radius, ''),
  }

  const classNames = [
    styles.skeleton,
    animated && !prefersReducedMotion ? styles.animated : '',
    circle ? styles.circle : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classNames} style={style} aria-hidden />
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={14} />
      ))}
    </div>
  )
}
