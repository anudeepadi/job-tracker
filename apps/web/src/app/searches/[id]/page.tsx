import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { SearchResultsClient } from '@/components/searches/search-results-client'

export default async function SearchDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  const search = await prisma.jobSearch.findUnique({
    where: { id: params.id },
    include: {
      results: { orderBy: { createdAt: 'desc' } },
      _count: { select: { results: true, applications: true } },
    },
  })

  if (!search) return notFound()

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/searches">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{search.role}</h1>
            <p className="text-sm text-muted-foreground">
              {search.location || 'No location'} • {search.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {search._count.results} results
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {search._count.applications} imported
          </Badge>
          <Button asChild variant="outline" size="sm" className="font-mono text-xs">
            <Link href="/">Dashboard</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-mono text-xs uppercase tracking-wider">
            Results
          </CardTitle>
          <CardDescription>
            Import any result into your Applications tracker (creates an Application + Activity)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchResultsClient
            searchId={search.id}
            initialResults={search.results.map((r) => ({
              id: r.id,
              title: r.title,
              company: r.company,
              location: r.location,
              salary: r.salary,
              postedDate: r.postedDate,
              applyUrl: r.applyUrl,
              sourceUrl: r.sourceUrl,
              importedAsApplicationId: r.importedAsApplicationId,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}

