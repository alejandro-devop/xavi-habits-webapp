import { describe, expect, it } from 'vitest'
import { resolveBreadcrumbs } from '@/layouts/AppLayout/app-breadcrumbs'

describe('resolveBreadcrumbs', () => {
  it('names the module and the section when the route has one declared', () => {
    expect(resolveBreadcrumbs('/app/habits/list')).toEqual([
      { label: 'Hábitos', to: '/app/habits/my-day' },
      { label: 'Mis hábitos' },
    ])
  })

  it('shows only the module when the route has no declared section', () => {
    expect(resolveBreadcrumbs('/app/todos')).toEqual([{ label: 'Tareas' }])
  })

  it('does not invent levels for routes the config does not know', () => {
    expect(resolveBreadcrumbs('/app/habits/abc123/week')).toEqual([{ label: 'Hábitos' }])
  })

  it('returns nothing for a module outside the menu', () => {
    expect(resolveBreadcrumbs('/app/unknown')).toEqual([])
  })
})
