/**
 * Individual Job Alert API - Update and Delete operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validations/common";
import { updateAlertSchema } from "@/lib/validations/alerts";

/**
 * PUT /api/alerts/[id] - Update an alert
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;
    const parsed = await parseBody(request, updateAlertSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    // Verify the alert belongs to the user
    const existingAlert = await prisma.savedAlert.findFirst({
      where: {
        id: alertId,
        userId: session.userId,
      },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.searchCriteria !== undefined) {
      updateData.searchCriteria = JSON.stringify(body.searchCriteria);
    }

    // Update the alert
    const updatedAlert = await prisma.savedAlert.update({
      where: { id: alertId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      alert: {
        ...updatedAlert,
        searchCriteria: JSON.parse(updatedAlert.searchCriteria),
      },
    });
  } catch (error) {
    console.error("[ALERTS] Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/alerts/[id] - Delete an alert
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;

    // Verify the alert belongs to the user
    const existingAlert = await prisma.savedAlert.findFirst({
      where: {
        id: alertId,
        userId: session.userId,
      },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Delete the alert
    await prisma.savedAlert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ALERTS] Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 },
    );
  }
}
