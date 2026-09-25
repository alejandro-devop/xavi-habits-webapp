import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VidaAgendaGap } from '@/features/vida/components/VidaAgendaGap'
import type { AgendaGap } from '@/features/vida/utils/vida-agenda.utils'
import { renderWithProviders } from '@/test/render'

/**
 * **La tolerancia del hueco** (FEAT-014, tajada 1).
 *
 * Lo que se comprueba aquí es la puerta: quién trae «Registrar lo que hice» y
 * quién se queda en la línea fina. La tarjeta grande es de FEAT-003 y FEAT-011;
 * lo que estrena esta feature es el tramo de **5 a 14 minutos ya pasado**, que
 * antes no tenía nada que pulsar.
 *
 * **Y desde FEAT-010 tajada 3, lo que el hueco futuro ofrece** (segundo
 * `describe`): las fichas de sugerencia se retiraron —criterio 381, que deroga
 * el 18 en su parte de fichas y el 19 y el 23 enteros de FEAT-003— y lo que
 * queda es la franja, el tamaño y **«+ otra cosa»** (criterio 382).
 */

function makeGap(partial: Partial<AgendaGap> & { startMinutes: number; endMinutes: number }): AgendaGap {
  const durationMinutes = partial.endMinutes - partial.startMinutes
  return {
    kind: 'gap',
    id: `gap-${partial.startMinutes}-${partial.endMinutes}`,
    trackMinutes: durationMinutes,
    durationMinutes,
    // El mismo cálculo que `buildDayAgenda`: por debajo de 15 no cabe ninguna
    // píldora, así que el hueco es fino.
    isSliver: durationMinutes < 15,
    isPast: false,
    nextBlockTitle: null,
    ...partial,
  }
}

function renderGap(gap: AgendaGap, props: Partial<Parameters<typeof VidaAgendaGap>[0]> = {}) {
  return renderWithProviders(
    <ul>
      <VidaAgendaGap gap={gap} dayLabel="viernes" {...props} />
    </ul>,
  )
}

