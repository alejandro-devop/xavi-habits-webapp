import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  Habit,
  HabitDayEntry,
  HabitDayStatus,
} from '@/features/habits/types/habit.types'
import {
  buildWeekdayBreakdown,
  composeWeekdayFailNote,
  getMostFailedWeekday,
  getWeekdayIndex,
  type RangeSummary,
  type StreakEpisode,
} from '@/features/habits/utils/habit-panel.utils'
import { addDaysToString, getTodayString } from '@/features/habits/utils/habit-type.utils'
import { renderWithProviders } from '@/test/render'
import { HabitPanel } from './HabitPanel'
import { HabitPanelTiles } from './HabitPanelTiles'
import { HabitStreakEpisodesChart } from './HabitStreakEpisodesChart'
import { HabitWeekdayChart } from './HabitWeekdayChart'

// El panel entero pide dos veces la misma consulta (tramo y tramo previo). Se
// mockea el hook, no el transporte: esta suite prueba lo que se dibuja.
const followUpGroups = vi.hoisted(() => ({ value: [] as unknown[] }))

vi.mock('@/features/habits/hooks/useHabits', () => ({
  useHabitFollowUpsInDatesQuery: () => ({
    data: followUpGroups.value,
    isLoading: false,
    isError: false,
  }),
}))

const habit: Habit = {
  id: 'h-1',
  userId: '1',
  name: 'Meditar',
  description: null,
  habitType: 'boolean',
  periodDays: 0,
  restartCount: 3,
  weeklyLifelines: 2,
  status: 'active',
  hidden: false,
  shouldAvoid: false,
  shouldKeep: true,
  streak: 12,
  maxStreak: 21,
  days: 148,
  dailyGoal: 0,
  timerGoal: 0,
  timesGoal: 0,
  icon: null,
  color: null,
  orderIndex: 0,
  startDate: '2026-04-20',
  endDate: null,
  categoryId: null,
  measureId: null,
  purposeId: null,
  createdAt: '2026-04-20',
  updatedAt: '2026-04-20',
}

const summary: RangeSummary = {
  total: 30,
  covered: 24,
  accomplished: 22,
  lifelines: 2,
  failed: 4,
  untracked: 2,
  percent: 80,
}

const previous: RangeSummary = { ...summary, covered: 18, percent: 60 }

