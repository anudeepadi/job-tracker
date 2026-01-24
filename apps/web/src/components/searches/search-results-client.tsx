'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ExternalLink, Loader2, Plus, Download, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'

type ResultRow = {
  id: string
  title: string
  company: string
  location: string | null
  salary: string | null
  postedDate: string | null
  applyUrl: string | null
  sourceUrl: string | null
  importedAsApplicationId: string | null
}

export function SearchResultsClient(props: { searchId: string; initialResults: ResultRow[] }) {
  const [results, setResults] = useState<ResultRow[]>(props.initialResults)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkImporting, setBulkImporting] = useState(false)

  const importedCount = useMemo(
    () => results.filter((r) => Boolean(r.importedAsApplicationId)).length,
    [results]
  )

  const availableForImport = useMemo(
    () => results.filter((r) => !r.importedAsApplicationId),
    [results]
  )

  const selectedAvailable = useMemo(
    () => Array.from(selectedIds).filter(id => {
      const result = results.find(r => r.id === id)
      return result && !result.importedAsApplicationId
    }),
    [selectedIds, results]
  )

  const handleImport = async (id: string) => {
    setImportingId(id)
    try {
      const res = await fetch(`/api/job-results/${id}/import`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to import')
      }

      const applicationId = data?.applicationId as string | undefined
      setResults((prev) =>
        prev.map((r) => (r.id === id ? { ...r, importedAsApplicationId: applicationId ?? 'imported' } : r))
      )
      toast.success('Imported into Applications')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to import')
    } finally {
      setImportingId(null)
    }
  }

  const handleBulkImport = async (ids: string[]) => {
    if (ids.length === 0) return

    setBulkImporting(true)
    try {
      const res = await fetch('/api/job-results/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobResultIds: ids, skipDuplicates: true })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to import')
      }

      // Update results with imported status
      if (data.results?.imported) {
        setResults((prev) =>
          prev.map((r) =>
            data.results.imported.includes(r.id)
              ? { ...r, importedAsApplicationId: 'imported' }
              : r
          )
        )
      }

      const summary = data.summary || {}
      toast.success(
        `Imported ${summary.imported || 0} job${summary.imported !== 1 ? 's' : ''}${
          summary.skipped ? `, skipped ${summary.skipped} duplicate${summary.skipped !== 1 ? 's' : ''}` : ''
        }`
      )

      setSelectedIds(new Set())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to import')
    } finally {
      setBulkImporting(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedAvailable.length === availableForImport.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(availableForImport.map(r => r.id)))
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (results.length === 0) {
    return <div className="text-sm text-muted-foreground">No results found for this search.</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-mono">
          Search: {props.searchId} • Imported: {importedCount}/{results.length}
        </div>
        <div className="flex items-center gap-2">
          {availableForImport.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="font-mono text-xs"
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                {selectedAvailable.length === availableForImport.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedAvailable.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => handleBulkImport(selectedAvailable)}
                  disabled={bulkImporting}
                  className="font-mono text-xs"
                >
                  {bulkImporting ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3 mr-1" />
                  )}
                  Import Selected ({selectedAvailable.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleBulkImport(availableForImport.map(r => r.id))}
                disabled={bulkImporting}
                className="font-mono text-xs"
              >
                {bulkImporting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Import All ({availableForImport.length})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {results.map((r) => {
          const url = r.applyUrl || r.sourceUrl
          const imported = Boolean(r.importedAsApplicationId)
          const isSelected = selectedIds.has(r.id)
          return (
            <div
              key={r.id}
              className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg border transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {!imported && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelect(r.id)}
                    className="mt-1"
                  />
                )}
                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold truncate">{r.title}</div>
                    {imported && (
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        Imported
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.company} • {r.location || 'Unknown location'}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {r.postedDate ? <span>Posted: {r.postedDate}</span> : null}
                    {r.salary ? <span>Salary: {r.salary}</span> : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {url ? (
                  <Button asChild variant="outline" size="sm" className="font-mono text-xs">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </a>
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  className="font-mono text-xs"
                  disabled={imported || importingId === r.id}
                  onClick={() => handleImport(r.id)}
                >
                  {importingId === r.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  Import
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

