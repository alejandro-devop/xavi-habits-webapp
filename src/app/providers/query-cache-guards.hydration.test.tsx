import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { render, screen, waitFor } from '@testing-library/react'
import { Component, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CACHE_GUARDS,
  resetAvisoDeGuardas,
  sanitizePersistedClient,
} from '@/app/providers/query-cache-guards'
import {
  QUERY_PERSIST_KEY,
  queryPersistBuster,
  queryPersistOptions,
} from '@/app/providers/query-persist'
import { vidaKeys } from '@/shared/api/query-keys'

/**
 * El caso que la tajada 1 **no puede** cubrir: la forma cambió **en el
 * servidor**, así que el invalidador acierta —mismo hash, la caché se considera
 * buena— y aun así lo que hay guardado tiene la forma vieja.
 *
 * Es el mismo arnés de la tajada 1 (`query-persist.hydration.test.tsx`, que no
 * se toca) con una diferencia deliberada: **se siembra con
 * `queryPersistBuster`**, el de hoy. Ese caso exacto es el que allí produce la
 * pantalla de error —criterio 598, el control— y aquí tiene que producir una
 * pantalla **de pie**. Si algún día esto se rompe, allí sigue el control que
 * demuestra que el arnés sabe reproducir el fallo.
 */

const CARGANDO = 'Cargando tu día…'
const PANTALLA_DE_ERROR = 'Unexpected Application Error'

type Categoria = { id: string; name: string; goal: { id: string; activeDays?: string[] } | null }
type BloqueDelPlan = { id: string; startTime: string; endTime: string }

const CATEGORIA_FORMA_VIEJA = { id: 'cat-1', name: 'Trabajo', goal: { id: 'goal-1' } }
const CATEGORIA_FORMA_NUEVA = {
  id: 'cat-1',
  name: 'Trabajo',
  goal: { id: 'goal-1', activeDays: ['MON'] },
}
const BLOQUE_SANO: BloqueDelPlan = { id: 'plan-1', startTime: '09:00', endTime: '10:00' }

type ItemDePlantilla = { id: string; days?: string[] }
/** El ítem tal y como lo manda el servidor hoy. */
const ITEM_SANO: ItemDePlantilla = { id: 'it-1', days: ['monday'] }
/** El mismo, si el servidor dejara de mandar `days`: la devolución 1. */
const ITEM_SIN_DAYS: ItemDePlantilla = { id: 'it-1' }
/**
 * `followUps.range` devuelve grupos por día, **sin `id` ni `startTime`**. Es
 * forma legítima, y la guarda única de `followUps` la rechazaba entera: caché
 * sana tirada en cada arranque (devolución 2).
 */
const GRUPOS_DE_REVISION = [
  { date: '2026-09-22', followUps: [{ id: 'fu-1', startTime: '09:00' }] },
]

const HOY = '2026-09-23'

/** El gesto que tumbó Hoy, sin red debajo, igual que en la tajada 1. */
function ArcoDeHoy() {
  const { data } = useQuery<Categoria[]>({
    queryKey: vidaKeys.categories.list(),
    queryFn: () => new Promise<Categoria[]>(() => {}),
  })
  if (!data) return <p>{CARGANDO}</p>
  return <p>{data[0].goal!.activeDays!.includes('MON') ? 'hoy cuenta' : 'hoy no cuenta'}</p>
}

/** Una segunda consulta, sana, para ver que no se tira la caché entera. */
function AgendaDeHoy() {
  const { data } = useQuery<BloqueDelPlan[]>({
    queryKey: vidaKeys.dayPlan.byDate(HOY),
    queryFn: () => new Promise<BloqueDelPlan[]>(() => {}),
  })
  if (!data) return <p>agenda sin cargar</p>
  return <p>{`agenda desde ${data[0].startTime}`}</p>
}

/**
 * El segundo gesto que puede tumbar Hoy, y el que se coló en la primera vuelta:
 * `item.days.includes(...)` sin red. Es lo que hace `templateItemsForDate`
 * (`vida-build-day.utils.ts:80`), que `VidaTemplateAside` llama en el primer
 * pintado de Hoy.
 */
function PlantillaDeManana() {
  const { data } = useQuery<ItemDePlantilla[]>({
    queryKey: vidaKeys.items.list(false),
    queryFn: () => new Promise<ItemDePlantilla[]>(() => {}),
  })
  if (!data) return <p>plantilla sin cargar</p>
  const deLunes = data.filter((item) => item.days!.includes('monday'))
  return <p>{`mañana ${deLunes.length}`}</p>
}

