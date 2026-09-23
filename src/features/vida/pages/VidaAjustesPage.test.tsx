import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaAjustesPage } from '@/features/vida/pages/VidaAjustesPage'
import type { UserSettings } from '@/features/settings/types/user-settings.types'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import type { VidaGoal } from '@/features/vida/types/vida-goal.types'
import type { VidaDayOfWeek } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * Criterios 7 a 10: dos campos y nada más, guardados con `updateMySettings`,
 * con 06:30 / 23:00 **dichos** como valor por defecto y el fin obligado a ser
 * posterior al inicio.
 *
 * Se mockea `useUserSettings` —el hook de la otra feature— y **no**
 * `useVidaDayHours`: lo que hay que comprobar aquí es que la pantalla usa el
 * envoltorio de verdad, con sus respaldos, y que lo que sale hacia el API son
 * los dos campos de Vida y ninguno más.
 */
let settingsQuery: {
  data?: UserSettings
  isPending: boolean
  isError: boolean
  fetchStatus: 'fetching' | 'idle' | 'paused'
}
let updateSettings: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }

vi.mock('@/features/settings/hooks/useUserSettings', () => ({
  useUserSettingsQuery: () => settingsQuery,
  useUpdateUserSettingsMutation: () => updateSettings,
}))

/**
 * El catálogo se mockea porque `useActivityCategoriesQuery` pasa por
 * `useVidaQueryGuard`, que exige el contexto de sesión que `renderWithProviders`
 * no monta. De aquí salen las metas: **no hay consulta de metas** (FEAT-019,
 * tajada 4).
 */
let categoriesQuery: {
  data?: ActivityCategory[]
  isPending: boolean
  isError: boolean
  fetchStatus: 'fetching' | 'idle' | 'paused'
}
let setGoalDays: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; isError: boolean }

vi.mock('@/features/vida/hooks/useActivityCategories', () => ({
  useActivityCategoriesQuery: () => categoriesQuery,
}))

vi.mock('@/features/vida/hooks/useVidaGoals', () => ({
  useSetVidaGoalDaysMutation: () => setGoalDays,
}))

const WEEKDAYS: VidaDayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function buildGoal(overrides: Partial<VidaGoal> = {}): VidaGoal {
  return {
    id: 'goal-trabajo',
    slug: 'work',
    name: 'Trabajo',
    icon: 'briefcase',
    color: '#0284c7',
    targetMinutes: 480,
    activeDays: WEEKDAYS,
    orderIndex: 0,
    ...overrides,
  }
}

function buildCategory(goal: VidaGoal | null, overrides: Partial<ActivityCategory> = {}) {
  return {
    id: `cat-${goal?.id ?? 'sin-meta'}`,
    userId: 1,
    orderIndex: 0,
    name: 'Curro',
    description: null,
    icon: null,
    color: null,
    goalId: goal?.id ?? null,
    goal,
    ...overrides,
  } as ActivityCategory
}

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

function ready(settings: UserSettings = buildSettings()) {
  settingsQuery = { data: settings, isPending: false, isError: false, fetchStatus: 'idle' }
}

beforeEach(() => {
  updateSettings = { mutate: vi.fn(), isPending: false, isError: false }
  setGoalDays = { mutate: vi.fn(), isPending: false, isError: false }
  categoriesQuery = { data: [], isPending: false, isError: false, fetchStatus: 'idle' }
  ready()
})

