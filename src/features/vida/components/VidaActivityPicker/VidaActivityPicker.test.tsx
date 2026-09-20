import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VidaActivityPicker } from '@/features/vida/components/VidaActivityPicker'
import type { Activity } from '@/features/vida/types/activity.types'
import type { VidaItem, VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { renderWithProviders } from '@/test/render'

/**
 * **El criterio 38 de FEAT-004**: la hoja de «qué» se escribe una vez.
 *
 * Aquí se comprueban las dos mitades. La de comportamiento —la plantilla del
 * día primero y el buscador después, sobre las no archivadas— con el
 * componente montado; y la de **estructura** leyendo los fuentes de las dos
 * hojas que lo usan: si alguien vuelve a escribir un buscador dentro de una de
 * ellas, este archivo lo dice.
 */

let activities: Activity[]

vi.mock('@/features/vida/hooks/useActivities', () => ({
  useActivitiesQuery: () => ({
    data: { activities, total: activities.length },
    isPending: false,
    fetchStatus: 'idle',
    isError: false,
  }),
}))

function activity(id: string, title: string, overrides: Partial<Activity> = {}): Activity {
  return {
    id,
    userId: 1,
    title,
    description: null,
    status: 'pending',
    priority: 'medium',
    categoryId: null,
    scheduledDate: null,
    completedAt: null,
    spentTimeMinutes: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function suggestion(id: string, title: string, durationMinutes: number | null): VidaSuggestion {
  const item: VidaItem = {
    id,
    userId: 1,
    activityId: `a-${id}`,
    days: ['friday'],
    startTime: null,
    durationMinutes,
    notes: null,
    isActive: true,
    orderIndex: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    activity: { id: `a-${id}`, title, category: null },
  }
  return { item, takenToday: false }
}

const SUGGESTIONS = [suggestion('s1', 'Poner lavadora', 20), suggestion('s2', 'Pasear', null)]

beforeEach(() => {
  activities = [
    activity('a1', 'Bañarme'),
    activity('a2', 'Compra de la semana'),
    // «Archivada» en este API es `cancelled` (lo que mira `excludeArchivedActivities`).
    activity('a3', 'Lo archivado', { status: 'cancelled' }),
  ]
})

function renderPicker(props: Partial<Parameters<typeof VidaActivityPicker>[0]> = {}) {
  const onChange = vi.fn()
  renderWithProviders(
    <VidaActivityPicker
      value={null}
      onChange={onChange}
      suggestions={SUGGESTIONS}
      dayLabel="viernes"
      headingId="qué"
      {...props}
    />,
  )
  return onChange
}

describe('VidaActivityPicker — el «qué», una sola vez (criterio 38)', () => {
  it('ofrece primero la plantilla de ese día, con su duración', () => {
    renderPicker()

    expect(screen.getByRole('button', { name: 'Poner lavadora20m' })).toBeInTheDocument()
    // Sin duración no se inventa ninguna.
    expect(screen.getByRole('button', { name: 'Pasear' })).toBeInTheDocument()
  })

  it('avisa con la actividad y con lo que su plantilla decía que dura', () => {
    const onChange = renderPicker()

    fireEvent.click(screen.getByRole('button', { name: /Poner lavadora/ }))

    expect(onChange).toHaveBeenCalledWith(
      { id: 'a-s1', title: 'Poner lavadora', icon: null, color: null },
      20,
    )
  })

  it('lo que ya está puesto no se vuelve a ofrecer desde la plantilla', () => {
    renderPicker({ excludeActivityIds: ['a-s1'] })

    expect(screen.queryByRole('button', { name: /Poner lavadora/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pasear' })).toBeInTheDocument()
  })

  it('el buscador encuentra «Bañarme» escribiendo «banar», y no enseña las archivadas', () => {
    const onChange = renderPicker()

    fireEvent.change(screen.getByLabelText('Buscar entre tus actividades'), {
      target: { value: 'banar' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Bañarme' }))
    expect(onChange).toHaveBeenCalledWith(
      { id: 'a1', title: 'Bañarme', icon: null, color: null },
      null,
    )

    fireEvent.change(screen.getByLabelText('Buscar entre tus actividades'), {
      target: { value: 'archiv' },
    })
    expect(screen.queryByRole('button', { name: 'Lo archivado' })).not.toBeInTheDocument()
  })

  it('lo que no existe **no se crea aquí**: se enlaza al catálogo (criterio 34)', () => {
    renderPicker()

    fireEvent.change(screen.getByLabelText('Buscar entre tus actividades'), {
      target: { value: 'zzz' },
    })

    expect(screen.getByText('Nada con ese nombre.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crearla en Actividades' })).toHaveAttribute(
      'href',
      '/app/vida/actividades',
    )
  })

  it('con la plantilla del día vacía lo dice y manda al buscador', () => {
    renderPicker({ suggestions: [] })

    expect(
      screen.getByText('Tu plantilla de viernes no tiene nada más que ofrecer aquí. Búscalo abajo.'),
    ).toBeInTheDocument()
  })
})

describe('criterio 38 — no hay dos buscadores de actividad en el módulo', () => {
  // Los fuentes se leen con el mismo truco que `vida-vocabulary.test.ts`
  // (`import.meta.glob` + `?raw`): `node:fs` no está tipado en este proyecto.
  const sources = import.meta.glob('../*Sheet/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>

  const HOJAS = [
    '../VidaPlaceInGapSheet/VidaPlaceInGapSheet.tsx',
    '../VidaLogSessionSheet/VidaLogSessionSheet.tsx',
  ]

  it('las dos hojas existen: si el glob se rompiera, esto no probaría nada', () => {
    for (const ruta of HOJAS) expect(sources[ruta]).toBeTypeOf('string')
  })

  it.each(HOJAS)('%s monta el mismo VidaActivityPicker', (ruta) => {
    const source = sources[ruta] ?? ''
    expect(source).toContain("from '@/features/vida/components/VidaActivityPicker'")
    expect(source).toContain('<VidaActivityPicker')
  })

  it.each(HOJAS)('%s ya no trae buscador propio', (ruta) => {
    const source = sources[ruta] ?? ''
    // Quien busca actividades es el picker: ninguna hoja vuelve a llamar a la
    // consulta del catálogo ni al filtro de texto.
    expect(source).not.toContain('filterActivitiesBySearch')
    expect(source).not.toContain('useActivitiesQuery')
  })
})