/** Revisión: recorre cada grupo de días y su lista de sesiones. */
function HistoriaDeLaSemana() {
  const { data } = useQuery<Array<{ date: string; followUps: unknown[] }>>({
    queryKey: vidaKeys.followUps.range('2026-09-21', '2026-09-27'),
    queryFn: () => new Promise<Array<{ date: string; followUps: unknown[] }>>(() => {}),
  })
  if (!data) return <p>historia sin cargar</p>
  return <p>{`historia ${data[0].followUps.length}`}</p>
}

class Frontera extends Component<{ children: ReactNode }, { roto: boolean }> {
  state = { roto: false }
  static getDerivedStateFromError() {
    return { roto: true }
  }
  render() {
    if (this.state.roto) return <p>{PANTALLA_DE_ERROR}</p>
    return this.props.children
  }
}

/** Siembra `localStorage` con el mismo formato que deja el persister. */
function sembrarCache(entradas: Array<[readonly unknown[], unknown]>, buster: string): void {
  const clienteDeAyer = new QueryClient()
  for (const [key, data] of entradas) clienteDeAyer.setQueryData(key, data)
  window.localStorage.setItem(
    QUERY_PERSIST_KEY,
    JSON.stringify({ buster, timestamp: Date.now(), clientState: dehydrate(clienteDeAyer) }),
  )
  clienteDeAyer.clear()
}

/**
 * El persister **sin** la red de abajo: el mismo almacenamiento, pero con el
 * `JSON.parse` por defecto. Sirve para una sola cosa: demostrar que el arnés
 * sigue sabiendo reproducir el fallo, y que lo que lo evita arriba son las
 * guardas y no un descuido del test.
 */
const persisterSinGuardas = createAsyncStoragePersister({
  key: QUERY_PERSIST_KEY,
  storage: window.localStorage,
})

