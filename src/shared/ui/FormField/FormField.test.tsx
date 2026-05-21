import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from '@/shared/ui/FormField/FormField'

describe('FormField', () => {
  it('links error message and sets aria-invalid', () => {
    render(
      <FormField
        id="email"
        label="Correo"
        error="El correo es obligatorio."
        defaultValue=""
      />,
    )

    const input = screen.getByLabelText('Correo')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('El correo es obligatorio.')
  })

  it('renders helper text with describedby', () => {
    render(
      <FormField id="name" label="Nombre" helperText="Tu nombre visible" defaultValue="" />,
    )

    const input = screen.getByLabelText('Nombre')
    expect(input).toHaveAttribute('aria-describedby', 'name-hint')
    expect(screen.getByText('Tu nombre visible')).toBeInTheDocument()
  })
})
