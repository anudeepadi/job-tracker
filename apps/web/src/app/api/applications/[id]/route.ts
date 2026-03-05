import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validations/common";
import { updateApplicationSchema } from "@/lib/validations/applications";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    // Get userId from middleware-injected header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await prisma.application.findFirst({
      where: {
        id: params.id,
        userId, // Verify ownership
      },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
        },
        reminders: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    // Get userId from middleware-injected header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(request, updateApplicationSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    // Verify ownership before fetching
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: params.id,
        userId, // Verify ownership
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const application = await prisma.application.update({
      where: { id: params.id },
      data: {
        company: body.company,
        jobTitle: body.jobTitle,
        jobUrl: body.jobUrl,
        location: body.location,
        locationType: body.locationType,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        currency: body.currency,
        status: body.status,
        priority: body.priority,
        source: body.source,
        contactPerson: body.contactPerson,
        contactEmail: body.contactEmail,
        appliedDate: body.appliedDate ? new Date(body.appliedDate) : undefined,
        notes: body.notes,
      },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
        },
        reminders: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (existingApplication.status !== body.status && body.status) {
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: "Status Change",
          description: `Status changed from ${existingApplication.status} to ${body.status}`,
          date: new Date(),
        },
      });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    // Get userId from middleware-injected header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership before deleting
    const application = await prisma.application.findFirst({
      where: {
        id: params.id,
        userId, // Verify ownership
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    await prisma.application.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 },
    );
  }
}
