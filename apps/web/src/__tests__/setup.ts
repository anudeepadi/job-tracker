import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === "session-token") {
        return { value: "mock-session-token" };
      }
      return undefined;
    }),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock environment variables
process.env.JWT_SECRET = "test-secret-key";
process.env.DATABASE_URL = "file:./test.db";

// Setup MSW handlers for API mocking
export const handlers = [
  // Auth endpoints
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
        },
        token: "mock-jwt-token",
      });
    }

    return HttpResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }),

  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      name: string;
    };

    if (body.email === "existing@example.com") {
      return HttpResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        user: {
          id: "user-new",
          email: body.email,
          name: body.name,
        },
        token: "mock-jwt-token",
      },
      { status: 201 },
    );
  }),

  http.get("/api/auth/me", ({ request }) => {
    const cookie = request.headers.get("cookie");

    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
      },
    });
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({ success: true });
  }),

  // Applications endpoints
  http.get("/api/applications", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");

    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mockApplications = [
      {
        id: "app-1",
        company: "TechCorp",
        jobTitle: "Software Engineer",
        status: "Applied",
        priority: "High",
        location: "San Francisco",
        appliedDate: new Date("2026-01-15").toISOString(),
        activities: [],
        reminders: [],
      },
      {
        id: "app-2",
        company: "StartupXYZ",
        jobTitle: "Frontend Developer",
        status: "Interview",
        priority: "Medium",
        location: "Remote",
        appliedDate: new Date("2026-01-20").toISOString(),
        activities: [],
        reminders: [],
      },
    ];

    const filtered = status
      ? mockApplications.filter((app) => app.status === status)
      : mockApplications;

    return HttpResponse.json({
      applications: filtered,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    });
  }),

  http.post("/api/applications", async ({ request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json(
      {
        id: "app-new",
        ...body,
        activities: [],
        reminders: [],
      },
      { status: 201 },
    );
  }),

  http.get("/api/applications/:id", ({ params, request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (id === "app-1") {
      return HttpResponse.json({
        id: "app-1",
        company: "TechCorp",
        jobTitle: "Software Engineer",
        status: "Applied",
        priority: "High",
        location: "San Francisco",
        appliedDate: new Date("2026-01-15").toISOString(),
        activities: [],
        reminders: [],
      });
    }

    return HttpResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }),

  http.patch("/api/applications/:id", async ({ params, request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      id,
      ...body,
      activities: [],
      reminders: [],
    });
  }),

  http.delete("/api/applications/:id", ({ request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({ success: true });
  }),

  // Contacts endpoints
  http.get("/api/contacts", ({ request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    const mockContacts = [
      {
        id: "contact-1",
        name: "Jane Smith",
        company: "Google",
        role: "Engineering Manager",
        email: "jane@google.com",
        linkedinUrl: "https://linkedin.com/in/janesmith",
        phone: "+1 555-123-4567",
        notes: "Met at tech conference",
        source: "networking",
        createdAt: new Date("2026-02-01").toISOString(),
        updatedAt: new Date("2026-02-01").toISOString(),
      },
      {
        id: "contact-2",
        name: "Bob Johnson",
        company: "Meta",
        role: "Senior Engineer",
        email: "bob@meta.com",
        linkedinUrl: null,
        phone: null,
        notes: null,
        source: "referral",
        createdAt: new Date("2026-01-20").toISOString(),
        updatedAt: new Date("2026-01-20").toISOString(),
      },
    ];

    const filtered = query
      ? mockContacts.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            (c.company &&
              c.company.toLowerCase().includes(query.toLowerCase())) ||
            (c.role && c.role.toLowerCase().includes(query.toLowerCase())) ||
            (c.email && c.email.toLowerCase().includes(query.toLowerCase())),
        )
      : mockContacts;

    return HttpResponse.json({ contacts: filtered });
  }),

  http.post("/api/contacts", async ({ request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (!body.name) {
      return HttpResponse.json(
        {
          error: "Validation failed",
          details: [{ path: ["name"], message: "Name is required" }],
        },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      {
        id: "contact-new",
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.get("/api/contacts/:id", ({ params, request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (id === "contact-1") {
      return HttpResponse.json({
        id: "contact-1",
        name: "Jane Smith",
        company: "Google",
        role: "Engineering Manager",
        email: "jane@google.com",
        linkedinUrl: "https://linkedin.com/in/janesmith",
        phone: "+1 555-123-4567",
        notes: "Met at tech conference",
        source: "networking",
        createdAt: new Date("2026-02-01").toISOString(),
        updatedAt: new Date("2026-02-01").toISOString(),
      });
    }

    return HttpResponse.json({ error: "Contact not found" }, { status: 404 });
  }),

  http.put("/api/contacts/:id", async ({ params, request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      id,
      ...body,
      createdAt: new Date("2026-02-01").toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete("/api/contacts/:id", ({ request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({ message: "Contact deleted successfully" });
  }),

  // Stats endpoint
  http.get("/api/applications/stats", ({ request }) => {
    const cookie = request.headers.get("cookie");
    if (!cookie || !cookie.includes("session-token")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({
      total: 10,
      applied: 5,
      interview: 3,
      offered: 1,
      rejected: 1,
    });
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
  server.close();
});