describe('HabitPanelTiles', () => {
  it('la ficha cuenta las veces que volviste, nunca las recaídas', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previous}
        comebacks={{ total: 3, lastDaysAgo: 34 }}
        rangeLabel="30 d"
        rangeScopeLabel="los últimos 30 días"
        avgDifficulty={null}
      />,
    )

    expect(screen.getByText('Veces que volviste')).toBeInTheDocument()
    expect(screen.getByText('La última, hace 34 días')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/reca[ií]d/i)
  })

  it('enseña la diferencia en puntos frente al periodo anterior', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previous}
        comebacks={{ total: 0, lastDaysAgo: null }}
        rangeLabel="30 d"
        rangeScopeLabel="los últimos 30 días"
        avgDifficulty={null}
      />,
    )

    expect(screen.getByText('Cumplimiento 30 d')).toBeInTheDocument()
    expect(screen.getByText('▲ 20 pts vs. periodo anterior')).toBeInTheDocument()
  })

  it('«Tu récord» es una ficha propia, con maxStreak y sin fecha inventada', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previous}
        comebacks={{ total: 3, lastDaysAgo: 34 }}
        rangeLabel="30 d"
        rangeScopeLabel="los últimos 30 días"
        avgDifficulty={null}
      />,
    )

    // La cifra del récord, con el mismo molde que «Racha actual».
    expect(screen.getByText('Tu récord')).toBeInTheDocument()
    expect(screen.getByText('21 días')).toBeInTheDocument()
    expect(screen.getByText('Racha actual')).toBeInTheDocument()
    expect(screen.getByText('12 días')).toBeInTheDocument()
    // Ya no es una nota al pie de la racha.
    expect(screen.queryByText(/Tu récord son/)).not.toBeInTheDocument()
    // Y en ningún sitio se afirma cuándo ocurrió: ese dato no existe.
    expect(document.body.textContent).not.toMatch(/récord[^.]*\b(en|de|desde|el)\s+\d{1,2}\s+de\s+\w+/i)
  })

  it('si la racha que llevas ES el récord, se dice una vez y se dice que es la misma', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={{ ...habit, streak: 21, maxStreak: 21 }}
        summary={summary}
        previous={previous}
        comebacks={{ total: 3, lastDaysAgo: 34 }}
        rangeLabel="30 d"
        rangeScopeLabel="los últimos 30 días"
        avgDifficulty={null}
      />,
    )

    expect(screen.getByText('Es la racha que llevas ahora')).toBeInTheDocument()
    expect(screen.getAllByText('21 días')).toHaveLength(2)
  })

  it('los salvavidas se enseñan con su rango, y el cero se imprime', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={{ ...summary, lifelines: 0 }}
        previous={previous}
        comebacks={{ total: 3, lastDaysAgo: 34 }}
        rangeLabel="90 d"
        rangeScopeLabel="los últimos 90 días"
        avgDifficulty={null}
      />,
    )

    const card = screen.getByText('Salvavidas usados').closest('article')
    expect(card).not.toBeNull()
    expect(within(card!).getByText('0')).toBeInTheDocument()
    expect(within(card!).getByText('En los últimos 90 días')).toBeInTheDocument()
  })

  it('sin ningún día con dificultad, la ficha de dificultad no aparece', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previous}
        comebacks={{ total: 3, lastDaysAgo: 34 }}
        rangeLabel="30 d"
        rangeScopeLabel="los últimos 30 días"
        avgDifficulty={null}
      />,
    )

    expect(screen.queryByText('Dificultad media')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/dificultad/i)
  })

  it('con dificultad anotada, la ficha dice la media y sobre cuántos días', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previous}
        comebacks={{ total: 3, lastDaysAgo: 34 }}
        rangeLabel="30 d"
        rangeScopeLabel="los últimos 30 días"
        avgDifficulty={{ average: 2.4, daysWithDifficulty: 12 }}
      />,
    )

    expect(screen.getByText('Dificultad media')).toBeInTheDocument()
    expect(screen.getByText('2,4 de 4')).toBeInTheDocument()
    expect(screen.getByText('Media de 12 días con dificultad')).toBeInTheDocument()
  })

  it('sin reproche: ninguna ficha nombra un fallo ni un desperdicio', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={previous}
        comebacks={{ total: 3, lastDaysAgo: 34 }}
        rangeLabel="30 d"
        rangeScopeLabel="los últimos 30 días"
        avgDifficulty={{ average: 2.4, daysWithDifficulty: 12 }}
      />,
    )

    expect(document.body.textContent).not.toMatch(/fallaste|desperdici|deber[ií]as/i)
  })

  it('sin periodo anterior no hay diferencia que enseñar', () => {
    renderWithProviders(
      <HabitPanelTiles
        habit={habit}
        summary={summary}
        previous={null}
        comebacks={{ total: 0, lastDaysAgo: null }}
        rangeLabel="30 d"
        rangeScopeLabel="los últimos 30 días"
        avgDifficulty={null}
      />,
    )

    expect(screen.queryByText(/pts vs\. periodo anterior/)).not.toBeInTheDocument()
    expect(screen.getByText('Todavía no has tenido que volver')).toBeInTheDocument()
  })
})

