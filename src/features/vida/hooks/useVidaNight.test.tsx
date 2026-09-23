import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import { useVidaNight } from '@/features/vida/hooks/useVidaNight'

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
    vidaNightBedTime: null,
    vidaNightWakeTime: null,
    vidaNightDays: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function settled(overrides: Partial<UserSettings> = {}) {
  settingsQuery = {
    data: buildSettings(overrides),
    isPending: false,
    isError: false,
    fetchStatus: 'idle',
  }
}

beforeEach(() => {
  settingsQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'fetching' }
})

describe('useVidaNight', () => {
  // Criterio 310: el estado de todo el mundo el primer día.
  it('con los tres nulos no hay noche, y eso no es un error', () => {
    settled()
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.night).toBeNull()
    expect(result.current.isError).toBe(false)
    expect(result.current.saved).toEqual({ bedTime: null, wakeTime: null, days: null })
  })

  // Criterio 262: levantarse antes de acostarse es legal y NO se descarta.
  it('23:00 → 5:00 es una noche válida: nada de isEndAfterStart aquí', () => {
    settled({
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      vidaNightDays: ['tuesday', 'wednesday'],
    })
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.night).toEqual({
      bedTime: '23:00',
      wakeTime: '05:00',
      days: ['tuesday', 'wednesday'],
    })
  })

  it('1:00 → 6:40 también, y no cruza la medianoche', () => {
    settled({
      vidaNightBedTime: '01:00',
      vidaNightWakeTime: '06:40',
      vidaNightDays: ['friday'],
    })
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.night?.bedTime).toBe('01:00')
    expect(result.current.night?.wakeTime).toBe('06:40')
  })

  // Criterio 265: «ninguna noche marcada» se guarda igual y equivale a no tener
  // noche — la noche existe, pero no aplica a ningún día.
  it('sin días marcados la noche existe con days vacío', () => {
    settled({ vidaNightBedTime: '23:00', vidaNightWakeTime: '05:00', vidaNightDays: null })
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.night?.days).toEqual([])
  })

  it('media noche guardada no es una noche', () => {
    settled({ vidaNightBedTime: '23:00', vidaNightWakeTime: null })
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.night).toBeNull()
    // Pero lo guardado se conserva para que el formulario lo pueda pintar.
    expect(result.current.saved.bedTime).toBe('23:00')
  })

  // Criterio 263, por detrás: un dato viejo con las dos horas iguales tampoco
  // se usa.
  it('las dos horas iguales no son una noche', () => {
    settled({ vidaNightBedTime: '23:00', vidaNightWakeTime: '23:00', vidaNightDays: ['monday'] })
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.night).toBeNull()
  })

  // Criterio 317: lo que llega roto cae a null, no tumba nada.
  it('una hora que no es HH:mm cae a null en vez de reventar', () => {
    settled({ vidaNightBedTime: 'a las once', vidaNightWakeTime: '05:00' })
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.night).toBeNull()
  })

  it('un día que no existe se cae y el resto se queda', () => {
    settled({
      vidaNightBedTime: '23:00',
      vidaNightWakeTime: '05:00',
      vidaNightDays: ['tuesday', 'martes', 'lunes'],
    })
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.night?.days).toEqual(['tuesday'])
  })

  // Criterio 311.
  it('en vuelo lo dice, para que nadie pinte una franja que luego salte', () => {
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.isPending).toBe(true)
    expect(result.current.isDisabled).toBe(false)
    expect(result.current.night).toBeNull()
  })

  it('sin sesión no es «cargando»: la consulta está deshabilitada', () => {
    settingsQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'idle' }
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.isPending).toBe(false)
    expect(result.current.isDisabled).toBe(true)
  })

  // Criterio 312: con error NO se afirma «no tienes noche» — quien pinte lee
  // `isError` antes que `night`.
  it('con error lo dice y no inventa ninguna noche', () => {
    settingsQuery = { data: undefined, isPending: false, isError: true, fetchStatus: 'idle' }
    const { result } = renderHook(() => useVidaNight())

    expect(result.current.isError).toBe(true)
    expect(result.current.night).toBeNull()
  })
})
