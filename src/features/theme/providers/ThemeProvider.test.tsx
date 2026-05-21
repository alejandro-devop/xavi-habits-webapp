import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'
import { ThemeProvider } from '@/features/theme/providers/ThemeProvider'
import { useThemeStore } from '@/features/theme/store/theme.store'
import { ThemeToggle } from '@/shared/ui'

function ThemeProbe() {
  const preference = useThemeStore((s) => s.preference)
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    useThemeStore.setState({ preference: 'light', resolvedTheme: 'light' })
    document.documentElement.setAttribute('data-theme', 'light')
  })

  it('applies data-theme on document when preference changes', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    await user.click(screen.getByRole('button', { name: /Tema: Claro/i }))

    expect(screen.getByTestId('preference')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
