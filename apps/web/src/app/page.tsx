import { Suspense } from 'react'
import { Dashboard } from '@/components/dashboard/dashboard'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Dashboard />
      </Suspense>
    </div>
  )
}
