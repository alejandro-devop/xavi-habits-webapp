import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { Sidebar, type SidebarNavItem } from '@/shared/ui/Sidebar'

const items: SidebarNavItem[] = [
  { to: '/app/today', label: 'Hoy', group: 'Día a día' },
  { to: '/app/habits/my-day', label: 'Hábitos', group: 'Día a día' },
  { to: '/app/notes', label: 'Notas', group: 'Pensar' },
]

describe('Sidebar', () => {
  it('renders a heading per group and keeps every destination', () => {
    renderWithProviders(<Sidebar items={items} ds="aura" />)

    expect(screen.getByText('Día a día')).toBeInTheDocument()
    expect(screen.getByText('Pensar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hoy' })).toHaveAttribute('href', '/app/today')
    expect(screen.getByRole('link', { name: 'Hábitos' })).toHaveAttribute(
      'href',
      '/app/habits/my-day',
    )
    expect(screen.getByRole('link', { name: 'Notas' })).toHaveAttribute('href', '/app/notes')
  })

  it('works without groups, as the Testing Hall demo uses it', () => {
    renderWithProviders(<Sidebar items={[{ to: '/app/today', label: 'Hoy' }]} />)

    expect(screen.getByRole('link', { name: 'Hoy' })).toBeInTheDocument()
  })
})
