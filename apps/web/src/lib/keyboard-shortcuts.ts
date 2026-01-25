'use client'

import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  action: () => void
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrl: true,
    description: 'Open command palette',
    action: () => {
      window.dispatchEvent(new CustomEvent('shortcut:command-palette'))
    },
  },
  {
    key: 'n',
    ctrl: true,
    description: 'New application',
    action: () => {
      window.dispatchEvent(new CustomEvent('open:new-application'))
    },
  },
  {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    action: () => {
      window.dispatchEvent(new CustomEvent('shortcut:show-help'))
    },
  },
  {
    key: 'e',
    ctrl: true,
    description: 'Export applications',
    action: () => {
      window.dispatchEvent(new CustomEvent('shortcut:export'))
    },
  },
  {
    key: ',',
    ctrl: true,
    description: 'Open settings',
    action: () => {
      window.location.href = '/settings'
    },
  },
]

/**
 * React hook to set up keyboard shortcuts
 * @param shortcuts Array of keyboard shortcuts to register
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contenteditable element
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Check each shortcut
      for (const shortcut of shortcuts) {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase()
        
        // Check modifier keys
        // For Ctrl, accept either Ctrl (Windows/Linux) or Cmd (Mac)
        const ctrlMatches = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey
        
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatches = shortcut.alt ? event.altKey : !event.altKey
        
        // Meta key is separate from Ctrl (used for Mac-specific shortcuts)
        const metaMatches = shortcut.meta !== undefined
          ? shortcut.meta === event.metaKey
          : true

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}
