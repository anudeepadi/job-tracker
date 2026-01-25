'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { MoreHorizontal, ExternalLink, Edit, Trash2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface ApplicationTableProps {
  applications: Application[]
  onUpdate?: () => void
  onDelete?: () => void
  onEdit?: (application: Application) => void
  showPagination?: boolean
  showFilters?: boolean
}

type SortField = 'company' | 'jobTitle' | 'status' | 'priority' | 'appliedDate' | 'location'
type SortOrder = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  order: SortOrder
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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'appliedDate', order: 'desc' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Sort function
  const sortApplications = (apps: Application[], config: SortConfig): Application[] => {
    return [...apps].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (config.field) {
        case 'company':
          aValue = a.company.toLowerCase()
          bValue = b.company.toLowerCase()
          break
        case 'jobTitle':
          aValue = a.jobTitle.toLowerCase()
          bValue = b.jobTitle.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'priority':
          const priorityOrder = { High: 3, Medium: 2, Low: 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        case 'appliedDate':
          aValue = new Date(a.appliedDate).getTime()
          bValue = new Date(b.appliedDate).getTime()
          break
        case 'location':
          aValue = (a.location || '').toLowerCase()
          bValue = (b.location || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return config.order === 'asc' ? -1 : 1
      if (aValue > bValue) return config.order === 'asc' ? 1 : -1
      return 0
    })
  }

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }))
  }

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

  // Sort filtered applications
  const sortedApplications = sortApplications(filteredApplications, sortConfig)

  // Pagination calculations
  const totalItems = sortedApplications.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedApplications = showPagination
    ? sortedApplications.slice(startIndex, endIndex)
    : sortedApplications

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedApplications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedApplications.map(app => app.id)))
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0) return

    setLoading('bulk')
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/applications/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      )

      await Promise.all(promises)
      setSelectedIds(new Set())
      onUpdate?.()
    } catch (error) {
      console.error('Error updating applications:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} application(s)?`)) return

    setLoading('bulk')
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/applications/${id}`, { method: 'DELETE' })
      )

      await Promise.all(promises)
      setSelectedIds(new Set())
      onDelete?.()
    } catch (error) {
      console.error('Error deleting applications:', error)
    } finally {
      setLoading(null)
    }
  }

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
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); handleFilterChange() }}>
            <SelectTrigger className="w-full sm:w-[140px] font-mono text-xs">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="text-sm font-mono">
            {selectedIds.size} application{selectedIds.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Select onValueChange={handleBulkStatusUpdate} disabled={loading === 'bulk'}>
              <SelectTrigger className="w-[180px] font-mono text-xs">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>Set Status: {option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/applications/bulk-apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ applicationIds: Array.from(selectedIds) })
                  })
                  if (!response.ok) throw new Error('Failed to apply')
                  const data = await response.json()
                  setSelectedIds(new Set())
                  onUpdate?.()
                  toast.success(`Applied to ${data.summary?.applied || 0} job(s)`)
                } catch (error) {
                  console.error('Error applying:', error)
                  toast.error('Failed to apply to jobs')
                }
              }}
              disabled={loading === 'bulk' || selectedIds.size === 0}
              className="font-mono text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-2" />
              Apply to Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={loading === 'bulk'}
              className="font-mono text-xs"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="font-mono text-xs"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Results count */}
      {showFilters && (
        <div className="flex items-center justify-between text-sm text-muted-foreground font-mono">
          <div>
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
          <div className="text-xs">
            Sorted by: {sortConfig.field} ({sortConfig.order})
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-primary/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-primary/10 bg-muted/30">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.size === paginatedApplications.length && paginatedApplications.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-mono text-xs hover:bg-transparent"
                  onClick={() => handleSort('company')}
                >
                  Company
                  {sortConfig.field === 'company' ? (
                    sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-mono text-xs hover:bg-transparent"
                  onClick={() => handleSort('jobTitle')}
                >
                  Position
                  {sortConfig.field === 'jobTitle' ? (
                    sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-mono text-xs hover:bg-transparent"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortConfig.field === 'status' ? (
                    sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-mono text-xs hover:bg-transparent"
                  onClick={() => handleSort('priority')}
                >
                  Priority
                  {sortConfig.field === 'priority' ? (
                    sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-mono text-xs hover:bg-transparent"
                  onClick={() => handleSort('appliedDate')}
                >
                  Applied Date
                  {sortConfig.field === 'appliedDate' ? (
                    sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-mono text-xs hover:bg-transparent"
                  onClick={() => handleSort('location')}
                >
                  Location
                  {sortConfig.field === 'location' ? (
                    sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedApplications.map((application) => (
              <TableRow key={application.id} className="hover:bg-primary/5 border-b border-primary/5 transition-colors group">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(application.id)}
                    onCheckedChange={() => handleToggleSelect(application.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/applications/${application.id}`}
                      className="font-bold text-foreground group-hover:text-primary transition-colors hover:underline"
                    >
                      {application.company}
                    </Link>
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
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <Link
                    href={`/applications/${application.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {application.jobTitle}
                  </Link>
                </TableCell>
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
                      {STATUS_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleStatusChange(application.id, option.value)}
                          disabled={loading === application.id}
                          className="font-mono text-xs"
                        >
                          <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: STATUS_COLORS[option.value as keyof typeof STATUS_COLORS] || '#a1a1aa' }}
                          />
                          {option.label}
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
                      {PRIORITY_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handlePriorityChange(application.id, option.value)}
                          disabled={loading === application.id}
                          className={`font-mono text-xs ${
                            option.value === 'High' ? 'text-red-500' :
                            option.value === 'Medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`}
                        >
                          {option.label}
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
