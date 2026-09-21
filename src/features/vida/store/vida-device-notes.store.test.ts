import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  VIDA_DEVICE_NOTES_STORAGE_KEY,
  getBlockNote,
  isNoDataDismissed,
  useVidaDeviceNotesStore,
  vidaBlockNoteKey,
  vidaNoDataKey,
} from '@/features/vida/store/vida-device-notes.store'

/**
 * Lo único de la feature que escribe en el aparato (D7 y D8, criterios 43, 44
 * y 49). Se prueba con el `localStorage` de jsdom **y** con uno que lanza: si
 * no se puede guardar, no se rompe nada — lo único que pasa es que la
 * respuesta no se recuerda.
 */

const DATE = '2026-09-18'

function reset() {
  useVidaDeviceNotesStore.setState({ blockNotes: {}, dismissedNoData: [] })
  window.localStorage.clear()
}

beforeEach(reset)
afterEach(() => {
  vi.restoreAllMocks()
  reset()
})

describe('las claves', () => {
  it('llevan la fecha delante', () => {
    expect(vidaBlockNoteKey(DATE, 'b1')).toBe('2026-09-18|b1')
    expect(vidaNoDataKey(DATE, 'gap-08:15-10:55')).toBe('2026-09-18|gap-08:15-10:55')
  })
})

describe('«No se pudo» y su razón (criterios 43 y 44)', () => {
  it('marca el bloque **sin razón**: no contarla es una respuesta válida', () => {
    useVidaDeviceNotesStore.getState().markBlockCouldNot(DATE, 'b1', null)
    const note = getBlockNote(useVidaDeviceNotesStore.getState().blockNotes, DATE, 'b1')
    expect(note).toEqual({ couldNot: true, reason: null })
  })

  it('guarda la razón recortada y una en blanco cuenta como sin razón', () => {
    useVidaDeviceNotesStore.getState().markBlockCouldNot(DATE, 'b1', '  me quedé dormido  ')
    expect(getBlockNote(useVidaDeviceNotesStore.getState().blockNotes, DATE, 'b1')?.reason).toBe(
      'me quedé dormido',
    )
    useVidaDeviceNotesStore.getState().markBlockCouldNot(DATE, 'b1', '   ')
    expect(getBlockNote(useVidaDeviceNotesStore.getState().blockNotes, DATE, 'b1')?.reason).toBeNull()
  })

  it('se puede cambiar y quitar después', () => {
    const store = useVidaDeviceNotesStore.getState()
    store.markBlockCouldNot(DATE, 'b1', 'me quedé dormido')
    store.markBlockCouldNot(DATE, 'b1', 'se alargó la reunión')
    expect(getBlockNote(useVidaDeviceNotesStore.getState().blockNotes, DATE, 'b1')?.reason).toBe(
      'se alargó la reunión',
    )
    store.clearBlockNote(DATE, 'b1')
    expect(getBlockNote(useVidaDeviceNotesStore.getState().blockNotes, DATE, 'b1')).toBeNull()
  })

  it('cada día tiene la suya: el mismo bloque de otro día no se contagia', () => {
    useVidaDeviceNotesStore.getState().markBlockCouldNot(DATE, 'b1', 'llovía')
    const notes = useVidaDeviceNotesStore.getState().blockNotes
    expect(getBlockNote(notes, '2026-09-19', 'b1')).toBeNull()
  })

  it('quitar una nota que no existe no cambia el estado', () => {
    const before = useVidaDeviceNotesStore.getState().blockNotes
    useVidaDeviceNotesStore.getState().clearBlockNote(DATE, 'nadie')
    expect(useVidaDeviceNotesStore.getState().blockNotes).toBe(before)
  })
})

describe('«dejarlo así» de un tramo sin dato (criterio 49)', () => {
  it('se pregunta una vez: tras dejarlo así, ese tramo ya no pregunta', () => {
    const store = useVidaDeviceNotesStore.getState()
    expect(isNoDataDismissed(store.dismissedNoData, DATE, 'gap-08:15-10:55')).toBe(false)
    store.dismissNoData(DATE, 'gap-08:15-10:55')
    expect(
      isNoDataDismissed(useVidaDeviceNotesStore.getState().dismissedNoData, DATE, 'gap-08:15-10:55'),
    ).toBe(true)
  })

  it('no afecta a otro tramo ni a otro día', () => {
    useVidaDeviceNotesStore.getState().dismissNoData(DATE, 'gap-08:15-10:55')
    const { dismissedNoData } = useVidaDeviceNotesStore.getState()
    expect(isNoDataDismissed(dismissedNoData, DATE, 'gap-11:00-12:00')).toBe(false)
    expect(isNoDataDismissed(dismissedNoData, '2026-09-19', 'gap-08:15-10:55')).toBe(false)
  })

  it('dos veces el mismo no lo apunta dos veces', () => {
    const store = useVidaDeviceNotesStore.getState()
    store.dismissNoData(DATE, 'gap-1')
    store.dismissNoData(DATE, 'gap-1')
    expect(useVidaDeviceNotesStore.getState().dismissedNoData).toHaveLength(1)
  })
})

describe('el aparato', () => {
  it('escribe en `localStorage` bajo su propia clave', () => {
    useVidaDeviceNotesStore.getState().markBlockCouldNot(DATE, 'b1', 'me quedé dormido')
    const raw = window.localStorage.getItem(VIDA_DEVICE_NOTES_STORAGE_KEY)
    expect(raw).toContain('me quedé dormido')
  })

  it('con un `localStorage` que **lanza**, no se rompe nada', () => {
    vi.spyOn(window.localStorage.__proto__ as Storage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => {
      useVidaDeviceNotesStore.getState().markBlockCouldNot(DATE, 'b1', 'me quedé dormido')
      useVidaDeviceNotesStore.getState().dismissNoData(DATE, 'gap-1')
    }).not.toThrow()
    // Lo que se dijo sigue en pantalla durante esta sesión; lo único que se
    // pierde es que se recuerde para la siguiente.
    expect(getBlockNote(useVidaDeviceNotesStore.getState().blockNotes, DATE, 'b1')?.reason).toBe(
      'me quedé dormido',
    )
  })
})
