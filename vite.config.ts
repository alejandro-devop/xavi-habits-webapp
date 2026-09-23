import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { computeCacheShapeId } from './vite/cache-shape'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Invalidador de la caché persistida, atado a la FORMA de los datos y no al
 * build: ver `vite/cache-shape.ts`. Se calcula una vez, al arrancar Vite; en
 * `dev`, editar un `*.api.ts` no lo recalcula hasta reiniciar el servidor, y eso
 * es aceptable porque en desarrollo la caché vieja se tira a mano.
 */
const queryCacheShapeId = computeCacheShapeId(__dirname)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __QUERY_CACHE_SHAPE__: JSON.stringify(queryCacheShapeId),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
