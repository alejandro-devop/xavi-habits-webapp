# Spec — Fase 4.5: El cascarón de la app (barra lateral y barra superior)

> **Estado:** lista para construir
> **Depende de:** `02-habitos-mi-dia.spec.md` (construida). Puede construirse en paralelo a `03-habitos-lista.spec.md` **solo si no se lanza a la vez**: ambas tocan `shared/ui`.

## Objetivo

El módulo de hábitos estrena vidrio, mint y píldoras, pero sigue montado dentro del `AppLayout` viejo —lateral blanco, barra superior blanca, acento azul `#007AFF`, radios de 10px—. Se ven dos identidades pegadas y la costura salta a la vista. Esta spec lleva el cascarón al lenguaje Aura para que el marco y el contenido dejen de contradecirse.

**Referencia visual aprobada por el usuario:** `docs/remodel/assets/04-chasis-app.html`. Tiene tres marcos: el problema actual, la propuesta, y el lateral plegado en oscuro.

## Fuera de alcance

- **El contenido de los módulos no migrados** (Hoy, Tareas, Notas, Aprendizaje, Trimestres, Sueño, Ajustes). No se tocan. Ver "El límite del ámbito", que es la decisión central de esta spec.
- **Las rutas.** Ni una cambia. `app-nav.config.ts` conserva sus destinos; solo se agrupan visualmente.
- **`CommandPalette`, `Toast`, `ConfirmDialog`** por dentro. Sí se les da el enganche `ds` (ver abajo), pero su rediseño es otra fase.
- Hábitos. Ya está hecho.

## Pantallas y rutas

| Ruta | Archivo | Qué cambia |
|------|---------|------------|
| `/app/*` | `src/layouts/AppLayout/AppLayout.tsx` + `.module.scss` | Ámbito Aura en el cromo, miga de pan, agrupado del lateral |
| — | `src/shared/ui/Sidebar/`, `src/shared/ui/Topbar/` | Vidrio, píldoras, radios y acentos Aura vía tokens |
| — | `src/layouts/AppLayout/app-nav.config.ts` | Se añade `group` a cada elemento; destinos intactos |

## Diseño

### El límite del ámbito — la decisión central

**`data-ds="aura"` va en los elementos del cromo (`<Sidebar>` y `<Topbar>`), no en el contenedor que envuelve al `<Outlet />`.**

Si se pusiera en la raíz de `AppLayout`, todo el contenido de la app heredaría los tokens Aura de golpe: Tareas, Notas y Aprendizaje saldrían con botones mint y radios de píldora, mezclados con sus propios valores hexadecimales a pelo, que no se adaptan. Quedarían peor que ahora, no mejor.

Con el ámbito limitado al cromo: el marco es Aura en toda la app, cada módulo conserva su aspecto hasta que le toque, y hábitos —que ya pone su propio `data-ds` en `HabitsModuleLayout`— encaja sin costura. Cuando el último módulo migre, el atributo sube a `<html>` y todos los ámbitos desaparecen.

`AuroraCanvas` **sí** se monta una vez en `AppLayout`, detrás de todo. Hoy lo monta `HabitsModuleLayout`; pásalo arriba y quítalo de ahí para no pintar dos lienzos superpuestos. Comprueba que los módulos no migrados siguen legibles sobre él; si alguno tiene fondo sólido propio, se verá igual que ahora, que es lo aceptable.

### Barra lateral

Vidrio (`rgba(255,255,255,.5)` + `blur(26px)`) con borde especular a la derecha, sobre el lienzo. El enlace activo pasa de rectángulo azul translúcido a **pastilla blanca sólida con texto en `--color-primary` y resplandor mint**. Radios de 14px, iconos a 20px alineados.

**Agrupado con encabezados.** Siete enlaces planos no tienen jerarquía. Se añade un campo `group` a cada elemento de `app-nav.config.ts` y el `Sidebar` pinta un encabezado por grupo. Propuesta de agrupación, ajústala a los elementos que existan de verdad en el config:

- **Día a día:** Hoy, Hábitos, Tareas, Rutina semanal, Actividades, Sueño
- **Pensar:** Notas, Aprendizaje, Ideas de app, Trimestres, Proyectos
- Al pie, separado: Ajustes y la ficha de usuario

