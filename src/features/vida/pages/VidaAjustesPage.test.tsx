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
    vidaNightBedTime: null,
    vidaNightWakeTime: null,
    vidaNightDays: null,
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
      // La fila de días **de una meta**. Desde FEAT-012 la página tiene otra
      // fila de siete botones, la de «Qué noches», que no es de esta sección:
      // se busca por su nombre en vez de contar todos los grupos.
      expect(screen.queryByRole('group', { name: /^Días de/ })).not.toBeInTheDocument()
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

  /**
   * **Tu noche** (FEAT-012, tajada 1 — criterios 260 a 270).
   *
   * Aquí se prueba lo que **no** se prueba en ningún otro sitio: que la
   * igualdad de horas la para el cliente (el servidor no la mira), que el
   * orden de las horas **no** se valida, y que «ninguna noche» viaja como
   * `null` y no como `[]`, que es lo que el servidor rechaza.
   */
  describe('Tu noche', () => {
    async function setNight(bed: string, wake: string) {
      fireEvent.change(screen.getByLabelText('Me acuesto a las'), { target: { value: bed } })
      fireEvent.change(screen.getByLabelText('Me levanto a las'), { target: { value: wake } })
    }

    function save() {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar mi noche' }))
    }

    it('son tres cosas y ninguna más: dos horas y qué noches (criterio 260)', () => {
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.getByRole('heading', { name: 'Tu noche' })).toBeInTheDocument()
      expect(screen.getByLabelText('Me acuesto a las')).toHaveAttribute('type', 'time')
      expect(screen.getByLabelText('Me levanto a las')).toHaveAttribute('type', 'time')
      expect(screen.getByRole('group', { name: 'Qué noches' })).toBeInTheDocument()
      // Ni calidad, ni despertares, ni siestas, ni un campo por día.
      expect(screen.queryAllByRole('textbox')).toHaveLength(0)
      expect(screen.queryAllByRole('switch')).toHaveLength(0)
      expect(screen.queryAllByRole('spinbutton')).toHaveLength(0)
    })

    it('con los tres nulos es una invitación, sin error y sin horas puestas (criterio 268)', () => {
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.getByLabelText('Me acuesto a las')).toHaveValue('')
      expect(screen.getByLabelText('Me levanto a las')).toHaveValue('')
      expect(screen.getByText(/Todavía no has puesto tu noche/)).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      // Y ninguna noche marcada de propina.
      for (const name of ['La noche del lunes', 'La noche del domingo']) {
        expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
      }
    })

    it('23:00 / 5:00 dice la duración y que cruza la medianoche (criterio 261)', async () => {
      renderWithProviders(<VidaAjustesPage />)
      await setNight('23:00', '05:00')
      fireEvent.click(screen.getByRole('button', { name: 'La noche del martes' }))

      expect(screen.getByText('6 h')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Cruza la medianoche, y eso está bien: la noche del martes es la madrugada del miércoles.',
        ),
      ).toBeInTheDocument()
    })

    it('1:00 / 6:40 dice que no cruza la medianoche (criterio 261)', async () => {
      renderWithProviders(<VidaAjustesPage />)
      await setNight('01:00', '06:40')

      expect(screen.getByText('5 h 40')).toBeInTheDocument()
      expect(
        screen.getByText('Esta noche no cruza la medianoche: empieza y acaba el mismo día.'),
      ).toBeInTheDocument()
    })

    it('acostarse después de levantarse se guarda sin error y sin señalar nada (criterio 262)', async () => {
      renderWithProviders(<VidaAjustesPage />)
      await setNight('23:00', '05:00')
      save()

      expect(updateSettings.mutate).toHaveBeenCalledTimes(1)
      expect(updateSettings.mutate.mock.calls[0]![0]).toEqual({
        vidaNightBedTime: '23:00',
        vidaNightWakeTime: '05:00',
        vidaNightDays: null,
      })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Me acuesto a las')).not.toHaveAttribute('aria-invalid')
      expect(screen.getByLabelText('Me levanto a las')).not.toHaveAttribute('aria-invalid')
    })

    it('las dos horas iguales no se guardan y se señala el campo (criterio 263)', async () => {
      renderWithProviders(<VidaAjustesPage />)
      await setNight('23:00', '23:00')
      save()

      expect(updateSettings.mutate).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(/no pueden ser la misma/i)
      expect(screen.getByLabelText('Me acuesto a las')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Me levanto a las')).toHaveAttribute('aria-invalid', 'true')
    })

    it('las siete casillas se marcan por la noche en la que te acuestas, y lo dice (criterio 264)', () => {
      renderWithProviders(<VidaAjustesPage />)
      const group = screen.getByRole('group', { name: 'Qué noches' })

      expect(within(group).getAllByRole('button')).toHaveLength(7)
      expect(within(group).getByRole('button', { name: 'La noche del viernes' })).toHaveTextContent(
        'V',
      )
      expect(
        screen.getByText(/marcar «viernes» es la noche del viernes al sábado/),
      ).toBeInTheDocument()
    })

    it('ninguna noche marcada se guarda igual, y viaja como null (criterio 265)', async () => {
      ready(
        buildSettings({
          vidaNightBedTime: '23:00',
          vidaNightWakeTime: '05:00',
          vidaNightDays: ['tuesday'],
        }),
      )
      renderWithProviders(<VidaAjustesPage />)
      // Se desmarca la única que había: cero noches es una respuesta válida.
      fireEvent.click(screen.getByRole('button', { name: 'La noche del martes' }))
      save()

      expect(updateSettings.mutate.mock.calls[0]![0]).toEqual({
        vidaNightBedTime: '23:00',
        vidaNightWakeTime: '05:00',
        // **Nunca `[]`**: el `.min(1)` del servidor lo rechazaría.
        vidaNightDays: null,
      })
    })

    it('en el cuerpo viajan exactamente los tres campos de la noche (criterio 266)', async () => {
      renderWithProviders(<VidaAjustesPage />)
      await setNight('23:00', '05:00')
      fireEvent.click(screen.getByRole('button', { name: 'La noche del martes' }))
      save()

      const body = updateSettings.mutate.mock.calls[0]![0] as Record<string, unknown>
      expect(Object.keys(body).sort()).toEqual([
        'vidaNightBedTime',
        'vidaNightDays',
        'vidaNightWakeTime',
      ])
      expect(body.vidaNightDays).toEqual(['tuesday'])
    })

    it('al volver se ve lo guardado (criterio 266)', () => {
      ready(
        buildSettings({
          vidaNightBedTime: '23:00',
          vidaNightWakeTime: '05:00',
          vidaNightDays: ['tuesday', 'friday'],
        }),
      )
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.getByLabelText('Me acuesto a las')).toHaveValue('23:00')
      expect(screen.getByLabelText('Me levanto a las')).toHaveValue('05:00')
      expect(screen.getByRole('button', { name: 'La noche del martes' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(screen.getByRole('button', { name: 'La noche del lunes' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })

    it('si la mutación falla se dice y no se pierde lo escrito (criterio 267)', async () => {
      updateSettings = { mutate: vi.fn(), isPending: false, isError: true }
      renderWithProviders(<VidaAjustesPage />)
      await setNight('23:00', '05:00')

      expect(screen.getByText(/No pudimos guardar tu noche/)).toHaveTextContent(
        /tu noche de antes sigue vigente/,
      )
      expect(screen.getByLabelText('Me acuesto a las')).toHaveValue('23:00')
      expect(screen.getByLabelText('Me levanto a las')).toHaveValue('05:00')
    })

    it('dice cuál manda entre «Tu día» y «Tu noche» (criterio 269)', () => {
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.getByLabelText('Empieza mi día')).toBeInTheDocument()
      expect(screen.getByText(/Manda tu noche/)).toBeInTheDocument()
    })

    it('quitar la noche deja los tres campos nulos (criterio 270)', () => {
      ready(
        buildSettings({
          vidaNightBedTime: '23:00',
          vidaNightWakeTime: '05:00',
          vidaNightDays: ['tuesday'],
        }),
      )
      renderWithProviders(<VidaAjustesPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Quitar mi noche' }))

      expect(updateSettings.mutate.mock.calls[0]![0]).toEqual({
        vidaNightBedTime: null,
        vidaNightWakeTime: null,
        vidaNightDays: null,
      })
    })

    it('sin noche guardada no se ofrece quitarla', () => {
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.queryByRole('button', { name: 'Quitar mi noche' })).not.toBeInTheDocument()
    })

    it('cargando no se pinta ninguna noche que luego salte (criterio 311)', () => {
      settingsQuery = { data: undefined, isPending: true, isError: false, fetchStatus: 'fetching' }
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.queryByRole('heading', { name: 'Tu noche' })).not.toBeInTheDocument()
    })

    it('con error se dice y no se afirma «no tienes noche» (criterio 312)', () => {
      settingsQuery = { data: undefined, isPending: false, isError: true, fetchStatus: 'idle' }
      renderWithProviders(<VidaAjustesPage />)

      expect(screen.getByText('No pudimos cargar tu noche')).toBeInTheDocument()
      expect(screen.queryByLabelText('Me acuesto a las')).not.toBeInTheDocument()
      expect(screen.queryByText(/Todavía no has puesto tu noche/)).not.toBeInTheDocument()
    })

    it('ni una palabra de reproche en la sección (criterio 316)', async () => {
      renderWithProviders(<VidaAjustesPage />)
      await setNight('23:00', '05:00')
      const section = screen.getByRole('heading', { name: 'Tu noche' }).closest('div')!
      const text = (section.textContent ?? '').toLowerCase()

      for (const word of ['deberías', 'apenas', 'desperdicio', '¿por qué']) {
        expect(text).not.toContain(word)
      }
    })
  })
})
