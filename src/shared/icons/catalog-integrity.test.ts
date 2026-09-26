import { describe, expect, it } from 'vitest'
import { appIcons, appIconMap } from '@/shared/icons/app-icons'
import { iconNameAliases } from '@/shared/icons/icon-aliases'
import { APP_ICON_CATEGORY_LABELS, APP_ICON_CATEGORY_ORDER } from '@/shared/icons/categories'
import { filterAppIcons, groupIconsByCategory, isPickerIcon } from '@/shared/icons/icon-search'
import type { AppIconCategory } from '@/shared/icons/types'

/** Categories the user picks from. `other` holds UI/system icons. */
const PICKABLE_CATEGORIES = APP_ICON_CATEGORY_ORDER.filter((c) => c !== 'other')

const pickerIcons = appIcons.filter(isPickerIcon)

/**
 * Los 453 nombres que el catálogo tenía antes de la fase 12. Hay hábitos
 * guardados que apuntan a ellos: si uno desaparece, ese hábito se queda sin
 * icono. La lista está congelada a propósito — se añade, no se sustituye.
 */
const LEGACY_ICON_NAMES = [
  'music', 'guitar', 'headphones', 'film', 'clapperboard', 'camera', 'palette', 'gamepad',
  'dice', 'tv', 'pizza-slice', 'masks-theater', 'record-vinyl', 'compact-disc', 'drum',
  'microphone-lines', 'radio', 'photo-film', 'images', 'camera-retro', 'ticket',
  'paintbrush', 'spray-can', 'dice-d20', 'ghost', 'dragon', 'hat-wizard', 'shuttle-space',
  'binoculars', 'umbrella-beach', 'burger', 'ice-cream', 'cookie-bite',
  'martini-glass-citrus', 'wallet', 'piggy-bank', 'money-bill', 'credit-card', 'chart-line',
  'chart-pie', 'receipt', 'coins', 'sack-dollar', 'cash-register', 'building-columns',
  'file-invoice-dollar', 'file-contract', 'money-bill-trend-up', 'money-bill-transfer',
  'money-bill-wave', 'money-check-dollar', 'hand-holding-dollar', 'circle-dollar-to-slot',
  'sack-xmark', 'vault', 'scale-balanced', 'arrow-trend-up', 'arrow-trend-down', 'percent',
  'euro-sign', 'dollar-sign', 'bitcoin-sign', 'gem', 'dumbbell', 'running', 'walking',
  'bicycle', 'fire', 'bolt', 'person-swimming', 'futbol', 'om', 'child-reaching',
  'hand-fist', 'weight-hanging', 'person-hiking', 'person-biking', 'person-skating',
  'person-skiing', 'person-skiing-nordic', 'person-snowboarding', 'basketball', 'volleyball',
  'football', 'baseball', 'baseball-bat-ball', 'table-tennis-paddle-ball', 'golf-ball-tee',
  'bowling-ball', 'hockey-puck', 'mountain', 'mountain-sun', 'sailboat', 'water-ladder',
  'stairs', 'shoe-prints', 'gauge-high', 'heart-circle-bolt', 'fire-flame-curved',
  'bottle-water', 'flag-checkered', 'medal', 'ranking-star', 'heart', 'heart-pulse',
  'apple-whole', 'bowl-food', 'utensils', 'droplet', 'moon', 'bed', 'medkit', 'stethoscope',
  'weight-scale', 'pills', 'syringe', 'tooth', 'capsules', 'prescription-bottle-medical',
  'glass-water', 'carrot', 'lemon', 'pepper-hot', 'bowl-rice', 'bread-slice', 'cheese',
  'egg', 'fish-fins', 'drumstick-bite', 'plate-wheat', 'wheat-awn', 'spoon', 'user-doctor',
  'user-nurse', 'hospital', 'notes-medical', 'heart-circle-check', 'thermometer', 'vial',
  'x-ray', 'bandage', 'crutch', 'wheelchair', 'glasses', 'ban-smoking', 'mattress-pillow',
  'bed-pulse', 'home', 'shirt', 'cart-shopping', 'car', 'bus', 'motorcycle', 'broom', 'soap',
  'bath', 'tree', 'snowflake', 'umbrella', 'key', 'jug-detergent', 'sink', 'kitchen-set',
  'fire-burner', 'blender', 'trash-can', 'recycle', 'couch', 'chair', 'door-open', 'plug',
  'faucet', 'shower', 'hands-bubbles', 'spray-can-sparkles', 'plant-wilt', 'basket-shopping',
  'bag-shopping', 'shop', 'boxes-stacked', 'screwdriver', 'wrench', 'paint-roller', 'train',
  'train-subway', 'taxi', 'plane', 'suitcase-rolling', 'map-location-dot', 'gas-pump',
  'cloud-rain', 'brain', 'spa', 'seedling', 'leaf', 'sun', 'face-smile', 'hands-praying',
  'lungs', 'wind', 'person-praying', 'yin-yang', 'peace', 'book-bookmark', 'feather-pointed',
  'quote-left', 'mug-hot', 'hot-tub-person', 'hand-holding-heart', 'campground', 'rainbow',
  'water', 'cloud-sun', 'infinity', 'clover', 'person-rays', 'face-laugh-beam',
  'face-smile-beam', 'face-grin-stars', 'face-meh', 'face-sad-tear', 'dog', 'cat', 'paw',
  'fish', 'dove', 'crow', 'horse', 'frog', 'otter', 'bone', 'feather', 'cow', 'horse-head',
  'hippo', 'kiwi-bird', 'spider', 'bugs', 'mosquito', 'worm', 'shrimp', 'jar',
  'briefcase-medical', 'scissors', 'shield-dog', 'shield-cat', 'calendar', 'calendar-days',
  'clock', 'stopwatch', 'hourglass', 'list-check', 'clipboard', 'bars-progress', 'bookmark',
  'target', 'trophy', 'flag', 'tag', 'calendar-check', 'calendar-plus', 'calendar-xmark',
  'clock-rotate-left', 'hourglass-half', 'list-ul', 'clipboard-list', 'note-sticky',
  'thumbtack', 'folder-tree', 'arrows-rotate', 'repeat', 'circle-check', 'check-double',
  'chart-simple', 'square-poll-vertical', 'gauge-simple-high', 'rocket', 'crown',
  'location-crosshairs', 'people-roof', 'hands-holding-child', 'children', 'baby',
  'hand-holding-hand', 'ring', 'people-group', 'handshake-angle', 'user-plus', 'circle-user',
  'address-book', 'address-card', 'message', 'comment-dots', 'comment', 'comment-sms',
  'phone-volume', 'users-rectangle', 'envelope-open-text', 'paper-plane', 'share-nodes',
  'mug-saucer', 'wine-glass', 'beer-mug-empty', 'champagne-glasses', 'cake-candles', 'gift',
  'calendar-day', 'location-dot', 'house-user', 'thumbs-up', 'hands-clapping', 'hand-peace',
  'face-grin-hearts', 'book', 'book-open', 'graduation-cap', 'school', 'chalkboard', 'flask',
  'microscope', 'calculator', 'language', 'globe', 'lightbulb', 'atom', 'puzzle-piece',
  'book-open-reader', 'book-atlas', 'user-graduate', 'chalkboard-user', 'laptop-file',
  'clipboard-question', 'certificate', 'award', 'pen-fancy', 'pen-nib', 'highlighter',
  'eraser', 'ruler', 'compass-drafting', 'square-root-variable', 'spell-check',
  'earth-europe', 'dna', 'magnifying-glass-chart', 'chess', 'chess-knight', 'podcast',
  'newspaper', 'scroll', 'landmark', 'check', 'xmark', 'plus', 'play', 'power-off', 'trash',
  'user', 'lock', 'envelope', 'eye', 'eye-slash', 'gear', 'search', 'filter', 'star', 'bell',
  'arrow-left', 'arrow-right', 'arrows-left-right', 'grip-vertical', 'chevron-right',
  'calendar-week', 'circle-play', 'ellipsis', 'layer-group', 'mobile', 'tablet', 'wifi',
  'database', 'server', 'cloud', 'robot', 'microchip', 'laptop-code', 'computer', 'display',
  'computer-mouse', 'hard-drive', 'floppy-disk', 'cloud-arrow-up', 'network-wired',
  'circle-nodes', 'file-code', 'gears', 'wand-magic-sparkles', 'qrcode', 'fingerprint',
  'shield-halved', 'user-shield', 'battery-full', 'charging-station', 'satellite-dish',
  'tower-cell', 'link', 'blog', 'vr-cardboard', 'briefcase', 'laptop', 'desktop', 'keyboard',
  'code', 'terminal', 'bug', 'folder', 'file', 'file-lines', 'diagram-project',
  'screwdriver-wrench', 'hammer', 'toolbox', 'building', 'users', 'user-group', 'comments',
  'phone', 'video', 'microphone', 'headset', 'pen', 'pencil', 'edit', 'house-laptop',
  'person-chalkboard', 'chart-column', 'table-list', 'clipboard-check', 'sitemap',
  'handshake', 'user-tie', 'business-time', 'print', 'file-signature', 'file-pdf',
  'box-archive', 'bullhorn', 'gavel', 'id-card-clip', 'helmet-safety', 'person-digging',
  'code-branch', 'code-pull-request', 'pen-ruler',
] as const

