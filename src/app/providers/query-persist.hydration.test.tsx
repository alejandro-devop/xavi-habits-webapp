import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { render, screen } from '@testing-library/react'
import { Component, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  QUERY_PERSIST_KEY,
  queryPersistBuster,
  queryPersistOptions,
} from '@/app/providers/query-persist'
import { vidaKeys } from '@/shared/api/query-keys'

/**
 * Este fichero reproduce lo que pasó en producción el 2026-09-23: una caché
 * guardada en `localStorage` **antes** del despliegue de FEAT-019 (metas sin
 * `activeDays`), un arranque con el código de después, y `activeDays.includes()`
 * reventando antes de pintar nada.
 *
 * No prueba el `buster` por dentro: fabrica la caché vieja a mano, monta la app
 * con **las mismas opciones de persistencia que corren en producción**
 * (`queryPersistOptions`) y mira qué queda en pantalla.
 */

// --- Las dos formas de una meta, antes y después de FEAT-019 -----------------

type CategoriaVieja = {
  id: string
  name: string
  goal: { id: string; dailyMinutes: number }
}

type CategoriaNueva = CategoriaVieja & {
  goal: { id: string; dailyMinutes: number; activeDays: string[] }
}

const CATEGORIA_FORMA_VIEJA: CategoriaVieja = {
  id: 'cat-1',
  name: 'Trabajo',
  goal: { id: 'goal-1', dailyMinutes: 300 },
}

const CATEGORIA_FORMA_NUEVA: CategoriaNueva = {
  id: 'cat-1',
  name: 'Trabajo',
  goal: { id: 'goal-1', dailyMinutes: 300, activeDays: ['MON', 'TUE'] },
}

// --- La pantalla: lee la caché y da por seguro el campo nuevo -----------------

const CARGANDO = 'Cargando tu día…'
const PANTALLA_DE_ERROR = 'Unexpected Application Error'

/**
 * El mismo gesto que tumbó Hoy: `activeDays.includes(...)` sin red debajo. Se
 * escribe a propósito **sin** tolerancia, porque lo que se está probando es la
 * caché, no el parche de `countsOn` (commit `1887d62`, que se queda donde está).
 */
function ArcoDeHoy() {
  const { data } = useQuery<CategoriaNueva[]>({
    queryKey: vidaKeys.categories.list(),
    // Nunca resuelve: si hace falta pedirlo, la pantalla se queda cargando, que
    // es exactamente lo que se quiere ver cuando la caché se descarta.
    queryFn: () => new Promise<CategoriaNueva[]>(() => {}),
  })

  if (!data) return <p>{CARGANDO}</p>
  return <p>{data[0].goal.activeDays.includes('MON') ? 'hoy cuenta' : 'hoy no cuenta'}</p>
}

/** Hace las veces de la pantalla de error de React Router. */
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

// --- Fabricar la caché persistida a mano -------------------------------------

/**
 * Escribe en `localStorage` exactamente lo que dejaría el persister: el mismo
 * formato (`{ buster, timestamp, clientState }`) y el mismo `dehydrate` de
 * react-query, para no estar probando contra un formato inventado.
 */
function sembrarCache(datos: unknown, buster: string): void {
  const clienteDeAyer = new QueryClient()
  clienteDeAyer.setQueryData(vidaKeys.categories.list(), datos)
  window.localStorage.setItem(
    QUERY_PERSIST_KEY,
    JSON.stringify({
      buster,
      timestamp: Date.now(),
      clientState: dehydrate(clienteDeAyer),
    }),
  )
  clienteDeAyer.clear()
}

/**
 * El persister **sin la red de la tajada 2**: mismo almacenamiento, pero con el
 * `JSON.parse` de siempre en vez de `sanitizePersistedClient`.
 *
 * **NO LO ENCHUFES AL DE PRODUCCIÓN.** Lo usa el control del criterio 598, y ese
 * control no afirma que la app se caiga: afirma que **este arnés reproduce el
 * fallo**. Es la vara con la que se comprueba que el criterio 596 no es vacuo —el
 * revisor la verificó mutando este fichero—. Si se apunta al persister de
 * producción, las guardas de la tajada 2 impiden la caída y queda un control que
 * **no puede fallar nunca**: seguiría verde el día que el arnés dejara de medir
 * nada, y nadie se enteraría.
 *
 * Que la app de verdad no se cae en ese escenario es cosa del criterio 616, en
 * `query-cache-guards.hydration.test.tsx`. Aquí se prueba la red de arriba —el
 * invalidador— y por eso hay que quitar la de abajo para verla trabajar sola.
 */
const persisterSinGuardas = createAsyncStoragePersister({
  key: QUERY_PERSIST_KEY,
  storage: window.localStorage,
})

function montarLaApp(persistOptions = queryPersistOptions) {
  // Cliente nuevo por test: el singleton de la app guarda estado entre pruebas.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 1000 * 60 * 60 * 24 } },
  })
  return render(
    <PersistQueryClientProvider client={client} persistOptions={persistOptions}>
      <Frontera>
        <ArcoDeHoy />
      </Frontera>
    </PersistQueryClientProvider>,
  )
}

/** El invalidador que tenía el build de ayer, antes de cambiar la forma. */
const BUSTER_DE_AYER = 'v0.0.0-formadeayer01'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('la caché persistida y un despliegue que cambia la forma', () => {
  it('criterio 596 — una caché con la forma vieja no se hidrata y la pantalla queda de pie', async () => {
    sembrarCache([CATEGORIA_FORMA_VIEJA], BUSTER_DE_AYER)

    montarLaApp()

    expect(await screen.findByText(CARGANDO)).toBeInTheDocument()
    expect(screen.queryByText(PANTALLA_DE_ERROR)).not.toBeInTheDocument()
    // Y la caché envenenada se borra en vez de quedarse para el próximo arranque.
    expect(window.localStorage.getItem(QUERY_PERSIST_KEY)).toBeNull()
  })

  it('criterio 597 — con la misma forma, la caché se conserva y los datos están sin pedir nada', async () => {
    sembrarCache([CATEGORIA_FORMA_NUEVA], queryPersistBuster)

    montarLaApp()

    expect(await screen.findByText('hoy cuenta')).toBeInTheDocument()
    expect(screen.queryByText(PANTALLA_DE_ERROR)).not.toBeInTheDocument()
  })

  it('criterio 598 — control: con la forma vieja y sin la red de la tajada 2, la pantalla se cae', async () => {
    sembrarCache([CATEGORIA_FORMA_VIEJA], queryPersistBuster)

    // Con el invalidador acertando y sin guardas debajo, esta caché tumba la
    // pantalla. Eso es lo que hace que el criterio 596 signifique algo: lo que
    // allí la mantiene de pie es que el invalidador NO acierta, no un descuido
    // del arnés. Ver el comentario de `persisterSinGuardas`.
    montarLaApp({ ...queryPersistOptions, persister: persisterSinGuardas })

    expect(await screen.findByText(PANTALLA_DE_ERROR)).toBeInTheDocument()
  })

  it('criterio 600 — el invalidador tiene valor y no es solo la versión que nadie sube', () => {
    expect(queryPersistBuster).toMatch(/^v\d+\.\d+\.\d+-[0-9a-f]{12}$/)
    expect(queryPersistBuster).not.toBe('0.0.0')
  })
})