describe('HabitWeekdayChart', () => {
  /** `pattern` son los siete días de una semana (L…D), repetidos `count` veces. */
  function weekdayDays(pattern: string, count: number): HabitDayEntry[] {
    return [...pattern.repeat(count)].map((token, index) => ({
      date: addDaysToString('2026-09-07', index),
      status:
        token === '.' ? 'empty' : token === 'a' ? 'accomplished' : ('failed' as HabitDayStatus),
      followUp: null,
    }))
  }

  // Seis semanas: los domingos sin registrar, los martes fallados cuatro veces.
  const stats = buildWeekdayBreakdown([
    ...weekdayDays('afaaaa.', 4),
    ...weekdayDays('aaaaaa.', 2),
  ])
  const most = getMostFailedWeekday(stats)
  const note = composeWeekdayFailNote(stats, most)

  it('marca el día de más fallos con una etiqueta, no solo con el color', () => {
    renderWithProviders(
      <HabitWeekdayChart stats={stats} most={most} note={note} rangeLabel="90 días" />,
    )

    expect(screen.getByText('más fallos')).toBeInTheDocument()
    // La leyenda nombra el día; no lo califica.
    const legend = screen.getByText('Días fallados').closest('ul')!
    expect(within(legend).getByText('martes')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/peor día/i)
  })

  it('cuenta fallos, no porcentajes: cada barra lleva su cuenta encima', () => {
    const { container } = renderWithProviders(
      <HabitWeekdayChart stats={stats} most={most} note={note} rangeLabel="90 días" />,
    )

    const svg = container.querySelector('svg')!
    const values = [...svg.querySelectorAll('text')].map((node) => node.textContent)
    // Los fallos del martes, y el domingo sin ninguna aparición con registro.
    expect(values).toContain('4')
    expect(values).toContain('—')
    // Ningún porcentaje dibujado.
    expect(values.some((value) => value?.includes('%'))).toBe(false)
  })

  it('dice el umbral en voz alta debajo del gráfico', () => {
    renderWithProviders(
      <HabitWeekdayChart stats={stats} most={most} note={note} rangeLabel="90 días" />,
    )

    expect(
      screen.getByText('Los martes fallas 4 de 6 veces. Es el día donde más se te cae, de largo.'),
    ).toBeInTheDocument()
  })

  it('con pocas apariciones, calla y dice cuántas hay', () => {
    const few = buildWeekdayBreakdown(weekdayDays('afaaaa.', 3))
    const fewMost = getMostFailedWeekday(few)
    expect(fewMost).toBeNull()

    renderWithProviders(
      <HabitWeekdayChart
        stats={few}
        most={fewMost}
        note={composeWeekdayFailNote(few, fewMost)}
        rangeLabel="30 días"
      />,
    )

    expect(screen.queryByText('más fallos')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'De cada día de la semana hay 3 registros o menos en este tramo. Con 4 ya se puede comparar: todavía no hay bastante para decir dónde se te cae.',
      ),
    ).toBeInTheDocument()
  })

  it('lleva una tabla con los mismos números que dibuja, y el hueco aparte', () => {
    renderWithProviders(
      <HabitWeekdayChart stats={stats} most={most} note={note} rangeLabel="90 días" />,
    )

    const table = screen.getByRole('table', {
      name: 'Días fallados, cumplidos y sin registro por día de la semana',
    })
    const tuesday = within(table).getByRole('row', { name: /martes/ })
    expect(within(tuesday).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '4',
      '2',
      '0',
      '6',
    ])
    const sunday = within(table).getByRole('row', { name: /domingo/ })
    // Seis domingos sin registro: cero fallados, y el hueco dicho como hueco.
    expect(within(sunday).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '0',
      '0',
      '6',
      '0',
    ])
  })
})