describe('catálogo de iconos — integridad', () => {
  it('no tiene nombres duplicados', () => {
    const seen = new Map<string, number>()
    for (const entry of appIcons) {
      seen.set(entry.name, (seen.get(entry.name) ?? 0) + 1)
    }
    const duplicated = [...seen.entries()].filter(([, count]) => count > 1).map(([name]) => name)
    expect(duplicated).toEqual([])
  })

  it('no pierde ninguno de los 453 nombres del catálogo anterior', () => {
    const present = new Set(appIcons.map((entry) => entry.name))
    const missing = LEGACY_ICON_NAMES.filter((name) => !present.has(name))
    expect(missing).toEqual([])
  })

  it('todas las entradas resuelven a un IconDefinition real', () => {
    const broken = appIcons
      .filter((entry) => {
        const icon = entry.icon
        return (
          !icon ||
          typeof icon.iconName !== 'string' ||
          !Array.isArray(icon.icon) ||
          typeof icon.icon[4] !== 'string' ||
          icon.icon[4].length === 0
        )
      })
      .map((entry) => entry.name)
    expect(broken).toEqual([])
    expect(appIconMap.size).toBe(appIcons.length)
  })

  it('no repite el mismo icono de Font Awesome en dos entradas', () => {
    const byIcon = new Map<string, string[]>()
    for (const entry of appIcons) {
      const key = `${entry.icon.prefix}:${entry.icon.iconName}`
      byIcon.set(key, [...(byIcon.get(key) ?? []), entry.name])
    }
    const repeated = [...byIcon.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([key, names]) => `${key} → ${names.join(', ')}`)
    expect(repeated).toEqual([])
  })

  it('cada entrada trae etiqueta y palabras clave', () => {
    const incomplete = appIcons
      .filter((entry) => entry.label.trim().length === 0 || entry.keywords.length === 0)
      .map((entry) => entry.name)
    expect(incomplete).toEqual([])
  })

  it('usa nombres en kebab-case y categorías conocidas', () => {
    const categories = new Set<AppIconCategory>(APP_ICON_CATEGORY_ORDER)
    for (const entry of appIcons) {
      expect(entry.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(categories.has(entry.category)).toBe(true)
      expect(APP_ICON_CATEGORY_LABELS[entry.category]).toBeTruthy()
    }
  })

  it('los alias apuntan a nombres que existen y no pisan una entrada', () => {
    for (const [alias, target] of Object.entries(iconNameAliases)) {
      expect(appIconMap.has(target)).toBe(true)
      expect(appIcons.some((entry) => entry.name === alias)).toBe(false)
    }
  })
})

describe('catálogo de iconos — inventario', () => {
  it('ofrece al menos 60 iconos en cada categoría elegible', () => {
    const counts = new Map<AppIconCategory, number>()
    for (const entry of pickerIcons) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
    }
    const flaky = PICKABLE_CATEGORIES.filter((category) => (counts.get(category) ?? 0) < 60)
    expect(flaky).toEqual([])
  })

  it('muestra un catálogo grande en el selector', () => {
    expect(appIcons.length).toBeGreaterThanOrEqual(850)
    expect(pickerIcons.length).toBeGreaterThanOrEqual(840)
  })

  it('muestra la categoría Social con sus iconos', () => {
    const groups = groupIconsByCategory(pickerIcons, APP_ICON_CATEGORY_ORDER)
    const social = groups.find((group) => group.category === 'social')
    expect(social).toBeDefined()
    expect(social?.label).toBe('Social')
    expect(social?.icons.length).toBeGreaterThanOrEqual(60)
  })
})

