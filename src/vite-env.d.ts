/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * Identificador de la forma de la caché persistida, inyectado por Vite
 * (`define` en `vite.config.ts`, calculado en `vite/cache-shape.ts`).
 *
 * Se declara `| undefined` a propósito: si alguna herramienta compila este
 * código sin aplicar el `define`, leerlo no puede tumbar el arranque.
 */
declare const __QUERY_CACHE_SHAPE__: string | undefined
