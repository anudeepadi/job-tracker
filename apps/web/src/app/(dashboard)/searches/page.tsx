import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering - this page requires database access
export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Database, Search, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Searches | HireAgent",
  description:
    "Browse saved agent searches and import results into your tracker",
};

export default async function SearchesPage() {
  const searches = await prisma.jobSearch.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: {
        select: { results: true, applications: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Search History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse your AI-powered job search results
            </p>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-xs px-3 py-1.5 border-border/50"
          >
            <Database className="h-3 w-3 mr-1.5" />
            {searches.length} searches
          </Badge>
        </header>

        {searches.length === 0 ? (
          <Card className="border-dashed border-border/50">
            <CardContent className="py-16 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No searches yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Use the AI Search to find jobs. Your search history will appear
                here.
              </p>
              <Button asChild>
                <Link href="/ai-search">Start Searching</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {searches.map((s) => (
              <Card
                key={s.id}
                className="border-border/50 hover:shadow-md transition-all duration-200 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1.5">
                      <CardTitle className="text-base font-semibold">
                        {s.role}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-sm">
                        <span>{s.location || "Any location"}</span>
                        <span className="text-muted-foreground/40">|</span>
                        <span>{s.numResults} requested</span>
                        <span className="text-muted-foreground/40">|</span>
                        <Badge
                          variant={
                            s.status === "completed" ? "default" : "secondary"
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {s.status}
                        </Badge>
                      </CardDescription>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0"
                      >
                        {s._count.results} results
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-0"
                      >
                        {s._count.applications} imported
                      </Badge>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Link href={`/searches/${s.id}`}>
                          View
                          <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
