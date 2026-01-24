import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ApplicationDetailClient } from '@/components/dashboard/application-detail-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ApplicationDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      activities: {
        orderBy: { date: 'desc' }
      },
      reminders: {
        orderBy: { dueDate: 'asc' }
      }
    }
  })

  if (!application) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <ApplicationDetailClient application={application} />
    </div>
  )
}
