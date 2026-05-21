import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreateFollowUpFromFreeSlotModal } from '@/features/activities/components/CreateFollowUpFromFreeSlotModal'
import { renderWithProviders } from '@/test/render'

vi.mock('@/features/activities/components/ActivityPickerField', () => ({
  ActivityPickerField: ({
    value,
    onChange,
  }: {
    value: string | null
    onChange: (id: string | null) => void
  }) => (
    <select
      aria-label="Actividad"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Seleccionar</option>
      <option value="act-1">Deep work</option>
    </select>
  ),
}))

const slot = {
  id: 'free-1',
  date: '2026-05-20',
  startTime: '10:30:00',
  endTime: '11:00:00',
  durationMinutes: 30,
}

describe('CreateFollowUpFromFreeSlotModal', () => {
  it('opens with slot start time and max duration hint', () => {
    renderWithProviders(
      <CreateFollowUpFromFreeSlotModal
        open
        slot={slot}
        activities={[]}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/hora inicio/i)).toHaveValue('10:30')
    expect(screen.getByText(/espacio disponible: 10:30 → 11:00/i)).toBeInTheDocument()
  })

  it('calls onSave with valid input', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    renderWithProviders(
      <CreateFollowUpFromFreeSlotModal
        open
        slot={slot}
        activities={[]}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.selectOptions(screen.getByLabelText(/actividad/i), 'act-1')
    await user.click(screen.getByRole('button', { name: /^guardar$/i }))

    expect(onSave).toHaveBeenCalledWith({
      activityId: 'act-1',
      date: '2026-05-20',
      startTime: '10:30:00',
      durationMinutes: 30,
      notes: null,
    })
  })

  it('rejects duration that exceeds slot from chosen start time', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    renderWithProviders(
      <CreateFollowUpFromFreeSlotModal
        open
        slot={slot}
        activities={[]}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.selectOptions(screen.getByLabelText(/actividad/i), 'act-1')
    await user.clear(screen.getByLabelText(/hora inicio/i))
    await user.type(screen.getByLabelText(/hora inicio/i), '10:20')
    await user.click(screen.getByRole('button', { name: /^guardar$/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(
      screen.getAllByRole('alert').some((el) => /espacio libre/i.test(el.textContent ?? '')),
    ).toBe(true)
  })
})
