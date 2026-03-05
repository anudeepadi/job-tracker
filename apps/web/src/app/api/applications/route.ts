import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";
import { parseBody } from "@/lib/validations/common";
import { createApplicationSchema } from "@/lib/validations/applications";

const ENDPOINT = "/api/applications";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Apply rate limiting
  const identifier = getClientIdentifier(request);
  const limitResult = await checkRateLimit(identifier, {
    windowMs: 60000,
    maxRequests: 100,
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": limitResult.remaining.toString(),
          "X-RateLimit-Reset": limitResult.resetTime.toString(),
        },
      },
    );
  }
  try {
    // Get userId from middleware-injected header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const log = createRequestLogger(ENDPOINT, userId);
    log.info({ method: "GET" }, "Request received");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "appliedDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      userId, // Filter by user
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      // SQLite doesn't support case-insensitive mode, so we use contains without mode
      // For case-insensitive search in SQLite, we'd need to use raw SQL or handle it differently
      where.OR = [
        { company: { contains: search } },
        { jobTitle: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          activities: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          reminders: {
            where: { completed: false },
            orderBy: { dueDate: "asc" },
            take: 3,
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    const durationMs = Date.now() - startTime;
    log.info(
      { method: "GET", statusCode: 200, durationMs, total },
      "Response sent",
    );

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const log = createRequestLogger(ENDPOINT);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error(
      { method: "GET", statusCode: 500, durationMs, error: errorMessage },
      "Request failed",
    );

    return NextResponse.json(
      { error: "Failed to fetch applications", details: errorMessage },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get userId from middleware-injected header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const log = createRequestLogger(ENDPOINT, userId);
    log.info({ method: "POST" }, "Request received");

    const parsed = await parseBody(request, createApplicationSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const application = await prisma.application.create({
      data: {
        userId, // Associate with user
        company: body.company,
        jobTitle: body.jobTitle,
        jobUrl: body.jobUrl,
        location: body.location,
        locationType: body.locationType,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        currency: body.currency || "USD",
        status: body.status || "Applied",
        priority: body.priority || "Medium",
        source: body.source,
        contactPerson: body.contactPerson,
        contactEmail: body.contactEmail,
        appliedDate: body.appliedDate ? new Date(body.appliedDate) : new Date(),
        notes: body.notes,
      },
      include: {
        activities: true,
        reminders: true,
      },
    });

    await prisma.activity.create({
      data: {
        applicationId: application.id,
        type: "Status Change",
        description: `Application created with status: ${application.status}`,
        date: new Date(),
      },
    });

    const durationMs = Date.now() - startTime;
    log.info(
      {
        method: "POST",
        statusCode: 201,
        durationMs,
        applicationId: application.id,
      },
      "Response sent",
    );

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const log = createRequestLogger(ENDPOINT);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error(
      { method: "POST", statusCode: 500, durationMs, error: errorMessage },
      "Request failed",
    );

    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 },
    );
  }
}
