import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '@/features/theme/providers/ThemeProvider'
import { useThemeStore } from '@/features/theme/store/theme.store'
import { ThemeToggle } from '@/shared/ui/ThemeToggle/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeStore.setState({ preference: 'light', resolvedTheme: 'light' })
  })

  it('cycles light → dark → system', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button', { name: /Tema: Claro/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Tema: Claro/i }))
    expect(screen.getByRole('button', { name: /Tema: Oscuro/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Tema: Oscuro/i }))
    expect(screen.getByRole('button', { name: /Tema: Sistema/i })).toBeInTheDocument()
  })
})