describe('HabitStreakEpisodesChart', () => {
  const episodes: StreakEpisode[] = [
    {
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      length: 5,
      isCurrent: false,
      isRecord: false,
      label: 'ago',
    },
    {
      startDate: '2026-08-10',
      endDate: '2026-08-30',
      length: 21,
      isCurrent: false,
      isRecord: true,
      label: 'ago',
    },
    {
      startDate: '2026-09-06',
      endDate: '2026-09-17',
      length: 12,
      isCurrent: true,
      isRecord: false,
      label: 'sep',
    },
  ]

  it('con más de 12 rachas, la frase mira el tramo entero y no solo lo dibujado', () => {
    // Quince rachas: la más larga (21) es la más vieja y el gráfico la trunca.
    const many: StreakEpisode[] = Array.from({ length: 15 }, (_, index) => ({
      startDate: `2026-0${index < 9 ? 1 : 2}-${String((index % 9) + 1).padStart(2, '0')}`,
      endDate: `2026-0${index < 9 ? 1 : 2}-${String((index % 9) + 1).padStart(2, '0')}`,
      length: index === 0 ? 21 : 2,
      isCurrent: false,
      isRecord: index === 0,
      label: 'ene',
    }))

    renderWithProviders(<HabitStreakEpisodesChart episodes={many} lifetimeRecordDays={21} />)

    expect(screen.queryByText(/es de antes de este tramo/)).not.toBeInTheDocument()
  })

  it('rotula el mejor tramo y la racha en curso, además de distinguirlos por color', () => {
    renderWithProviders(<HabitStreakEpisodesChart episodes={episodes} />)

    // Rotulado en el dibujo y repetido en la tabla oculta.
    const chart = screen.getByRole('img')
    expect(within(chart).getByText('mejor tramo')).toBeInTheDocument()
    expect(within(chart).getByText('en curso')).toBeInTheDocument()

    const table = screen.getByRole('table', { name: 'Rachas del rango' })
    expect(within(table).getByRole('row', { name: /21 días.*mejor tramo/ })).toBeInTheDocument()
  })

  it('no llama «récord» a su episodio más largo: el récord es de toda la vida', () => {
    renderWithProviders(
      <HabitStreakEpisodesChart episodes={episodes} lifetimeRecordDays={34} />,
    )

    const chart = screen.getByRole('img')
    expect(within(chart).queryByText('récord')).not.toBeInTheDocument()
    expect(screen.getByText('Tu récord de 34 días es de antes de este tramo.')).toBeInTheDocument()
  })

  it('si el récord es la racha viva, no se dice que sea de antes', () => {
    renderWithProviders(
      <HabitStreakEpisodesChart episodes={episodes} lifetimeRecordDays={34} recordIsOngoing />,
    )

    expect(screen.queryByText(/es de antes de este tramo/)).not.toBeInTheDocument()
  })

  it('con el récord dentro del tramo no se dice nada de más', () => {
    renderWithProviders(<HabitStreakEpisodesChart episodes={episodes} lifetimeRecordDays={21} />)

    expect(screen.queryByText(/es de antes de este tramo/)).not.toBeInTheDocument()
  })
})

describe('HabitPanel · el tramo entero, con el rango en 1 año', () => {
  const today = getTodayString()
  const dayAgo = (ago: number) => addDaysToString(today, -ago)

  /**
   * Quince rachas en el tramo: la **récord** de 21 días hace 350 y catorce de
   * dos días mucho más recientes. El gráfico solo dibuja las últimas doce, así
   * que la récord **queda fuera del dibujo estando dentro del tramo**: es el
   * caso por el que se coló la frase falsa.
   */
  const dates: string[] = []
  for (let i = 0; i < 21; i += 1) dates.push(dayAgo(350 - i))
  for (let s = 0; s < 14; s += 1) {
    const base = 300 - s * 3
    dates.push(dayAgo(base))
    dates.push(dayAgo(base - 1))
  }

  const yearHabit: Habit = {
    ...habit,
    streak: 2,
    maxStreak: 21,
    startDate: addDaysToString(today, -400),
  }

  beforeEach(() => {
    followUpGroups.value = dates.map((date) => ({
      date,
      followUps: [
        {
          id: `fu-${date}`,
          date,
          habitId: habit.id,
          isAccomplished: true,
          isFailed: false,
          isLifeline: false,
          difficulty: null,
          count: null,
          time: null,
          notes: null,
        },
      ],
    }))
  })

  it('no dice que el récord sea «de antes» cuando está dentro del tramo y solo no se dibuja', () => {
    renderWithProviders(<HabitPanel habit={yearHabit} range={365} onRangeChange={() => {}} />)

    // El gráfico trunca: la racha de 21 días no está entre las doce dibujadas…
    const chart = screen.getByRole('img', { name: /rachas/i })
    expect(within(chart).queryByText('21')).not.toBeInTheDocument()
    // …pero sigue estando en el tramo, así que la frase no puede aparecer.
    expect(screen.queryByText(/es de antes de este tramo/)).not.toBeInTheDocument()
  })

  it('con un récord mayor que cualquier racha del año, sí lo dice, y sin fecha', () => {
    renderWithProviders(
      <HabitPanel habit={{ ...yearHabit, maxStreak: 40 }} range={365} onRangeChange={() => {}} />,
    )

    expect(
      screen.getByText('Tu récord de 40 días es de antes de este tramo.'),
    ).toBeInTheDocument()
  })

  it('con el rango en 1 año, los salvavidas se dicen «en el último año»', () => {
    renderWithProviders(<HabitPanel habit={yearHabit} range={365} onRangeChange={() => {}} />)

    const card = screen.getByText('Salvavidas usados').closest('article')
    expect(card).not.toBeNull()
    expect(within(card!).getByText('En el último año')).toBeInTheDocument()
    expect(within(card!).queryByText(/365 d\b/)).not.toBeInTheDocument()
  })
})

