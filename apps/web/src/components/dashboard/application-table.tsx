'use client'

import { useState } from 'react'
import { Application, STATUS_OPTIONS, STATUS_COLORS, PRIORITY_OPTIONS } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, ExternalLink, Edit, Trash2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { format } from 'date-fns'

interface ApplicationTableProps {
  applications: Application[]
  onUpdate?: () => void
  onDelete?: () => void
  onEdit?: (application: Application) => void
  showPagination?: boolean
  showFilters?: boolean
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export function ApplicationTable({
  applications,
  onUpdate,
  onDelete,
  onEdit,
  showPagination = false,
  showFilters = false
}: ApplicationTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery === '' ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.location?.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || app.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  // Pagination calculations
  const totalItems = filteredApplications.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedApplications = showPagination
    ? filteredApplications.slice(startIndex, endIndex)
    : filteredApplications

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

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

  const handlePriorityChange = async (applicationId: string, newPriority: string) => {
    setLoading(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      })

      if (!response.ok) throw new Error('Failed to update priority')
      onUpdate?.()
    } catch (error) {
      console.error('Error updating priority:', error)
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
        No applications found. Add your first application to get started.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border border-primary/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search company, position, location..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); handleFilterChange() }}
              className="pl-9 font-mono text-sm bg-background"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); handleFilterChange() }}>
            <SelectTrigger className="w-full sm:w-[160px] font-mono text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); handleFilterChange() }}>
            <SelectTrigger className="w-full sm:w-[140px] font-mono text-xs">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {PRIORITY_OPTIONS.map(priority => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results count */}
      {showFilters && (
        <div className="text-sm text-muted-foreground font-mono">
          Showing {paginatedApplications.length} of {totalItems} applications
          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <Button
              variant="link"
              className="text-primary ml-2 h-auto p-0"
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); setCurrentPage(1) }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-primary/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-primary/10 bg-muted/30">
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
            {paginatedApplications.map((application) => (
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
                          <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#a1a1aa' }}
                          />
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="outline"
                        className={`cursor-pointer font-mono text-xs uppercase transition-all hover:opacity-80 ${
                          application.priority === 'High' ? 'text-red-500 border-red-500/20' :
                          application.priority === 'Medium' ? 'text-yellow-500 border-yellow-500/20' :
                          'text-green-500 border-green-500/20'
                        }`}
                      >
                        {application.priority}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card border-primary/10">
                      {PRIORITY_OPTIONS.map((priority) => (
                        <DropdownMenuItem
                          key={priority}
                          onClick={() => handlePriorityChange(application.id, priority)}
                          disabled={loading === application.id}
                          className={`font-mono text-xs ${
                            priority === 'High' ? 'text-red-500' :
                            priority === 'Medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`}
                        >
                          {priority}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                      <DropdownMenuItem
                        className="font-mono text-xs cursor-pointer"
                        onClick={() => onEdit?.(application)}
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-primary/10" />
                      <DropdownMenuItem
                        onClick={() => handleDelete(application.id)}
                        className="text-destructive font-mono text-xs focus:text-destructive cursor-pointer"
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

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <span>Rows per page:</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1) }}>
              <SelectTrigger className="w-[70px] h-8 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground font-mono mr-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
