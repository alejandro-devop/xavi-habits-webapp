import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import type { UserSettings } from '@/features/settings/types/user-settings.types'

let settingsQuery: {
  data?: UserSettings
  isPending: boolean
  isError: boolean
  fetchStatus: string
}

vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
}))

function buildSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    userId: 1,
    hideHiddenHabits: false,
    sleepActivityCategoryId: null,
    standupTodoFolderId: null,
    vidaDayStartTime: null,
    vidaDayEndTime: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  settingsQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'fetching' }
})

describe('useVidaDayHours', () => {
  it('con los dos nulos usa 06:30 y 23:00 y **dice** que es el valor por defecto (criterio 9)', () => {
    settingsQuery = {
      data: buildSettings(),
      isPending: false,
      isError: false,
      fetchStatus: 'idle',
    }
    const { result } = renderHook(() => useVidaDayHours())

    expect(result.current.startTime).toBe('06:30')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.isDefault).toBe(true)
    expect(result.current.saved).toEqual({ startTime: null, endTime: null })
  })

  it('con los dos guardados usa los del usuario y ya no es el valor por defecto', () => {
    settingsQuery = {
      data: buildSettings({ vidaDayStartTime: '07:15', vidaDayEndTime: '22:30' }),
      isPending: false,
      isError: false,
      fetchStatus: 'idle',
    }
    const { result } = renderHook(() => useVidaDayHours())

    expect(result.current.startTime).toBe('07:15')
    expect(result.current.endTime).toBe('22:30')
    expect(result.current.isDefault).toBe(false)
  })

  it('medio horario guardado no vale: hacen falta los dos para tener geometría', () => {
    settingsQuery = {
      data: buildSettings({ vidaDayStartTime: '07:15', vidaDayEndTime: null }),
      isPending: false,
      isError: false,
      fetchStatus: 'idle',
    }
    const { result } = renderHook(() => useVidaDayHours())

    expect(result.current.startTime).toBe('06:30')
    expect(result.current.isDefault).toBe(true)
    // Pero lo guardado se conserva para que el formulario lo pueda pintar.
    expect(result.current.saved.startTime).toBe('07:15')
  })

  it('un horario imposible cae al respaldo en vez de dejar la agenda sin sentido', () => {
    settingsQuery = {
      data: buildSettings({ vidaDayStartTime: '23:00', vidaDayEndTime: '06:30' }),
      isPending: false,
      isError: false,
      fetchStatus: 'idle',
    }
    const { result } = renderHook(() => useVidaDayHours())

    expect(result.current.startTime).toBe('06:30')
    expect(result.current.endTime).toBe('23:00')
    expect(result.current.isDefault).toBe(true)
  })

  it('en vuelo lo dice, para que nadie pinte horas que luego saltan (criterio 50)', () => {
    const { result } = renderHook(() => useVidaDayHours())

    expect(result.current.isPending).toBe(true)
    expect(result.current.isDisabled).toBe(false)
  })

  it('sin sesión no es «cargando»: la consulta está deshabilitada (criterio 51)', () => {
    settingsQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'idle' }
    const { result } = renderHook(() => useVidaDayHours())

    expect(result.current.isPending).toBe(false)
    expect(result.current.isDisabled).toBe(true)
  })

  it('con error lo dice y sigue dando horas con las que pintar', () => {
    settingsQuery = { data: undefined, isPending: false, isError: true, fetchStatus: 'idle' }
    const { result } = renderHook(() => useVidaDayHours())

    expect(result.current.isError).toBe(true)
    expect(result.current.startTime).toBe('06:30')
    expect(result.current.isDefault).toBe(true)
  })
})
