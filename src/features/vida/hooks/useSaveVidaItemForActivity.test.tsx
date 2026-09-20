import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  planVidaItemSave,
  sortVidaDays,
  useSaveVidaItemForActivity,
} from '@/features/vida/hooks/useSaveVidaItemForActivity'
import type { VidaItem } from '@/features/vida/types/vida-item.types'

/**
 * Las dos mutaciones de F0 se mockean: aquí lo que se prueba es **la decisión**
 * —cuál se llama y con qué—, no el viaje al API, que ya tiene su test en
 * `useVidaItems.test.tsx`. Criterios 17, 19 y 20 de FEAT-002.
 */

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>
  isPending: boolean
  isError: boolean
}

let createVidaItem: MutationStub
let updateVidaItem: MutationStub

vi.mock('@/features/vida/hooks/useVidaItems', () => ({
  useCreateVidaItemMutation: () => createVidaItem,
  useUpdateVidaItemMutation: () => updateVidaItem,
}))

function buildVidaItem(overrides: Partial<VidaItem> = {}): VidaItem {
  return {
    id: 'v1',
    userId: 1,
    activityId: 'a1',
    days: ['monday', 'wednesday', 'friday'],
    notes: 'Con calma',
    isActive: true,
    orderIndex: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  createVidaItem = { mutate: vi.fn(), isPending: false, isError: false }
  updateVidaItem = { mutate: vi.fn(), isPending: false, isError: false }
})

describe('sortVidaDays', () => {
  it('ordena de lunes a domingo y no repite', () => {
    expect(sortVidaDays(['sunday', 'monday', 'friday', 'monday'])).toEqual([
      'monday',
      'friday',
      'sunday',
    ])
  })
})

describe('planVidaItemSave', () => {
  it('encendido y sin ítem: se crea (criterio 17)', () => {
    expect(
      planVidaItemSave({
        activityId: 'a1',
        item: null,
        inTemplate: true,
        days: ['friday', 'monday'],
      }),
    ).toEqual({ kind: 'create', input: { activityId: 'a1', days: ['monday', 'friday'] } })
  })

  it('encendido y con ítem: se actualiza el MISMO, nunca se crea otro (criterio 19)', () => {
    expect(
      planVidaItemSave({
        activityId: 'a1',
        item: buildVidaItem(),
        inTemplate: true,
        days: ['tuesday'],
      }),
    ).toEqual({ kind: 'update', input: { id: 'v1', days: ['tuesday'], isActive: true } })
  })

  it('encendido sobre un ítem desactivado: lo reactiva con sus días (criterios 19 y 20)', () => {
    expect(
      planVidaItemSave({
        activityId: 'a1',
        item: buildVidaItem({ isActive: false }),
        inTemplate: true,
        days: ['monday', 'wednesday', 'friday'],
      }),
    ).toEqual({
      kind: 'update',
      input: { id: 'v1', days: ['monday', 'wednesday', 'friday'], isActive: true },
    })
  })

  it('apagado con ítem activo: se desactiva, no se borra ni pierde la nota (criterio 20)', () => {
    expect(
      planVidaItemSave({ activityId: 'a1', item: buildVidaItem(), inTemplate: false, days: [] }),
    ).toEqual({ kind: 'update', input: { id: 'v1', isActive: false } })
  })

  it('apagado sin ítem, o con uno ya desactivado: no se llama a nadie', () => {
    expect(
      planVidaItemSave({ activityId: 'a1', item: null, inTemplate: false, days: [] }),
    ).toEqual({ kind: 'nothing' })
    expect(
      planVidaItemSave({
        activityId: 'a1',
        item: buildVidaItem({ isActive: false }),
        inTemplate: false,
        days: [],
      }),
    ).toEqual({ kind: 'nothing' })
  })

  it('encendido con los mismos días: no hay viaje ni toast de mentira', () => {
    expect(
      planVidaItemSave({
        activityId: 'a1',
        item: buildVidaItem(),
        inTemplate: true,
        days: ['friday', 'wednesday', 'monday'],
      }),
    ).toEqual({ kind: 'nothing' })
  })
})

describe('useSaveVidaItemForActivity', () => {
  it('llama a crear y pasa el onSuccess de quien guarda', () => {
    const { result } = renderHook(() => useSaveVidaItemForActivity())
    const onSuccess = vi.fn()

    result.current.save(
      { activityId: 'a1', item: null, inTemplate: true, days: ['monday'] },
      { onSuccess },
    )

    expect(createVidaItem.mutate).toHaveBeenCalledTimes(1)
    expect(createVidaItem.mutate.mock.calls[0]![0]).toEqual({
      activityId: 'a1',
      days: ['monday'],
    })
    // El cierre de la hoja cuelga de aquí: si esto falla, nadie lo invoca.
    expect(onSuccess).not.toHaveBeenCalled()
    createVidaItem.mutate.mock.calls[0]![1].onSuccess()
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('llama a actualizar cuando el ítem ya existe', () => {
    const { result } = renderHook(() => useSaveVidaItemForActivity())

    result.current.save({
      activityId: 'a1',
      item: buildVidaItem(),
      inTemplate: false,
      days: [],
    })

    expect(createVidaItem.mutate).not.toHaveBeenCalled()
    expect(updateVidaItem.mutate.mock.calls[0]![0]).toEqual({ id: 'v1', isActive: false })
  })

  it('sin nada que hacer corre el onSuccess igual y no viaja al API', () => {
    const { result } = renderHook(() => useSaveVidaItemForActivity())
    const onSuccess = vi.fn()

    result.current.save(
      { activityId: 'a1', item: null, inTemplate: false, days: [] },
      { onSuccess },
    )

    expect(createVidaItem.mutate).not.toHaveBeenCalled()
    expect(updateVidaItem.mutate).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('expone el pendiente y el fallo de las dos mutaciones', () => {
    updateVidaItem.isPending = true
    createVidaItem.isError = true
    const { result } = renderHook(() => useSaveVidaItemForActivity())

    expect(result.current.isPending).toBe(true)
    expect(result.current.isError).toBe(true)
  })
})
