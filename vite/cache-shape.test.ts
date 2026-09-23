import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  collectShapeSources,
  computeCacheShapeId,
  isShapeSourceByPath,
  writesCacheByHand,
} from './cache-shape'

/**
 * Este fichero comprueba la **sensibilidad** del invalidador: que cambie cuando
 * cambia la forma de los datos y que no cambie cuando solo cambia la pintura.
 * Que la caché vieja no se hidrate de verdad se demuestra en
 * `src/app/providers/query-persist.hydration.test.tsx`, montando la app.
 */

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

let root = ''

function write(rel: string, content: string): void {
  const full = path.join(root, rel)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, content, 'utf-8')
}

/** Un repositorio de mentira con la misma distribución de carpetas que el real. */
function seedFakeRepo(): void {
  write('src/features/vida/graphql/vida-goals.graphql.ts', 'export const Q = `{ goal { id } }`\n')
  write('src/features/vida/api/vida-goals.api.ts', 'export const getGoals = () => null\n')
  write('src/shared/api/query-keys.ts', 'export const vidaKeys = { all: ["vida"] }\n')
  write('src/shared/api/graphql-client.ts', 'export const graphqlRequest = () => null\n')
  // El hook que **fabrica** el objeto cacheado (regla 2), y uno que solo lo lee.
  write(
    'src/features/vida/hooks/useActivityFollowUps.ts',
    'const f = (c) => c.setQueryData(k, (open) => ({ ...open, ...data }))\n',
  )
  write('src/features/vida/hooks/useVidaItems.ts', 'export const useVidaItems = () => null\n')
  write('src/features/vida/pages/VidaHoyPage.tsx', 'export function VidaHoyPage() { return null }\n')
  write('src/features/vida/pages/VidaHoyPage.module.scss', '.page { color: red; }\n')
  write('src/features/vida/api/vida-goals.api.test.ts', 'it("x", () => {})\n')
  write('src/features/vida/graphql/schema/vida.schema.graphql', 'type Goal { id: ID! }\n')
}

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'cache-shape-'))
  seedFakeRepo()
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('regla 1 — por ruta (isShapeSourceByPath)', () => {
  it('toma los documentos GraphQL, la capa api y TODO el transporte de shared/api', () => {
    expect(isShapeSourceByPath('src/features/vida/graphql/vida-goals.graphql.ts')).toBe(true)
    expect(isShapeSourceByPath('src/features/vida/api/vida-goals.api.ts')).toBe(true)
    expect(isShapeSourceByPath('src/shared/api/query-keys.ts')).toBe(true)
    // El embudo único: un cambio de una línea aquí reforma el 100 % de lo
    // cacheado. Entra la carpeta entera para que un transporte nuevo entre solo.
    expect(isShapeSourceByPath('src/shared/api/graphql-client.ts')).toBe(true)
    expect(isShapeSourceByPath('src/shared/api/rest-client.ts')).toBe(true)
  })

  it('deja fuera páginas, estilos, hooks y tests', () => {
    expect(isShapeSourceByPath('src/features/vida/pages/VidaHoyPage.tsx')).toBe(false)
    expect(isShapeSourceByPath('src/features/vida/pages/VidaHoyPage.module.scss')).toBe(false)
    expect(isShapeSourceByPath('src/features/vida/hooks/useVidaGoals.ts')).toBe(false)
    expect(isShapeSourceByPath('src/features/vida/api/vida-goals.api.test.ts')).toBe(false)
    expect(isShapeSourceByPath('src/shared/api/graphql-client.test.ts')).toBe(false)
  })
})

describe('regla 2 — por contenido (writesCacheByHand)', () => {
  it('reconoce las tres formas de escribir en la caché a mano', () => {
    expect(writesCacheByHand('queryClient.setQueryData(k, v)')).toBe(true)
    expect(writesCacheByHand('queryClient.setQueriesData({ queryKey }, v)')).toBe(true)
    expect(writesCacheByHand('queryClient.setQueryState(k, s)')).toBe(true)
  })

  it('no reconoce a quien solo lee la caché', () => {
    expect(writesCacheByHand('const { data } = useQuery({ queryKey, queryFn })')).toBe(false)
    expect(writesCacheByHand('queryClient.invalidateQueries({ queryKey })')).toBe(false)
    expect(writesCacheByHand('queryClient.getQueryData(k)')).toBe(false)
  })
})

