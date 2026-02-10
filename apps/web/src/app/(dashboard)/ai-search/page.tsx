import { Suspense } from 'react'
import { AIJobFinder } from '@/components/ai-search/ai-job-finder'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'AI Job Finder | Job Application Tracker',
  description: 'Find jobs using natural language with AI-powered search'
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading AI Job Finder...</p>
      </div>
    </div>
  )
}

export default function AISearchPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AIJobFinder />
    </Suspense>
  )
}
