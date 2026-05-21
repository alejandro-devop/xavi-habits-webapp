import { Skeleton } from '@/shared/ui/Skeleton/Skeleton'
import styles from './StatCard.module.scss'

type StatCardProps = {
  label: string
  value: string
  helperText?: string
  delta?: { value: string; positive?: boolean }
  isLoading?: boolean
  skeleton?: boolean
}

export function StatCard({
  label,
  value,
  helperText,
  delta,
  isLoading = false,
  skeleton = false,
}: StatCardProps) {
  const showSkeleton = skeleton || isLoading

  return (
    <article className={styles.card}>
      {showSkeleton ? (
        <>
          <Skeleton width="40%" height={12} />
          <Skeleton width="60%" height={28} />
          {helperText ? <Skeleton width="80%" height={12} /> : null}
        </>
      ) : (
        <>
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value}</p>
          {helperText ? <p className={styles.helper}>{helperText}</p> : null}
          {delta ? (
            <p
              className={[
                styles.delta,
                delta.positive ? styles.deltaPositive : styles.deltaNegative,
              ].join(' ')}
            >
              {delta.value}
            </p>
          ) : null}
        </>
      )}
    </article>
  )
}