describe('VidaAjustesPage', () => {
  it('son exactamente dos campos: empieza y termina (criterio 7)', () => {
    renderWithProviders(<VidaAjustesPage />)

    expect(screen.getByLabelText('Empieza mi día')).toHaveAttribute('type', 'time')
    expect(screen.getByLabelText('Termina mi día')).toHaveAttribute('type', 'time')
    // Ni duración por defecto, ni franjas, ni notificaciones: dos y se acabó.
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0)
  })

  it('con los dos nulos se ven 06:30 y 23:00 y se lee que son el valor por defecto (criterio 9)', () => {
    renderWithProviders(<VidaAjustesPage />)

    expect(screen.getByLabelText('Empieza mi día')).toHaveValue('06:30')
    expect(screen.getByLabelText('Termina mi día')).toHaveValue('23:00')
    expect(screen.getByText(/horario por defecto/i)).toBeInTheDocument()
  })

  it('con horario guardado se ve el suyo y ya no se llama por defecto (criterio 8)', () => {
    ready(buildSettings({ vidaDayStartTime: '07:15', vidaDayEndTime: '22:30' }))
    renderWithProviders(<VidaAjustesPage />)

    expect(screen.getByLabelText('Empieza mi día')).toHaveValue('07:15')
    expect(screen.getByLabelText('Termina mi día')).toHaveValue('22:30')
    expect(screen.queryByText(/horario por defecto/i)).not.toBeInTheDocument()
  })

  it('guardar manda los dos campos de Vida y ninguno más (criterio 8)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaAjustesPage />)

    fireEvent.change(screen.getByLabelText('Empieza mi día'), { target: { value: '07:00' } })
    fireEvent.change(screen.getByLabelText('Termina mi día'), { target: { value: '22:00' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(updateSettings.mutate).toHaveBeenCalledTimes(1)
    expect(updateSettings.mutate.mock.calls[0]![0]).toEqual({
      vidaDayStartTime: '07:00',
      vidaDayEndTime: '22:00',
    })
  })

  it('un fin que no es posterior al inicio no se guarda y se señala (criterio 10)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaAjustesPage />)

    fireEvent.change(screen.getByLabelText('Termina mi día'), { target: { value: '06:00' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(updateSettings.mutate).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La hora de fin tiene que ser posterior a la de inicio.',
    )
    expect(screen.getByLabelText('Termina mi día')).toHaveAttribute('aria-invalid', 'true')
    // Y lo escrito sigue ahí: nadie lo revierte por detrás.
    expect(screen.getByLabelText('Termina mi día')).toHaveValue('06:00')
  })

  it('dos horas iguales tampoco valen: un día de cero minutos no es un día', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaAjustesPage />)

    fireEvent.change(screen.getByLabelText('Termina mi día'), { target: { value: '06:30' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(updateSettings.mutate).not.toHaveBeenCalled()
  })

  it('si la mutación falla se ve el error y no se pierde lo escrito (criterio 10)', async () => {
    const user = userEvent.setup()
    updateSettings.isError = true
    renderWithProviders(<VidaAjustesPage />)

    fireEvent.change(screen.getByLabelText('Empieza mi día'), { target: { value: '05:45' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByText(/No pudimos guardar tu horario/)).toBeInTheDocument()
    expect(screen.getByLabelText('Empieza mi día')).toHaveValue('05:45')
  })

  it('al guardar bien lo dice, y lo que manda es lo que quedará al volver', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VidaAjustesPage />)

    fireEvent.change(screen.getByLabelText('Empieza mi día'), { target: { value: '07:00' } })
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // La mutación ya escribe en `settingsKeys.my()`; aquí se simula su vuelta.
    ready(buildSettings({ vidaDayStartTime: '07:00', vidaDayEndTime: '23:00' }))
    act(() => updateSettings.mutate.mock.calls[0]![1].onSuccess())

    expect(screen.getByRole('status')).toHaveTextContent('Guardado.')
    expect(screen.getByLabelText('Empieza mi día')).toHaveValue('07:00')
  })

  it('mientras los ajustes están en vuelo no se pintan horas que luego saltan (criterio 50)', () => {
    settingsQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'fetching' }
    renderWithProviders(<VidaAjustesPage />)

    expect(screen.queryByLabelText('Empieza mi día')).not.toBeInTheDocument()
    expect(screen.getByText('Cargando tu horario…')).toBeInTheDocument()
  })

  it('sin sesión no hay spinner eterno: mensaje y vía para entrar (criterio 51)', () => {
    settingsQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'idle' }
    renderWithProviders(<VidaAjustesPage />)

    expect(screen.getByText('Entra para ajustar tu día')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('si la carga falla se dice, y aun así se puede poner el horario (criterio 52)', () => {
    settingsQuery = { data: undefined, isPending: false, isError: true, fetchStatus: 'idle' }
    renderWithProviders(<VidaAjustesPage />)

    expect(screen.getByText('No pudimos cargar tu horario')).toBeInTheDocument()
    expect(screen.getByLabelText('Empieza mi día')).toBeInTheDocument()
  })

  it('no hay ni una palabra de reproche en la pantalla (criterio 56)', () => {
    const { container } = renderWithProviders(<VidaAjustesPage />)
    const text = container.textContent ?? ''

    for (const word of ['desperdici', 'perdiste', 'fallaste', 'error de', 'obligatorio']) {
      expect(text.toLowerCase()).not.toContain(word)
    }
  })

  /**
   * FEAT-019, tajada 4: los días de cada meta. Criterios 581 (un toque, un
   * guardado), 582 (sin metas no hay fila) y el límite que el CHECK de la
   * columna impone y la pantalla dice antes: nunca cero días.
   */
  describe('los días de cada meta', () => {
    it('sin ninguna meta en el catálogo no se pinta ninguna fila (criterio 582)', () => {
      categoriesQuery = {
        data: [buildCategory(null)],
        isPending: false,
        isError: false,
        fetchStatus: 'idle',
      }
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.queryByText('Los días de tus metas')).not.toBeInTheDocument()
      expect(screen.queryAllByRole('group')).toHaveLength(0)
      // Y tampoco se ofrece crearla desde aquí.
      expect(screen.queryByRole('button', { name: /meta/i })).not.toBeInTheDocument()
    })

    it('cargando el catálogo tampoco se pinta: todavía no se sabe si hay alguna', () => {
      categoriesQuery = { isPending: true, isError: false, fetchStatus: 'fetching' }
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.queryByText('Los días de tus metas')).not.toBeInTheDocument()
    })

    it('una meta enseña sus siete días, con los suyos pulsados (criterio 581)', () => {
      const goal = buildGoal()
      categoriesQuery = {
        data: [buildCategory(goal)],
        isPending: false,
        isError: false,
        fetchStatus: 'idle',
      }
      renderWithProviders(<VidaAjustesPage />)

      const row = screen.getByRole('group', { name: 'Días de Trabajo' })
      const days = within(row).getAllByRole('button')
      expect(days).toHaveLength(7)
      expect(days.map((button) => button.getAttribute('aria-label'))).toEqual([
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
        'domingo',
      ])
      expect(days.map((button) => button.getAttribute('aria-pressed'))).toEqual([
        'true',
        'true',
        'true',
        'true',
        'true',
        'false',
        'false',
      ])
    })

    it('un toque guarda, sin confirmación en medio (criterio 581)', async () => {
      const user = userEvent.setup()
      const goal = buildGoal()
      categoriesQuery = {
        data: [buildCategory(goal)],
        isPending: false,
        isError: false,
        fetchStatus: 'idle',
      }
      renderWithProviders(<VidaAjustesPage />)

      await user.click(screen.getByRole('button', { name: 'sábado' }))

      expect(setGoalDays.mutate).toHaveBeenCalledTimes(1)
      expect(setGoalDays.mutate.mock.calls[0][0]).toEqual({
        goalId: 'goal-trabajo',
        activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      })
      // Ni diálogo ni botón de guardar para esto: el toque es el guardado.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      // Y el botón ya se ve pulsado mientras el viaje está en vuelo.
      expect(screen.getByRole('button', { name: 'sábado' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    it('quitar el último día no sale hacia el API: se dice aquí', async () => {
      const user = userEvent.setup()
      const goal = buildGoal({ activeDays: ['monday'] })
      categoriesQuery = {
        data: [buildCategory(goal)],
        isPending: false,
        isError: false,
        fetchStatus: 'idle',
      }
      renderWithProviders(<VidaAjustesPage />)

      await user.click(screen.getByRole('button', { name: 'lunes' }))

      expect(setGoalDays.mutate).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Déjale al menos un día: sin ninguno, esta meta no contaría nunca.',
      )
      // El lunes sigue pulsado: no se ha quitado nada.
      expect(screen.getByRole('button', { name: 'lunes' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('dos categorías que apuntan a la misma meta dan una sola fila', () => {
      const goal = buildGoal()
      categoriesQuery = {
        data: [
          buildCategory(goal),
          buildCategory(goal, { id: 'cat-2', name: 'Reuniones', orderIndex: 1 }),
        ],
        isPending: false,
        isError: false,
        fetchStatus: 'idle',
      }
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.getAllByRole('group', { name: 'Días de Trabajo' })).toHaveLength(1)
    })
  })
})