En estado plegado los encabezados de grupo desaparecen (solo iconos, 70px de ancho) — se separan con un filete fino en vez de con texto. **Conserva la preferencia de plegado en `localStorage` con su `try/catch`, tal como está hoy.**

La ficha de usuario del pie pasa a cápsula de vidrio con avatar en degradado mint→lavanda.

### Barra superior

Vidrio translúcido de 60px, sin sombra dura. De izquierda a derecha: botón de plegado, **miga de pan**, y a la derecha el disparador de la paleta de comandos como píldora con el atajo en una tecla dibujada, el conmutador de tema y las notificaciones como círculos de vidrio.

**La miga de pan es nueva y resuelve el solape.** Hoy la barra superior y la barra del módulo compiten por decir lo mismo. Con la miga (`Hábitos · Mi día`) la superior dice **dónde estás** y las píldoras del módulo solo **cambian de sección**. Usa el `Breadcrumbs` que ya existe en `shared/ui`. Se alimenta de la ruta activa contra `app-nav.config.ts`; si una ruta no está en el config, muestra solo el nombre del módulo, sin inventar niveles.

### Portales

`Drawer` y `Popover` ya recibieron un enganche `ds` en la Fase 2+3, porque se montan en `document.body` y heredaban los tokens de `:root`. Haz lo mismo con **`CommandPalette`, `Toast` y `ConfirmDialog`**: mismo patrón, misma prop, sin rediseñarlos por dentro. Hoy se disparan desde el módulo Aura y salen en azul Apple.

### Móvil

A <900px el lateral desaparece y se abre como `Drawer` desde la izquierda con el botón de la barra superior, como hoy. En vidrio, con los mismos grupos. La barra superior conserva la miga de pan recortada al último nivel.

## Datos

Ninguno. Esto es cromo: sin queries, sin mutaciones, sin estado nuevo salvo el plegado que ya existe.

## Criterios de aceptación

- [ ] El lateral y la barra superior se ven en Aura en **toda** la zona `/app`, fiel a `docs/remodel/assets/04-chasis-app.html`
- [ ] **El contenido de Hoy, Tareas, Notas, Aprendizaje y Trimestres se ve exactamente igual que antes.** Compruébalo pantalla por pantalla: es el riesgo principal de esta spec
- [ ] `/app/habits` ya no muestra dos identidades: el marco y el módulo comparten lenguaje y el lienzo aurora se pinta una sola vez
- [ ] La miga de pan dice el módulo y la sección, y no duplica lo que ya dicen las píldoras del módulo
- [ ] El lateral agrupa los enlaces con encabezados, y ninguna ruta cambia: todos los destinos siguen llevando donde llevaban
- [ ] Plegado y desplegado funcionan, y la preferencia sobrevive a recargar
- [ ] A ~375px el lateral se abre como cajón y se cierra al navegar
- [ ] `CommandPalette`, `Toast` y `ConfirmDialog` disparados desde hábitos salen con los tokens Aura, no en azul
- [ ] La paleta de comandos sigue abriéndose con su atajo y ejecutando sus acciones
- [ ] Funciona en tema claro y oscuro
- [ ] Estados vacío, cargando y error resueltos

## Notas para el constructor

- **Empieza por la maqueta.** El primer marco es el problema, no la propuesta: no lo copies.
- El riesgo de esta spec no es hacer bonito el cascarón, es **romper los módulos que no se tocan**. Antes de dar nada por terminado, recorre una pantalla de cada módulo no migrado y compárala con lo que había.
- `AppLayoutShell` ya monta `RunningActivityWidget`, `RetryNotice`, `ConnectionIndicator` y `SessionExpiredModal`. Flotan sobre el contenido: comprueba que el lienzo aurora no los deja ilegibles y que siguen por encima en el orden de apilamiento.
- Cuidado con el `backdrop-filter` del lateral y la barra: cada uno crea su propio contexto de apilamiento. En la Fase 2+3 eso ya provocó dos bugs de solape con los popovers. Verifica que la paleta de comandos y el cajón móvil quedan por encima.
- La constante `--habits-bar-offset: 2.875rem` de `HabitsModuleLayout` es la altura medida a mano de la `Topbar`. Si cambias esa altura, **actualízala**, o la barra del módulo se desalinea. Mejor aún: expón la altura como token (`--topbar-height`) y haz que ambas lo usen; queda resuelto para siempre.
- Al terminar, `graphify update .`
