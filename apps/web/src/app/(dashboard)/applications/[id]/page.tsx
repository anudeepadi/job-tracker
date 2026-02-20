import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering - this page requires database access
export const dynamic = "force-dynamic";
import { ApplicationDetailClient } from "@/components/dashboard/application-detail-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ApplicationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      activities: {
        orderBy: { date: "desc" },
      },
      reminders: {
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!application) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm text-muted-foreground">
            {application.company} - {application.jobTitle}
          </span>
        </div>

        <ApplicationDetailClient application={application} />
      </div>
    </div>
  );
}
