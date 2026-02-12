/**
 * Cron Job: Run Job Alerts
 *
 * This endpoint is triggered by a cron scheduler (e.g., Cloud Scheduler)
 * to run active job alerts and notify users of new matching jobs.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendJobAlertEmail } from "@/lib/email";

/**
 * POST /api/cron/run-alerts
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      );
    }

    // Get the current time for frequency filtering
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all active alerts that need to run
    const alerts = await prisma.savedAlert.findMany({
      where: {
        isActive: true,
        OR: [
          // Daily alerts that haven't run in the last 24 hours
          {
            frequency: "daily",
            OR: [
              { lastRunAt: null },
              { lastRunAt: { lt: oneDayAgo } }
            ]
          },
          // Weekly alerts that haven't run in the last 7 days
          {
            frequency: "weekly",
            OR: [
              { lastRunAt: null },
              { lastRunAt: { lt: oneWeekAgo } }
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    console.log(`[CRON] Found ${alerts.length} alerts to run`);

    const results = {
      total: alerts.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each alert
    for (const alert of alerts) {
      try {
        const searchCriteria = JSON.parse(alert.searchCriteria);

        // Call the agent API to run the job search
        const agentUrl = process.env.AGENT_API_URL;
        if (!agentUrl) {
          throw new Error("AGENT_API_URL not configured");
        }

        const response = await fetch(`${agentUrl}/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: searchCriteria.role,
            location: searchCriteria.location || "",
            num_results: 10,
          }),
        });

        if (!response.ok) {
          throw new Error(`Agent API returned ${response.status}`);
        }

        const searchResults = await response.json();
        const newJobCount = searchResults.jobs?.length || 0;

        // Determine if we should send notification
        // Send email if: new jobs found AND (first run OR more jobs than last time)
        const shouldNotify = newJobCount > 0 &&
          (!alert.lastRunAt || newJobCount > alert.lastJobCount);

        if (shouldNotify) {
          // Send email notification
          try {
            await sendJobAlertEmail({
              to: alert.user.email,
              userName: alert.user.name || "there",
              alertName: alert.name,
              jobCount: newJobCount,
              jobs: searchResults.jobs.slice(0, 5), // Top 5 jobs
              searchCriteria,
            });
            console.log(`[CRON] Sent alert email to ${alert.user.email} for alert "${alert.name}"`);
          } catch (emailError) {
            console.error(`[CRON] Failed to send email for alert ${alert.id}:`, emailError);
            // Don't fail the entire alert run if email fails
          }
        }

        // Update alert with last run info
        await prisma.savedAlert.update({
          where: { id: alert.id },
          data: {
            lastRunAt: now,
            lastJobCount: newJobCount,
          },
        });

        results.successful++;
        console.log(`[CRON] Successfully ran alert ${alert.id}: ${newJobCount} jobs found`);
      } catch (error) {
        results.failed++;
        const errorMsg = `Alert ${alert.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
        results.errors.push(errorMsg);
        console.error(`[CRON] Error running alert ${alert.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Error in run-alerts:", error);
    return NextResponse.json(
      {
        error: "Failed to run alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/run-alerts
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    endpoint: "run-alerts",
    message: "POST to this endpoint with x-cron-secret header to run alerts",
  });
}
