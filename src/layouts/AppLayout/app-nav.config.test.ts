import { describe, expect, it, vi } from 'vitest'
import { habitsPaths } from '@/features/habits'
import { settingsPaths } from '@/features/settings'
import { vidaPaths } from '@/features/vida'
import {
  appModules,
  createCommandActions,
  findActiveModule,
} from '@/layouts/AppLayout/app-nav.config'

function buildActions() {
  const handlers = {
    navigate: vi.fn(),
    cycleTheme: vi.fn(),
    logout: vi.fn(),
  }
  return { actions: createCommandActions(handlers), handlers }
}

describe('createCommandActions', () => {
  it('mantiene intactos los destinos de hábitos y lo transversal', () => {
    const { actions } = buildActions()
    const byId = new Map(actions.map((action) => [action.id, action]))

    // Los ids y etiquetas de hábitos son los de siempre: `⌘K` no cambia de
    // comportamiento porque ahora haya un segundo módulo.
    expect(byId.get('go-habits-my-day')?.label).toBe('Ir a Mi día')
    expect(byId.get('go-habits-list')?.label).toBe('Ir a Mis hábitos')
    expect(byId.get('go-habits-archived')?.label).toBe('Ir a Archivados')
    expect(byId.get('go-habits-categories')?.label).toBe('Ir a Categorías')
    expect(byId.get('go-habits-measures')?.label).toBe('Ir a Medidas')
    expect(byId.get('go-habits-persona')?.label).toBe('Ir a Mi Persona')
    expect(byId.get('toggle-theme')?.label).toBe('Cambiar tema')
    expect(byId.get('go-settings')?.label).toBe('Ir a Ajustes de cuenta')
    expect(byId.get('logout')?.label).toBe('Cerrar sesión')

    // Y siguen en el mismo orden relativo, delante de todo.
    expect(actions.slice(0, 6).map((action) => action.id)).toEqual([
      'go-habits-my-day',
      'go-habits-list',
      'go-habits-archived',
      'go-habits-categories',
      'go-habits-measures',
      'go-habits-persona',
    ])
    expect(actions.slice(-3).map((action) => action.id)).toEqual([
      'toggle-theme',
      'go-settings',
      'logout',
    ])
  })

  it('navega a los destinos de hábitos igual que antes', () => {
    const { actions, handlers } = buildActions()
    const byId = new Map(actions.map((action) => [action.id, action]))

    byId.get('go-habits-my-day')?.onSelect()
    byId.get('go-habits-persona')?.onSelect()
    byId.get('go-settings')?.onSelect()

    expect(handlers.navigate.mock.calls).toEqual([
      [habitsPaths.myDay],
      [habitsPaths.persona],
      [settingsPaths.root],
    ])
  })

  it('sigue delegando tema y salir sin navegar', () => {
    const { actions, handlers } = buildActions()
    const byId = new Map(actions.map((action) => [action.id, action]))

    byId.get('toggle-theme')?.onSelect()
    byId.get('logout')?.onSelect()

    expect(handlers.cycleTheme).toHaveBeenCalledTimes(1)
    expect(handlers.logout).toHaveBeenCalledTimes(1)
    expect(handlers.navigate).not.toHaveBeenCalled()
  })

  it('incluye una acción por cada sección de Vida que navega a su ruta', () => {
    const { actions, handlers } = buildActions()
    const byId = new Map(actions.map((action) => [action.id, action]))

    expect(byId.get('go-vida-hoy')?.label).toBe('Ir a Hoy')
    expect(byId.get('go-vida-plantilla')?.label).toBe('Ir a Plantilla')
    expect(byId.get('go-vida-revision')?.label).toBe('Ir a Revisión')
    expect(byId.get('go-vida-actividades')?.label).toBe('Ir a Actividades')

    byId.get('go-vida-hoy')?.onSelect()
    byId.get('go-vida-plantilla')?.onSelect()
    byId.get('go-vida-revision')?.onSelect()
    byId.get('go-vida-actividades')?.onSelect()

    expect(handlers.navigate.mock.calls).toEqual([
      [vidaPaths.hoy],
      [vidaPaths.plantilla],
      [vidaPaths.revision],
      [vidaPaths.actividades],
    ])
  })

  it('no repite ids', () => {
    const { actions } = buildActions()
    expect(new Set(actions.map((action) => action.id)).size).toBe(actions.length)
  })
})

describe('appModules', () => {
  it('describe los dos módulos con sus destinos', () => {
    expect(appModules.map((module) => module.label)).toEqual(['Hábitos', 'Vida'])

    const vida = appModules.find((module) => module.id === 'vida')
    expect(vida?.sections.map((section) => section.label)).toEqual([
      'Hoy',
      'Plantilla',
      'Revisión',
      'Actividades',
    ])
    expect(vida?.sections.map((section) => section.to)).toEqual([
      vidaPaths.hoy,
      vidaPaths.plantilla,
      vidaPaths.revision,
      vidaPaths.actividades,
    ])
    // Vida no tiene ajustes de módulo en F0: la barra no pinta el popover.
    expect(vida?.settings).toBeUndefined()
  })

  it('reconoce el módulo activo por el prefijo de la URL', () => {
    expect(findActiveModule(habitsPaths.myDay).id).toBe('habits')
    expect(findActiveModule('/app/habits/abc/week').id).toBe('habits')
    expect(findActiveModule(vidaPaths.root).id).toBe('vida')
    expect(findActiveModule(vidaPaths.revision).id).toBe('vida')
    // Fuera de todo módulo (ajustes de cuenta) manda el de casa.
    expect(findActiveModule(settingsPaths.root).id).toBe('habits')
  })
})