describe('catálogo de iconos — búsqueda en español', () => {
  const cases: [string, string][] = [
    ['pesas', 'dumbbell'],
    ['yoga', 'om'],
    ['lavadora', 'jug-detergent'],
    ['familia', 'people-roof'],
    ['idiomas', 'language'],
    ['respiración', 'lungs'],
    ['basura', 'trash-can'],
    ['cocinar', 'kitchen-set'],
    ['medicación', 'pills'],
    ['ahorro', 'piggy-bank'],
    ['videollamada', 'users-rectangle'],
    ['senderismo', 'person-hiking'],
    ['regalo', 'gift'],
    ['diario', 'book-bookmark'],
    ['verdura', 'carrot'],
    // FEAT-017 tajada 1: búsquedas que antes devolvían cero y ya encuentran el
    // icono que siempre estuvo ahí. La consulta entera del usuario («sombrero de
    // chef») entra como frase en `keywords` porque `filterAppIcons` exige TODOS
    // los tokens: sin la frase, «sombrero» y «chef» nunca caen en la misma entrada.
    ['chef', 'kitchen-set'],
    ['sombrero de chef', 'kitchen-set'],
    ['gorro de cocinero', 'kitchen-set'],
    ['tupper', 'kitchen-set'],
    ['sartén', 'fire-burner'],
    ['licuar', 'blender'],
    ['hierbas', 'mortar-pestle'],
    ['lavavajillas', 'sink'],
    ['ensalada', 'bowl-food'],
    ['panadería', 'bread-slice'],
    ['taladro', 'screwdriver'],
    ['gimnasio', 'dumbbell'],
    ['flexiones', 'up-down'],
    ['patinar', 'person-skating'],
    ['audiolibro', 'headphones'],
    ['pañal', 'baby'],
    // «cocina» tiene que seguir trayendo los seis de la cocina, y dos de ellos
    // (utensils y bowl-food) no aparecían hasta esta tajada.
    ['cocina', 'kitchen-set'],
    ['cocina', 'fire-burner'],
    ['cocina', 'blender'],
    ['cocina', 'mortar-pestle'],
    ['cocina', 'utensils'],
    ['cocina', 'bowl-food'],
  ]

  it.each(cases)('«%s» encuentra %s', (query, expected) => {
    const names = filterAppIcons(appIcons, query, { pickerOnly: true }).map((e) => e.name)
    expect(names).toContain(expected)
  })

  it('ignora acentos y mayúsculas', () => {
    const names = filterAppIcons(appIcons, 'MEDITACION', { pickerOnly: true }).map((e) => e.name)
    expect(names).toContain('person-praying')
  })
})
