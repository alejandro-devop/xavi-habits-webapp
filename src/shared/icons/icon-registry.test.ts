import { describe, expect, it, vi } from 'vitest'

/**
 * El `setup` de los tests registra el catálogo entero para que nadie tenga que
 * esperarlo. Aquí interesa justo lo contrario: cómo arranca la app de verdad,
 * con el catálogo todavía en su trozo perezoso. `resetModules` devuelve un
 * registro recién evaluado, sin lo que registró el setup.
 */
async function freshRegistry() {
  vi.resetModules()
  return import('@/shared/icons/icon-registry')
}

describe('registro de iconos', () => {
  it('trae los iconos del cromo antes de que llegue el catálogo', async () => {
    const registry = await freshRegistry()

    expect(registry.isIconCatalogLoaded()).toBe(false)
    // El cromo: lo que pinta la barra superior en el primer render.
    expect(registry.getRegisteredIcon('search')).toBeTruthy()
    expect(registry.getRegisteredIcon('bell')).toBeTruthy()
    // Un icono de hábito todavía no: viaja en el trozo perezoso.
    expect(registry.getRegisteredIcon('dumbbell')).toBeNull()
  })

  it('completa el registro cuando se pide el catálogo', async () => {
    const registry = await freshRegistry()

    await registry.loadIconCatalog()

    expect(registry.isIconCatalogLoaded()).toBe(true)
    expect(registry.getRegisteredIcon('dumbbell')).toBeTruthy()
    expect(registry.hasRegisteredIcon('person-hiking')).toBe(true)
    // Y el cromo sigue en su sitio.
    expect(registry.getRegisteredIcon('search')).toBeTruthy()
  })

  it('avisa a quien esté pintando cuando el catálogo aterriza', async () => {
    const registry = await freshRegistry()
    const listener = vi.fn()

    const unsubscribe = registry.subscribeToIconCatalog(listener)
    await registry.loadIconCatalog()
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    registry.registerIconCatalog([])
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('pide el catálogo una sola vez aunque se lo pidan muchos iconos', async () => {
    const registry = await freshRegistry()
    const listener = vi.fn()
    registry.subscribeToIconCatalog(listener)

    await Promise.all([
      registry.loadIconCatalog(),
      registry.loadIconCatalog(),
      registry.loadIconCatalog(),
    ])

    expect(listener).toHaveBeenCalledTimes(1)
  })
})
