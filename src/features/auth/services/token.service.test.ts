import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import {
  REFRESH_MARGIN_MS,
  getValidAccessToken,
  refreshSession,
  shouldRefreshToken,
} from '@/features/auth/services/token.service'

vi.mock('@/features/auth/api/auth.api', () => ({
  refresh: vi.fn(),
}))

const now = 1_700_000_000_000

describe('shouldRefreshToken', () => {
  it('returns false when accessExpiresAt is null', () => {
    expect(shouldRefreshToken(null)).toBe(false)
  })

  it('returns false when expiry is far in the future', () => {
    vi.setSystemTime(now)
    expect(shouldRefreshToken(now + REFRESH_MARGIN_MS + 120_000)).toBe(false)
  })

  it('returns true when within refresh margin', () => {
    vi.setSystemTime(now)
    expect(shouldRefreshToken(now + REFRESH_MARGIN_MS - 1_000)).toBe(true)
  })

  it('returns true when already expired', () => {
    vi.setSystemTime(now)
    expect(shouldRefreshToken(now - 1_000)).toBe(true)
  })
})

describe('refreshSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    useAuthStore.getState().clearSession()
    vi.mocked(authApi.refresh).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null and clears session when refreshToken is missing', async () => {
    useAuthStore.setState({
      accessToken: 'old-access',
      accessExpiresAt: now + 30_000,
      refreshToken: null,
      user: null,
    })

    await expect(refreshSession()).resolves.toBeNull()
    expect(authApi.refresh).not.toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('updates tokens on successful refresh', async () => {
    useAuthStore.setState({
      accessToken: 'old-access',
      accessExpiresAt: now + 30_000,
      refreshToken: 'refresh-old',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: true,
      },
    })

    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'new-access',
      accessExpiresAt: now + 3_600_000,
      refreshToken: 'refresh-new',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: true,
      },
    })

    await expect(refreshSession()).resolves.toBe('new-access')
    expect(useAuthStore.getState().accessToken).toBe('new-access')
    expect(useAuthStore.getState().refreshToken).toBe('refresh-new')
  })

  it('deduplicates concurrent refresh calls', async () => {
    useAuthStore.setState({
      accessToken: 'old-access',
      accessExpiresAt: now + 30_000,
      refreshToken: 'refresh-old',
      user: null,
    })

    let resolveRefresh!: (value: Awaited<ReturnType<typeof authApi.refresh>>) => void
    vi.mocked(authApi.refresh).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve
        }),
    )

    const first = refreshSession()
    const second = refreshSession()

    resolveRefresh({
      accessToken: 'new-access',
      accessExpiresAt: now + 3_600_000,
      refreshToken: 'refresh-new',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: true,
      },
    })

    await Promise.all([first, second])

    expect(authApi.refresh).toHaveBeenCalledTimes(1)
  })
})

describe('getValidAccessToken', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    useAuthStore.getState().clearSession()
    vi.mocked(authApi.refresh).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns current token when not near expiry', async () => {
    useAuthStore.setState({
      accessToken: 'valid-access',
      accessExpiresAt: now + REFRESH_MARGIN_MS + 120_000,
      refreshToken: 'refresh-token',
      user: null,
    })

    await expect(getValidAccessToken()).resolves.toBe('valid-access')
    expect(authApi.refresh).not.toHaveBeenCalled()
  })

  it('returns null when there is no refresh token', async () => {
    await expect(getValidAccessToken()).resolves.toBeNull()
  })
})
