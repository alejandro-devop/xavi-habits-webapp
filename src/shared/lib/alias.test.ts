import { describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'

describe('@ path alias', () => {
  it('resolves imports from @/app/config', () => {
    expect(env.appName).toBeTruthy()
  })
})
