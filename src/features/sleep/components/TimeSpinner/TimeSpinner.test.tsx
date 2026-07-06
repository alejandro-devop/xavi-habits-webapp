import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimeSpinner } from '@/features/sleep/components/TimeSpinner'

describe('TimeSpinner', () => {
  it('lets the user type a two-digit minute value like 30', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<TimeSpinner label="Me dormí a las" value="22:00" onChange={onChange} />)

    const minuteInput = screen.getByLabelText('Me dormí a las — minuto')

    await user.click(minuteInput)
    await user.keyboard('30')

    expect(onChange).toHaveBeenLastCalledWith('22:30')
  })

  it('lets the user type a two-digit hour value like 23', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<TimeSpinner label="Me dormí a las" value="22:00" onChange={onChange} />)

    const hourInput = screen.getByLabelText('Me dormí a las — hora')

    await user.click(hourInput)
    await user.keyboard('23')

    expect(onChange).toHaveBeenLastCalledWith('23:00')
  })

  it('commits a single digit on blur', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<TimeSpinner label="Me dormí a las" value="22:00" onChange={onChange} />)

    const minuteInput = screen.getByLabelText('Me dormí a las — minuto')

    await user.click(minuteInput)
    await user.keyboard('3')
    await user.tab()

    expect(onChange).toHaveBeenLastCalledWith('22:03')
  })
})
