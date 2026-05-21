import { describe, expect, it } from 'vitest'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import { appSidebarItems } from '@/layouts/AppLayout/app-nav.config'

describe('appSidebarItems', () => {
  it('includes a single Activities entry pointing to module root', () => {
    const activityItems = appSidebarItems.filter((item) =>
      item.to.startsWith('/app/activities'),
    )
    expect(activityItems).toHaveLength(1)
    expect(activityItems[0]).toMatchObject({
      to: activitiesPaths.root,
      label: 'Actividades',
    })
  })

  it('does not expose internal categories route in global menu', () => {
    const paths = appSidebarItems.map((item) => item.to)
    expect(paths).not.toContain(activitiesPaths.categories)
  })
})
