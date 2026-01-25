'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_OPTIONS } from '@/lib/types'
import { Trash2, Download, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface BulkActionsToolbarProps {
  selectedCount: number
  onBulkStatusUpdate: (status: string) => void
  onBulkDelete: () => void
  onBulkExport: () => void
  onBulkApply?: () => void
  loading?: boolean
}

export function BulkActionsToolbar({
  selectedCount,
  onBulkStatusUpdate,
  onBulkDelete,
  onBulkExport,
  onBulkApply,
  loading = false
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
      <div className="text-sm font-mono">
        {selectedCount} application{selectedCount !== 1 ? 's' : ''} selected
      </div>
      <div className="flex gap-2">
        {onBulkApply && (
          <Button
            variant="default"
            size="sm"
            onClick={onBulkApply}
            disabled={loading}
            className="font-mono text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-2" />
            Apply to Selected
          </Button>
        )}
        <Select onValueChange={onBulkStatusUpdate} disabled={loading}>
          <SelectTrigger className="w-[180px] font-mono text-xs">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                Set Status: {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkExport}
          disabled={loading}
          className="font-mono text-xs"
        >
          <Download className="h-3 w-3 mr-2" />
          Export
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          disabled={loading}
          className="font-mono text-xs"
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}
