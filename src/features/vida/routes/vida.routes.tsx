import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router'
import { VidaHoyPage } from '@/features/vida/pages/VidaHoyPage'
import { VidaPlantillaPage } from '@/features/vida/pages/VidaPlantillaPage'
import { VidaRevisionPage } from '@/features/vida/pages/VidaRevisionPage'
import { VidaActividadesPage } from '@/features/vida/pages/VidaActividadesPage'
import { VidaArchivadasPage } from '@/features/vida/pages/VidaArchivadasPage'
import { VidaCategoriasPage } from '@/features/vida/pages/VidaCategoriasPage'
import { VidaAjustesPage } from '@/features/vida/pages/VidaAjustesPage'
import { VidaSemanaPage } from '@/features/vida/pages/VidaSemanaPage'

/**
 * El índice redirige a `hoy` en vez de renderizar la página: así la URL y la
 * píldora encendida siempre coinciden. (Hábitos renderiza su índice y por eso
 * «Mi día» no se enciende en `/app/habits`; aquí no se imita.)
 */
export const vidaRoutes: RouteObject = {
  path: 'vida',
  children: [
    {
      index: true,
      element: <Navigate to="hoy" replace />,
    },
    {
      path: 'hoy',
      element: <VidaHoyPage />,
    },
    {
      // Hermana de `hoy`, no su hija: es otra mirada sobre los mismos días. No
      // está en `app-nav.config.ts` a propósito (se llega desde Hoy), así que
      // la píldora del módulo que se enciende aquí sigue siendo «Hoy».
      path: 'semana',
      element: <VidaSemanaPage />,
    },
    {
      path: 'plantilla',
      element: <VidaPlantillaPage />,
    },
    {
      path: 'revision',
      element: <VidaRevisionPage />,
    },
    {
      path: 'actividades',
      element: <VidaActividadesPage />,
    },
    {
      // Hija del catálogo en la URL, hermana en el árbol: el catálogo no tiene
      // `Outlet`, así que anidarla de verdad no pintaría nada.
      path: 'actividades/archivadas',
      element: <VidaArchivadasPage />,
    },
    {
      path: 'categorias',
      element: <VidaCategoriasPage />,
    },
    {
      path: 'ajustes',
      element: <VidaAjustesPage />,
    },
  ],
}
