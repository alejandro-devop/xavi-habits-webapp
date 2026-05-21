import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Tabs } from '@/shared/ui/Tabs/Tabs'

function TabsDemo() {
  const [tab, setTab] = useState('a')
  return (
    <Tabs value={tab} onChange={setTab}>
      <Tabs.List>
        <Tabs.Tab value="a">Tab A</Tabs.Tab>
        <Tabs.Tab value="b">Tab B</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">Panel A</Tabs.Panel>
      <Tabs.Panel value="b">Panel B</Tabs.Panel>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('switches panels on tab click', async () => {
    const user = userEvent.setup()
    render(<TabsDemo />)

    expect(screen.getByText('Panel A')).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Tab B' }))
    expect(screen.getByText('Panel B')).toBeVisible()
  })

  it('moves focus with arrow keys', async () => {
    const user = userEvent.setup()
    render(<TabsDemo />)

    const tabA = screen.getByRole('tab', { name: 'Tab A' })
    tabA.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Tab B' })).toHaveAttribute('aria-selected', 'true')
  })
})
