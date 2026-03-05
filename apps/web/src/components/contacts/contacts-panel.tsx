'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Plus,
  Search,
  Mail,
  Linkedin,
  Phone,
  Pencil,
  Trash2,
  Users,
  Building2,
  Briefcase,
} from 'lucide-react'
import { ContactDialog } from './contact-dialog'
import { toast } from 'sonner'

interface Contact {
  id: string
  name: string
  company?: string | null
  role?: string | null
  email?: string | null
  linkedinUrl?: string | null
  phone?: string | null
  notes?: string | null
  source: string
  createdAt: string
  updatedAt: string
}

const SOURCE_VARIANT_MAP: Record<string, 'default' | 'secondary' | 'outline'> = {
  manual: 'secondary',
  referral: 'default',
  networking: 'default',
  cold: 'outline',
  event: 'secondary',
}

const SOURCE_LABEL_MAP: Record<string, string> = {
  manual: 'Manual',
  referral: 'Referral',
  networking: 'Networking',
  cold: 'Cold',
  event: 'Event',
}

export function ContactsPanel() {
  const [contacts, setContacts] = useState<readonly Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchContacts = useCallback(async (query?: string) => {
    try {
      const url = query
        ? `/api/contacts?q=${encodeURIComponent(query)}`
        : '/api/contacts'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      const data = await response.json()
      setContacts(data.contacts ?? [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchContacts(searchQuery || undefined)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchContacts])

  const handleDelete = async (contactId: string) => {
    setDeletingId(contactId)
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete contact')
      toast.success('Contact deleted successfully')
      fetchContacts(searchQuery || undefined)
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact)
    setIsDialogOpen(true)
  }

  const handleAddClick = () => {
    setEditingContact(null)
    setIsDialogOpen(true)
  }

  const handleDialogSaved = () => {
    setEditingContact(null)
    fetchContacts(searchQuery || undefined)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingContact(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Networking Contacts</h2>
          <p className="text-xs text-muted-foreground">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in your
            network
          </p>
        </div>
        <Button onClick={handleAddClick} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, role, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts grid */}
      {contacts.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first networking contact to get started'}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleAddClick}
                size="sm"
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="border-border/50 hover:border-border transition-colors cursor-pointer group"
              onClick={() => handleEditClick(contact)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {contact.name}
                    </CardTitle>
                    {contact.company && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{contact.company}</span>
                      </div>
                    )}
                    {contact.role && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{contact.role}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={SOURCE_VARIANT_MAP[contact.source] ?? 'secondary'}>
                    {SOURCE_LABEL_MAP[contact.source] ?? contact.source}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {/* Contact links */}
                <div className="flex items-center gap-2 mt-1">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title={contact.email}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[120px]">
                        {contact.email}
                      </span>
                    </a>
                  )}
                  {contact.linkedinUrl && (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center text-xs text-muted-foreground hover:text-blue-600 transition-colors"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title={contact.phone}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Notes preview */}
                {contact.notes && (
                  <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2">
                    {contact.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(contact)
                    }}
                    title="Edit contact"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    disabled={deletingId === contact.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (
                        window.confirm(
                          `Delete contact "${contact.name}"? This action cannot be undone.`,
                        )
                      ) {
                        handleDelete(contact.id)
                      }
                    }}
                    title="Delete contact"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Dialog */}
      <ContactDialog
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onSaved={handleDialogSaved}
        contact={editingContact}
      />
    </div>
  )
}
