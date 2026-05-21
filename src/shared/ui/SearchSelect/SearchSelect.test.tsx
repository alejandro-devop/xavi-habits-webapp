import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchSelect } from '@/shared/ui/SearchSelect'

const OPTIONS = [
  { label: 'Manzana', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cereza', value: 'cherry', description: 'roja' },
]

describe('SearchSelect', () => {
  it('filters options by search query', async () => {
    const user = userEvent.setup()
    render(
      <SearchSelect
        label="Fruta"
        value={null}
        options={OPTIONS}
        onChange={() => {}}
      />,
    )

    await user.click(screen.getByRole('combobox'))
    const search = screen.getByRole('searchbox')
    await user.type(search, 'ban')

    expect(screen.getByRole('option', { name: /banana/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /manzana/i })).not.toBeInTheDocument()
  })

  it('selects an option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SearchSelect label="Fruta" value={null} options={OPTIONS} onChange={onChange} />,
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /cereza/i }))

    expect(onChange).toHaveBeenCalledWith('cherry', expect.objectContaining({ value: 'cherry' }))
  })
})