describe('computeCacheShapeId', () => {
  it('es estable si no se toca nada', () => {
    expect(computeCacheShapeId(root)).toBe(computeCacheShapeId(root))
  })

  it('cambia si cambia un documento GraphQL', () => {
    const antes = computeCacheShapeId(root)
    write(
      'src/features/vida/graphql/vida-goals.graphql.ts',
      'export const Q = `{ goal { id activeDays } }`\n',
    )
    expect(computeCacheShapeId(root)).not.toBe(antes)
  })

  it('cambia si cambia la capa api', () => {
    const antes = computeCacheShapeId(root)
    write('src/features/vida/api/vida-goals.api.ts', 'export const getGoals = () => []\n')
    expect(computeCacheShapeId(root)).not.toBe(antes)
  })

  it('cambia si cambia el espacio de claves', () => {
    const antes = computeCacheShapeId(root)
    write('src/shared/api/query-keys.ts', 'export const vidaKeys = { all: ["vida", "v2"] }\n')
    expect(computeCacheShapeId(root)).not.toBe(antes)
  })

  it('cambia si aparece un documento nuevo', () => {
    const antes = computeCacheShapeId(root)
    write('src/features/vida/graphql/vida-sleep.graphql.ts', 'export const S = `{ sleep { id } }`\n')
    expect(computeCacheShapeId(root)).not.toBe(antes)
  })

  it('cambia si cambia el embudo único de GraphQL', () => {
    const antes = computeCacheShapeId(root)
    write('src/shared/api/graphql-client.ts', 'export const graphqlRequest = () => ({ data: 1 })\n')
    expect(computeCacheShapeId(root)).not.toBe(antes)
  })

  it('cambia si cambia un hook que fabrica el objeto cacheado', () => {
    const antes = computeCacheShapeId(root)
    write(
      'src/features/vida/hooks/useActivityFollowUps.ts',
      'const f = (c) => c.setQueryData(k, (open) => ({ ...open, ...data, extra: 1 }))\n',
    )
    expect(computeCacheShapeId(root)).not.toBe(antes)
  })

  it('NO cambia si cambia un hook que solo consume la forma', () => {
    const antes = computeCacheShapeId(root)
    write('src/features/vida/hooks/useVidaItems.ts', 'export const useVidaItems = () => []\n')
    expect(computeCacheShapeId(root)).toBe(antes)
  })

  it('un hook entra el día que escribe en la caché, sin tocar cache-shape.ts', () => {
    const antes = computeCacheShapeId(root)
    write('src/features/vida/hooks/useVidaItems.ts', 'const g = (c) => c.setQueryData(k, v)\n')
    const despues = computeCacheShapeId(root)
    expect(despues).not.toBe(antes)
    expect(collectShapeSources(root)).toContain('src/features/vida/hooks/useVidaItems.ts')
  })

  it('el hash es sensible al byte: un espacio al final ya lo cambia', () => {
    const antes = computeCacheShapeId(root)
    write('src/shared/api/query-keys.ts', 'export const vidaKeys = { all: ["vida"] }\n ')
    // Documentado a propósito: un falso positivo cuesta una apertura fría, un
    // falso negativo cuesta una pantalla en blanco.
    expect(computeCacheShapeId(root)).not.toBe(antes)
  })

  it('NO cambia si solo cambia la pintura: página, estilos y tests', () => {
    const antes = computeCacheShapeId(root)
    write('src/features/vida/pages/VidaHoyPage.tsx', 'export function VidaHoyPage() { return <p/> }\n')
    write('src/features/vida/pages/VidaHoyPage.module.scss', '.page { color: blue; }\n')
    write('src/features/vida/api/vida-goals.api.test.ts', 'it("y", () => {})\n')
    expect(computeCacheShapeId(root)).toBe(antes)
  })

  it('si no encuentra ninguna fuente, falla hacia el lado seguro y cambia siempre', () => {
    const vacio = mkdtempSync(path.join(tmpdir(), 'cache-shape-vacio-'))
    try {
      const a = computeCacheShapeId(vacio)
      expect(a).toMatch(/^sin-fuentes-/)
    } finally {
      rmSync(vacio, { recursive: true, force: true })
    }
  })
})

describe('sobre los ficheros reales del repositorio', () => {
  it('recoge los documentos y la capa api de verdad, y nada de la pintura', () => {
    const fuentes = collectShapeSources(REPO_ROOT)

    expect(fuentes).toContain('src/features/vida/graphql/vida-goals.graphql.ts')
    expect(fuentes).toContain('src/features/vida/api/vida-goals.api.ts')
    expect(fuentes).toContain('src/features/habits/api/habits.api.ts')
    expect(fuentes).toContain('src/shared/api/query-keys.ts')
    // Regla 1, el transporte entero (hallazgo del revisor).
    expect(fuentes).toContain('src/shared/api/graphql-client.ts')
    // Regla 2: los dos hooks que hoy fabrican el objeto cacheado.
    expect(fuentes).toContain('src/features/vida/hooks/useActivityFollowUps.ts')
    expect(fuentes).toContain('src/features/settings/hooks/useUserSettings.ts')

    // Y el resto de `hooks/` sigue fuera: la regla 2 es estrecha a propósito.
    const hooks = fuentes.filter((f) => f.includes('/hooks/'))
    expect(hooks).toHaveLength(2)

    expect(fuentes.some((f) => f.includes('/pages/'))).toBe(false)
    expect(fuentes.some((f) => f.includes('/components/'))).toBe(false)
    expect(fuentes.some((f) => f.endsWith('.scss'))).toBe(false)
    expect(fuentes.some((f) => f.includes('.test.'))).toBe(false)
    // El SDL vendorizado no entra: es una copia del esquema del API, no nuestra
    // forma, y se recopia a mano (ver ENVIRONMENT.md).
    expect(fuentes.some((f) => f.includes('/schema/'))).toBe(false)
  })

  it('produce un identificador corto y estable', () => {
    expect(computeCacheShapeId(REPO_ROOT)).toMatch(/^[0-9a-f]{12}$/)
  })
})
