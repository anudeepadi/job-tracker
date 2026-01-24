import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Database } from 'lucide-react'

export const metadata = {
  title: 'Searches | Job Application Tracker',
  description: 'Browse saved agent searches and import results into your tracker',
}

export default async function SearchesPage() {
  const searches = await prisma.jobSearch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      _count: {
        select: { results: true, applications: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Search History</h1>
            <p className="text-sm text-muted-foreground">
              Saved agent searches (LinkedIn / Adzuna) and their results
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          <Database className="h-3 w-3 mr-1" />
          {searches.length} searches
        </Badge>
      </header>

      {searches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No searches yet. Run an agent search and ingest results to see them here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {searches.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="font-mono text-sm uppercase tracking-wider">
                      {s.role}
                    </CardTitle>
                    <CardDescription>
                      {s.location || 'No location'} • requested {s.numResults} • status: {s.status}
                    </CardDescription>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {s._count.results} results
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {s._count.applications} imported
                    </Badge>
                    <Button asChild size="sm" className="font-mono text-xs">
                      <Link href={`/searches/${s.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

