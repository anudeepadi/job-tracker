'use client'

import { useState } from 'react'
import { Application, STATUS_OPTIONS, STATUS_COLORS } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ExternalLink, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface ApplicationTableProps {
  applications: Application[]
  onUpdate?: () => void
  onDelete?: () => void
  showPagination?: boolean
}

export function ApplicationTable({
  applications,
  onUpdate,
  onDelete,
  showPagination: _showPagination = false
}: ApplicationTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setLoading(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')
      onUpdate?.()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return

    setLoading(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete application')
      onDelete?.()
    } catch (error) {
      console.error('Error deleting application:', error)
    } finally {
      setLoading(null)
    }
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-mono text-sm border border-dashed border-primary/20 rounded-lg">
        No applications found. Initialize sequence to add data.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-none border-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-primary/10">
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Company</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Position</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Priority</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Applied Date</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Location</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id} className="hover:bg-primary/5 border-b border-primary/5 transition-colors group">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">{application.company}</span>
                    {application.jobUrl && (
                      <a
                        href={application.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{application.jobTitle}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-pointer border-primary/20 hover:border-primary/50 transition-all font-mono text-xs uppercase"
                        style={{
                          color: STATUS_COLORS[application.status as keyof typeof STATUS_COLORS] || '#a1a1aa',
                          borderColor: STATUS_COLORS[application.status as keyof typeof STATUS_COLORS] ? `${STATUS_COLORS[application.status as keyof typeof STATUS_COLORS]}40` : undefined
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: STATUS_COLORS[application.status as keyof typeof STATUS_COLORS] || '#a1a1aa' }} />
                        {application.status}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card border-primary/10">
                      {STATUS_OPTIONS.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(application.id, status)}
                          disabled={loading === application.id}
                          className="font-mono text-xs"
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs uppercase ${application.priority === 'High' ? 'text-red-500 border-red-500/20' :
                      application.priority === 'Medium' ? 'text-yellow-500 border-yellow-500/20' :
                        'text-green-500 border-green-500/20'
                      }`}
                  >
                    {application.priority}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {format(new Date(application.appliedDate), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    {application.location && (
                      <div className="font-mono text-xs text-muted-foreground">{application.location}</div>
                    )}
                    {application.locationType && (
                      <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider bg-secondary/50 text-secondary-foreground">
                        {application.locationType}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        disabled={loading === application.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-primary/10">
                      <DropdownMenuItem className="font-mono text-xs">
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-primary/10" />
                      <DropdownMenuItem
                        onClick={() => handleDelete(application.id)}
                        className="text-destructive font-mono text-xs focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}