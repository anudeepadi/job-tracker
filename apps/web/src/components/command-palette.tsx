'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Command, Search, Plus, Download, Settings, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  const commands: CommandItem[] = [
    {
      id: 'new-application',
      label: 'New Application',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        // Trigger new application dialog
        window.dispatchEvent(new CustomEvent('open:new-application'))
      },
      keywords: ['new', 'add', 'create', 'application']
    },
    {
      id: 'export',
      label: 'Export Applications',
      icon: <Download className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        window.location.href = '/api/applications/export'
      },
      keywords: ['export', 'download', 'csv']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        router.push('/settings')
      },
      keywords: ['settings', 'preferences', 'config']
    },
    {
      id: 'reminders',
      label: 'View Reminders',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        router.push('/?tab=reminders')
      },
      keywords: ['reminders', 'tasks', 'todo']
    }
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    const handleCommandPalette = () => {
      setOpen(true)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('shortcut:command-palette', handleCommandPalette)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('shortcut:command-palette', handleCommandPalette)
    }
  }, [])

  const filteredCommands = commands.filter(cmd =>
    cmd.keywords.some(kw => kw.toLowerCase().includes(search.toLowerCase())) ||
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (command: CommandItem) => {
    command.action()
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 border-b pb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs font-mono bg-muted border rounded">
              Esc
            </kbd>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No commands found
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredCommands.map((cmd) => (
                  <Button
                    key={cmd.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleSelect(cmd)}
                  >
                    {cmd.icon}
                    <span className="ml-2">{cmd.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
