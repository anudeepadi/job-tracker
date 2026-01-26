'use client'

import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'n',
    ctrl: true,
    action: () => {
      // Trigger new application dialog
      const event = new CustomEvent('shortcut:new-application')
      window.dispatchEvent(event)
    },
    description: 'Create new application'
  },
  {
    key: 'f',
    ctrl: true,
    action: () => {
      // Focus search
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
    },
    description: 'Focus search'
  },
  {
    key: 'k',
    ctrl: true,
    action: () => {
      // Open command palette
      const event = new CustomEvent('shortcut:command-palette')
      window.dispatchEvent(event)
    },
    description: 'Open command palette'
  },
  {
    key: 'i',
    ctrl: true,
    action: () => {
      // Import selected job
      const event = new CustomEvent('shortcut:import-job')
      window.dispatchEvent(event)
    },
    description: 'Import selected job'
  },
  {
    key: 'a',
    ctrl: true,
    action: () => {
      // Apply to selected job
      const event = new CustomEvent('shortcut:apply-job')
      window.dispatchEvent(event)
    },
    description: 'Apply to selected job'
  }
]
