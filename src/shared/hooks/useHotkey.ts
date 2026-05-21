import { useEffect } from 'react'

type HotkeyOptions = {
  enabled?: boolean
  preventDefault?: boolean
}

export function useHotkey(
  key: string,
  callback: () => void,
  options: HotkeyOptions & { metaOrCtrl?: boolean } = {},
) {
  const { enabled = true, preventDefault = true, metaOrCtrl = false } = options

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (metaOrCtrl && !(event.metaKey || event.ctrlKey)) return
      if (!metaOrCtrl && (event.metaKey || event.ctrlKey || event.altKey)) return

      if (preventDefault) event.preventDefault()
      callback()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, callback, enabled, preventDefault, metaOrCtrl])
}
