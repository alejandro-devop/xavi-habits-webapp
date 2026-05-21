export const transitions = {
  fast: { duration: 0.12, ease: [0.22, 1, 0.36, 1] as const },
  normal: { duration: 0.2, ease: [0.45, 0, 0.55, 1] as const },
  slow: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
} as const

export const reducedTransition = { duration: 0 } as const