describe('VidaAgendaGap — la tolerancia del hueco (FEAT-014)', () => {
  it('un hueco pasado de 13 min trae «Registrar lo que hice», con la tarjeta de siempre (criterio 401)', async () => {
    const onLogPast = vi.fn()
    // 9:47 – 10:00, entre dos bloques que ya pasaron.
    const gap = makeGap({ startMinutes: 587, endMinutes: 600, isPast: true })
    expect(gap.isSliver).toBe(true)

    renderGap(gap, { onLogPast })

    const button = screen.getByRole('button', {
      name: 'Registrar lo que hiciste entre las 9:47 y las 10:00',
    })
    expect(button).toHaveTextContent('Registrar lo que hice')
    // La misma tarjeta del hueco pasado grande (criterio 220), no una variante
    // corta: su rótulo y su tamaño están donde estaban.
    expect(screen.getByRole('region', { name: 'Libre de 9:47 – 10:00' })).toBeInTheDocument()
    expect(screen.getByText('13m')).toBeInTheDocument()

    await userEvent.click(button)
    expect(onLogPast).toHaveBeenCalledWith(gap)
  })

  it('en 5 minutos exactos se ofrece y en 4 no (criterios 402 y 403, D1)', () => {
    const view = renderGap(makeGap({ startMinutes: 600, endMinutes: 605, isPast: true }), {
      onLogPast: vi.fn(),
    })
    expect(screen.getByRole('button', { name: /^Registrar lo que hiciste/ })).toBeInTheDocument()
    view.unmount()

    renderGap(makeGap({ startMinutes: 600, endMinutes: 604, isPast: true }), {
      onLogPast: vi.fn(),
    })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    // Exactamente la línea de antes: sus horas y sus minutos.
    expect(screen.getByText('Libre 10:00 – 10:04 · 4m')).toBeInTheDocument()
  })

  it('sin nadie que escuche el registro, el hueco corto pasado sigue siendo la línea fina (criterio 402)', () => {
    renderGap(makeGap({ startMinutes: 587, endMinutes: 600, isPast: true }))

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Libre 9:47 – 10:00 · 13m')).toBeInTheDocument()
  })

  it('la salida de planear no se mueve: un hueco corto que aún no ha llegado se ve igual que antes (criterio 404)', () => {
    renderGap(makeGap({ startMinutes: 587, endMinutes: 600 }), {
      onOpenSheet: vi.fn(),
      onLogPast: vi.fn(),
    })

    // Ni fichas, ni «+ otra cosa», ni «Registrar»: en 13 minutos futuros no cabe
    // ninguna píldora y no hay nada vivido que contar.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Libre 9:47 – 10:00 · 13m')).toBeInTheDocument()
  })

  it('el hueco corto pasado no ofrece planear: ni fichas ni «+ otra cosa» (criterio 404)', () => {
    renderGap(makeGap({ startMinutes: 587, endMinutes: 600, isPast: true }), {
      onOpenSheet: vi.fn(),
      onLogPast: vi.fn(),
    })

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByText('+ otra cosa')).not.toBeInTheDocument()
  })

  it('en un día de la tira el hueco corto también cuenta, y en uno futuro no (criterios 409 y 404)', () => {
    const view = renderGap(makeGap({ startMinutes: 587, endMinutes: 600 }), {
      onLogPast: vi.fn(),
      isPastDay: true,
    })
    expect(screen.getByRole('button', { name: /^Registrar lo que hiciste/ })).toBeInTheDocument()
    view.unmount()

    // Un día futuro no trae `onLogPast`: ahí no hay nada que contar.
    renderGap(makeGap({ startMinutes: 587, endMinutes: 600 }))
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('el hueco se encoge con el umbral nuevo: 5 quedan contables, 3 no (criterio 408)', () => {
    // De los 13 minutos se registraron 8: quedan 5 y el renglón sigue ofreciendo.
    const view = renderGap(makeGap({ startMinutes: 595, endMinutes: 600, isPast: true }), {
      onLogPast: vi.fn(),
    })
    expect(screen.getByRole('button', { name: /^Registrar lo que hiciste/ })).toBeInTheDocument()
    view.unmount()

    // Se registraron 10: quedan 3 y vuelve a ser la línea fina sin salida.
    renderGap(makeGap({ startMinutes: 597, endMinutes: 600, isPast: true }), {
      onLogPast: vi.fn(),
    })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Libre 9:57 – 10:00 · 3m')).toBeInTheDocument()
  })
})

/**
 * **Lo que queda del hueco futuro tras retirar las fichas** (FEAT-010, tajada
 * 3). Estos casos sustituyen a los que afirmaban el comportamiento derogado —el
 * `describe` de `suggestionsForGap` en `vida-agenda.utils.test.ts` y los chips
 * de «sueles tardar»—: no se borraron a secas, se cambiaron por los que
 * afirman lo nuevo.
 */
describe('VidaAgendaGap — el hueco sin fichas (FEAT-010, criterios 381 y 382)', () => {
  // 10:30 – 13:00: un hueco grande y por delante, el caso donde antes se
  // pintaban hasta tres fichas y el «+N más».
  const futuro = makeGap({ startMinutes: 630, endMinutes: 780 })

  it('criterio 382 — «+ otra cosa» sigue ahí y abre la hoja con el hueco', async () => {
    const onOpenSheet = vi.fn()
    renderGap(futuro, { onOpenSheet })

    const boton = screen.getByRole('button', { name: 'Poner otra cosa a las 10:30' })
    expect(boton).toHaveTextContent('+ otra cosa')

    await userEvent.click(boton)
    expect(onOpenSheet).toHaveBeenCalledWith(futuro)
  })

  it('criterio 382 — el hueco sigue diciendo su franja y su tamaño', () => {
    renderGap(futuro, { onOpenSheet: vi.fn() })

    expect(screen.getByRole('region', { name: 'Libre de 10:30 – 13:00' })).toBeInTheDocument()
    expect(screen.getByText('Libre 10:30 – 13:00')).toBeInTheDocument()
    expect(screen.getByText('2h 30')).toBeInTheDocument()
  })

  it('criterio 381 — ninguna ficha de plantilla, ni «+N más», ni «sueles tardar»', () => {
    renderGap(futuro, { onOpenSheet: vi.fn(), templateCount: 4 })

    // Un solo control en el hueco: la vía explícita. Ni tres fichas ni un
    // resumen de las que no caben.
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByText(/más$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/sueles tardar/)).not.toBeInTheDocument()
    expect(screen.queryByText(/lo que cabe aquí/)).not.toBeInTheDocument()
  })

  it('criterio 381 — la rama de plantilla vacía no se pierde: llega por `templateCount`', () => {
    renderGap(futuro, { onOpenSheet: vi.fn(), showTemplateHint: true, templateCount: 0 })

    expect(
      screen.getByText('Todavía no tienes nada en tu plantilla para los viernes.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver tus actividades' })).toBeInTheDocument()
    // Y con plantilla, ni rastro del aviso.
    expect(screen.getByRole('button', { name: 'Poner otra cosa a las 10:30' })).toBeInTheDocument()
  })

  it('criterio 381 — con plantilla, el hueco no explica nada: solo la salida', () => {
    renderGap(futuro, { onOpenSheet: vi.fn(), showTemplateHint: true, templateCount: 3 })

    expect(screen.queryByText(/Todavía no tienes nada en tu plantilla/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