/**
 * El panel entero, con el caso obligatorio del criterio 441 montado de punta a
 * punta: lo que se cuenta tiene que ser lo que se dice. La lección de la tajada
 * 1 era justo esta —una frase decidida contra lo que cabía en el dibujo—, así
 * que aquí se comprueba sobre el panel, no sobre el gráfico suelto.
 */
describe('HabitPanel · dónde se falla', () => {
  const today = getTodayString()
  const dayAgo = (n: number) => addDaysToString(today, -n)

  const panelHabit: Habit = {
    ...habit,
    streak: 1,
    maxStreak: 4,
    startDate: addDaysToString(today, -200),
  }

  /** Los últimos 84 días (12 semanas): todo cumplido salvo lo que diga `mark`. */
  function seed(mark: (weekday: number, weekIndex: number) => 'a' | 'f' | '.') {
    const groups: unknown[] = []
    for (let i = 83; i >= 0; i -= 1) {
      const date = dayAgo(i)
      const token = mark(getWeekdayIndex(date), Math.floor((83 - i) / 7))
      if (token === '.') continue
      groups.push({
        date,
        followUps: [
          {
            id: `fu-${date}`,
            date,
            habitId: habit.id,
            isAccomplished: token === 'a',
            isFailed: token === 'f',
            isLifeline: false,
            difficulty: null,
            count: null,
            time: null,
            notes: null,
          },
        ],
      })
    }
    followUpGroups.value = groups
  }

  it('señala el día de más fallos aunque otro día esté entero sin registrar', () => {
    // Domingos sin registrar (0 fallos, 0% de cumplimiento) y martes fallados
    // cuatro de doce veces. Por porcentaje ganaba el domingo; por fallos, el martes.
    seed((weekday, week) => {
      if (weekday === 6) return '.'
      if (weekday === 1 && week < 4) return 'f'
      return 'a'
    })

    renderWithProviders(<HabitPanel habit={panelHabit} range={90} onRangeChange={() => {}} />)

    expect(screen.getByText(/^Los martes fallas 4 de 12 veces\./)).toBeInTheDocument()
    expect(screen.getByText('más fallos')).toBeInTheDocument()
    // El domingo, sin un solo registro, solo aparece en la tabla oculta y con
    // sus ceros y su hueco: no se señala ni se pinta como fallo en el dibujo.
    const chart = screen.getByRole('img', { name: /Días fallados por día de la semana/ })
    expect(chart.getAttribute('aria-label')).not.toMatch(/domingo/i)
    const sunday = within(screen.getByRole('table', { name: /Días fallados, cumplidos/ }))
      .getByRole('row', { name: /domingo/ })
    expect(within(sunday).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '0',
      '0',
      '13',
      '0',
    ])
  })

  it('no queda ni un veredicto en el panel: ni «vas peor» ni «peor día»', () => {
    seed((weekday, week) => (weekday === 1 && week < 4 ? 'f' : 'a'))

    renderWithProviders(<HabitPanel habit={panelHabit} range={90} onRangeChange={() => {}} />)

    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/vas (peor|mejor|parecido)/i)
    expect(text).not.toMatch(/peor día|punto flaco|fallaste|deber[ií]as|intenta|ánimo/i)
    // La comparación sigue existiendo: las dos cifras, sin juicio.
    expect(screen.getByText(/Cumpliste el \d+% de los días de este tramo/)).toBeInTheDocument()
  })

  it('con pocas apariciones por día el panel calla y dice qué le falta', () => {
    // Solo las tres últimas semanas registradas: tres apariciones por día.
    seed((weekday, week) => {
      if (week < 9) return '.'
      if (weekday === 1) return 'f'
      return 'a'
    })

    renderWithProviders(<HabitPanel habit={panelHabit} range={90} onRangeChange={() => {}} />)

    expect(screen.queryByText('más fallos')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'De cada día de la semana hay 3 registros o menos en este tramo. Con 4 ya se puede comparar: todavía no hay bastante para decir dónde se te cae.',
      ),
    ).toBeInTheDocument()
  })
})
