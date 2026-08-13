import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QUERY_PERSIST_KEY, queryPersister } from '@/app/providers/query-persist'

const client = {
  buster: 'test',
  timestamp: Date.now(),
  clientState: { mutations: [], queries: [] },
}

describe('queryPersister', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('persiste la caché bajo la clave esperada', async () => {
    await queryPersister.persistClient(client)
    expect(window.localStorage.getItem(QUERY_PERSIST_KEY)).not.toBeNull()
  })

  it('restaura lo que persistió', async () => {
    await queryPersister.persistClient(client)
    const restored = await queryPersister.restoreClient()
    expect(restored?.buster).toBe('test')
  })

  it('removeClient borra la caché persistida', async () => {
    await queryPersister.persistClient(client)
    expect(window.localStorage.getItem(QUERY_PERSIST_KEY)).not.toBeNull()

    await queryPersister.removeClient()
    expect(window.localStorage.getItem(QUERY_PERSIST_KEY)).toBeNull()
  })

  it('ante cuota excedida no lanza, avisa y no deja una entrada truncada', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    await expect(queryPersister.persistClient(client)).resolves.not.toThrow()
    expect(warn).toHaveBeenCalledOnce()

    setItem.mockRestore()
    expect(window.localStorage.getItem(QUERY_PERSIST_KEY)).toBeNull()
  })
})
