import { useId } from 'react'

type AuraRingProps = {
  size?: number
}

/**
 * Anillo Aura: arco con degradado mint → violeta sobre una pista tenue.
 * Decorativo; la marca la aporta el texto contiguo.
 */
export function AuraRing({ size = 30 }: AuraRingProps) {
  const gradientId = useId()

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12.5" stroke="var(--aura-ring-track)" strokeWidth="3" />
      <path
        d="M16 3.5a12.5 12.5 0 0 1 11.3 7.2"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4.4" fill={`url(#${gradientId})`} />
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="28" y2="28">
          <stop stopColor="var(--aura-ring-from)" />
          <stop offset="1" stopColor="var(--aura-ring-to)" />
        </linearGradient>
      </defs>
    </svg>
  )
}