function montarLaApp(persistOptions = queryPersistOptions) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 1000 * 60 * 60 * 24 } },
  })
  return render(
    <PersistQueryClientProvider client={client} persistOptions={persistOptions}>
      <Frontera>
        <ArcoDeHoy />
        <AgendaDeHoy />
        <PlantillaDeManana />
        <HistoriaDeLaSemana />
      </Frontera>
    </PersistQueryClientProvider>,
  )
}

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  window.localStorage.clear()
  resetAvisoDeGuardas()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('la forma cambia en el servidor y el invalidador acierta', () => {
  it('la caché con forma vieja no se hidrata y la pantalla queda de pie', async () => {
    // Mismo invalidador que hoy: para la tajada 1 esta caché es buena.
    sembrarCache([[vidaKeys.categories.list(), [CATEGORIA_FORMA_VIEJA]]], queryPersistBuster)

    montarLaApp()

    expect(await screen.findByText(CARGANDO)).toBeInTheDocument()
    expect(screen.queryByText(PANTALLA_DE_ERROR)).not.toBeInTheDocument()
    expect(warn).toHaveBeenCalledOnce()
  })

  it('tira solo la entrada mala: lo que sigue siendo válido se hidrata igual', async () => {
    sembrarCache(
      [
        [vidaKeys.categories.list(), [CATEGORIA_FORMA_VIEJA]],
        [vidaKeys.dayPlan.byDate(HOY), [BLOQUE_SANO]],
      ],
      queryPersistBuster,
    )

    montarLaApp()

    // La sana llega al primer pintado…
    expect(await screen.findByText('agenda desde 09:00')).toBeInTheDocument()
    // …y la envenenada no, sin llevarse la pantalla por delante.
    expect(screen.getByText(CARGANDO)).toBeInTheDocument()
    expect(screen.queryByText(PANTALLA_DE_ERROR)).not.toBeInTheDocument()
  })

  it('no estorba a la caché buena: con la forma de hoy se hidrata entera', async () => {
    // Se siembran **las cuatro** formas legítimas, incluida la de
    // `followUps.range`, que es la que la guarda única rechazaba en silencio. El
    // test anterior no la sembraba y por eso no vio nada.
    sembrarCache(
      [
        [vidaKeys.categories.list(), [CATEGORIA_FORMA_NUEVA]],
        [vidaKeys.dayPlan.byDate(HOY), [BLOQUE_SANO]],
        [vidaKeys.items.list(false), [ITEM_SANO]],
        [vidaKeys.followUps.range('2026-09-21', '2026-09-27'), GRUPOS_DE_REVISION],
      ],
      queryPersistBuster,
    )

    montarLaApp()

    expect(await screen.findByText('hoy cuenta')).toBeInTheDocument()
    expect(screen.getByText('agenda desde 09:00')).toBeInTheDocument()
    expect(screen.getByText('mañana 1')).toBeInTheDocument()
    expect(screen.getByText('historia 1')).toBeInTheDocument()
    // Criterio 618, literal: no se descarta nada y no se avisa de nada.
    expect(warn).not.toHaveBeenCalled()
  })

  it('el ítem de plantilla sin `days` tampoco tumba Hoy (la devolución 1)', async () => {
    sembrarCache([[vidaKeys.items.list(false), [ITEM_SIN_DAYS]]], queryPersistBuster)

    montarLaApp()

    expect(await screen.findByText('plantilla sin cargar')).toBeInTheDocument()
    expect(screen.queryByText(PANTALLA_DE_ERROR)).not.toBeInTheDocument()
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('el arnés sigue sabiendo reproducir el fallo', () => {
  /**
   * Esto es la prueba de no vacuidad que el revisor exigió en la tajada 1 —y que
   * allí vivía en el criterio 598—, trasladada a la capa nueva. Con la misma
   * caché envenenada y el mismo invalidador, **quitando solo las guardas**, la
   * pantalla se cae. Así queda claro que lo que la mantiene de pie arriba es la
   * red de abajo.
   */
  it('sin las guardas, la misma caché envenenada tumba la pantalla', async () => {
    sembrarCache([[vidaKeys.categories.list(), [CATEGORIA_FORMA_VIEJA]]], queryPersistBuster)

    montarLaApp({ ...queryPersistOptions, persister: persisterSinGuardas })

    expect(await screen.findByText(PANTALLA_DE_ERROR)).toBeInTheDocument()
  })

  /** Lo mismo para la guarda que se añadió en la segunda vuelta. */
  it('sin las guardas, el ítem sin `days` también tumba la pantalla', async () => {
    sembrarCache([[vidaKeys.items.list(false), [ITEM_SIN_DAYS]]], queryPersistBuster)

    montarLaApp({ ...queryPersistOptions, persister: persisterSinGuardas })

    expect(await screen.findByText(PANTALLA_DE_ERROR)).toBeInTheDocument()
  })
})

describe('la validación no puede tumbar el arranque', () => {
  it('con la caché ilegible arranca en carga y la deja limpia', async () => {
    window.localStorage.setItem(QUERY_PERSIST_KEY, '{esto no es JSON')

    montarLaApp()

    expect(await screen.findByText(CARGANDO)).toBeInTheDocument()
    expect(screen.queryByText(PANTALLA_DE_ERROR)).not.toBeInTheDocument()
    // `timestamp: 0` deja el cliente más viejo que el `maxAge`: se borra.
    await waitFor(() => expect(window.localStorage.getItem(QUERY_PERSIST_KEY)).toBeNull())
  })

  it('una guarda que revienta se comporta como una guarda que falla, sin propagar', () => {
    const guarda = CACHE_GUARDS[0]
    const espia = vi.spyOn(guarda, 'isValid').mockImplementation(() => {
      throw new Error('una guarda con un fallo')
    })

    const cliente = new QueryClient()
    cliente.setQueryData(vidaKeys.categories.list(), [CATEGORIA_FORMA_NUEVA])
    const crudo = JSON.stringify({
      buster: queryPersistBuster,
      timestamp: Date.now(),
      clientState: dehydrate(cliente),
    })

    let salida: ReturnType<typeof sanitizePersistedClient> | undefined
    expect(() => {
      salida = sanitizePersistedClient(crudo)
    }).not.toThrow()
    expect(salida?.clientState.queries).toHaveLength(0)
    expect(espia).toHaveBeenCalled()
  })

  it('una estructura que no es la esperada devuelve el cliente vacío, no una excepción', () => {
    expect(sanitizePersistedClient('null').clientState.queries).toHaveLength(0)
    expect(sanitizePersistedClient('{"clientState":{"queries":"no es una lista"}}').timestamp).toBe(
      0,
    )
    expect(sanitizePersistedClient('[]').clientState.queries).toHaveLength(0)
  })
})

describe('lo que la regla deja fuera y lo que deja pasar', () => {
  it('una consulta sin guarda pasa tal cual, aunque su forma sea rara', () => {
    const cliente = new QueryClient()
    cliente.setQueryData(['settings', 'my'], { loQueSea: true })
    const salida = sanitizePersistedClient(
      JSON.stringify({
        buster: queryPersistBuster,
        timestamp: Date.now(),
        clientState: dehydrate(cliente),
      }),
    )
    expect(salida.clientState.queries).toHaveLength(1)
  })

  it('una entrada sin datos no se toca: no hay forma que validar', () => {
    const salida = sanitizePersistedClient(
      JSON.stringify({
        buster: queryPersistBuster,
        timestamp: Date.now(),
        clientState: {
          mutations: [],
          queries: [{ queryKey: vidaKeys.categories.list(), queryHash: 'x', state: { data: undefined } }],
        },
      }),
    )
    expect(salida.clientState.queries).toHaveLength(1)
  })
})
