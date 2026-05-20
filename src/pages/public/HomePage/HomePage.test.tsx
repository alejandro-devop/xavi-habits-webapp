import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { HomePage } from '@/pages/public/HomePage/HomePage'

describe('public HomePage', () => {
  it('renders branding and auth CTAs', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Xavi' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/auth/register')
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/auth/login',
    )
  })
})
