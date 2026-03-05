/**
 * Job Alerts API - CRUD operations for saved job search alerts
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validations/common";
import { createAlertSchema } from "@/lib/validations/alerts";

/**
 * GET /api/alerts - List all alerts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.savedAlert.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    // Parse searchCriteria JSON strings
    const alertsWithParsedCriteria = alerts.map((alert) => ({
      ...alert,
      searchCriteria: JSON.parse(alert.searchCriteria),
    }));

    return NextResponse.json({ alerts: alertsWithParsedCriteria });
  } catch (error) {
    console.error("[ALERTS] Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/alerts - Create a new job alert
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(request, createAlertSchema);
    if ("error" in parsed) return parsed.error;
    const { name, searchCriteria, frequency } = parsed.data;

    // Create the alert
    const alert = await prisma.savedAlert.create({
      data: {
        userId: session.userId,
        name,
        searchCriteria: JSON.stringify(searchCriteria),
        frequency,
        isActive: true,
        lastJobCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      alert: {
        ...alert,
        searchCriteria: JSON.parse(alert.searchCriteria),
      },
    });
  } catch (error) {
    console.error("[ALERTS] Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 },
    );
  }
}
