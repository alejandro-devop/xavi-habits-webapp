import { beforeEach, describe, expect, it } from 'vitest'
import {
  selectIsAccountVerified,
  selectIsAuthenticated,
} from '@/features/auth/store/auth.selectors'
import { useAuthStore } from '@/features/auth/store/auth.store'

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('setSession stores tokens and user', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      accessExpiresAt: 1_700_000_000_000,
      refreshToken: 'refresh',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: true,
      },
    })

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('access')
    expect(state.accessExpiresAt).toBe(1_700_000_000_000)
    expect(state.refreshToken).toBe('refresh')
    expect(state.user?.id).toBe(1)
  })

  it('updateAccessToken updates token fields only', () => {
    useAuthStore.getState().setSession({
      accessToken: 'old-access',
      accessExpiresAt: 1,
      refreshToken: 'old-refresh',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: true,
      },
    })

    useAuthStore.getState().updateAccessToken({
      accessToken: 'new-access',
      accessExpiresAt: 2,
      refreshToken: 'new-refresh',
    })

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('new-access')
    expect(state.accessExpiresAt).toBe(2)
    expect(state.refreshToken).toBe('new-refresh')
    expect(state.user?.name).toBe('Jane')
  })

  it('updateUser replaces user', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      accessExpiresAt: 1,
      refreshToken: 'refresh',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: false,
      },
    })

    useAuthStore.getState().updateUser({
      id: 1,
      email: 'user@example.com',
      name: 'Jane Verified',
      isAccountVerified: true,
    })

    expect(useAuthStore.getState().user?.isAccountVerified).toBe(true)
    expect(useAuthStore.getState().user?.name).toBe('Jane Verified')
  })

  it('selectIsAuthenticated is false without tokens', () => {
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false)
  })

  it('selectIsAuthenticated is true with tokens', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      accessExpiresAt: 1,
      refreshToken: 'refresh',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: true,
      },
    })
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true)
  })

  it('selectIsAccountVerified reflects user flag', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      accessExpiresAt: 1,
      refreshToken: 'refresh',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: false,
      },
    })
    expect(selectIsAccountVerified(useAuthStore.getState())).toBe(false)
  })

  it('clearSession resets persisted fields', () => {
    useAuthStore.getState().setSession({
      accessToken: 'access',
      accessExpiresAt: 1,
      refreshToken: 'refresh',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'Jane',
        isAccountVerified: true,
      },
    })

    useAuthStore.getState().clearSession()

    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.accessExpiresAt).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.user).toBeNull()
  })

  describe('expiración de sesión', () => {
    const login = () =>
      useAuthStore.getState().setSession({
        accessToken: 'access',
        accessExpiresAt: 1,
        refreshToken: 'refresh',
        user: {
          id: 1,
          email: 'user@example.com',
          name: 'Jane',
          isAccountVerified: true,
        },
      })

    it('expireSession descarta los tokens pero conserva el usuario', () => {
      login()
      useAuthStore.getState().expireSession()

      const state = useAuthStore.getState()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.sessionExpired).toBe(true)
      // El correo se conserva para precargarlo en el modal de reingreso.
      expect(state.user?.email).toBe('user@example.com')
      expect(selectIsAuthenticated(state)).toBe(false)
    })

    it('setSession limpia la marca de expiración al reingresar', () => {
      login()
      useAuthStore.getState().expireSession()
      login()

      expect(useAuthStore.getState().sessionExpired).toBe(false)
    })

    it('updateAccessToken limpia la marca tras un refresh exitoso', () => {
      login()
      useAuthStore.getState().expireSession()

      useAuthStore.getState().updateAccessToken({
        accessToken: 'nuevo',
        accessExpiresAt: 2,
        refreshToken: 'nuevo-refresh',
      })

      expect(useAuthStore.getState().sessionExpired).toBe(false)
    })

    it('clearSession borra también la marca y el usuario', () => {
      login()
      useAuthStore.getState().expireSession()
      useAuthStore.getState().clearSession()

      const state = useAuthStore.getState()
      expect(state.sessionExpired).toBe(false)
      expect(state.user).toBeNull()
    })
  })
})
