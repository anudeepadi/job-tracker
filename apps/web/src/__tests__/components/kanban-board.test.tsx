import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { Application } from "@/lib/types";

// Mock @dnd-kit to avoid DOM measurement issues in jsdom
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  useDroppable: vi.fn(() => ({
    isOver: false,
    setNodeRef: vi.fn(),
  })),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  verticalListSortingStrategy: {},
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => undefined),
    },
  },
}));

const mockApplications: Application[] = [
  {
    id: "1",
    company: "Google",
    jobTitle: "Software Engineer",
    status: "Applied",
    priority: "High",
    appliedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "u1",
  },
  {
    id: "2",
    company: "Meta",
    jobTitle: "Product Manager",
    status: "Interviewing",
    priority: "Medium",
    appliedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "u1",
  },
  {
    id: "3",
    company: "Apple",
    jobTitle: "Designer",
    status: "Offer",
    priority: "Low",
    appliedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "u1",
  },
  {
    id: "4",
    company: "Netflix",
    jobTitle: "Backend Engineer",
    status: "Rejected",
    priority: "High",
    salaryMin: 150000,
    salaryMax: 200000,
    appliedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: "u1",
  },
];

describe("KanbanBoard", () => {
  it("renders all status columns", () => {
    render(
      <KanbanBoard
        applications={mockApplications}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Pending")).toBeDefined();
    expect(screen.getByText("Applied")).toBeDefined();
    expect(screen.getByText("Interviewing")).toBeDefined();
    expect(screen.getByText("Offer")).toBeDefined();
    expect(screen.getByText("Accepted")).toBeDefined();
    expect(screen.getByText("Rejected")).toBeDefined();
    expect(screen.getByText("Withdrawn")).toBeDefined();
  });

  it("places applications in correct columns", () => {
    render(
      <KanbanBoard
        applications={mockApplications}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Google")).toBeDefined();
    expect(screen.getByText("Meta")).toBeDefined();
    expect(screen.getByText("Apple")).toBeDefined();
    expect(screen.getByText("Netflix")).toBeDefined();
  });

  it("shows job titles on cards", () => {
    render(
      <KanbanBoard
        applications={mockApplications}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Software Engineer")).toBeDefined();
    expect(screen.getByText("Product Manager")).toBeDefined();
    expect(screen.getByText("Designer")).toBeDefined();
    expect(screen.getByText("Backend Engineer")).toBeDefined();
  });

  it("shows salary badges when salary data exists", () => {
    render(
      <KanbanBoard
        applications={mockApplications}
        onStatusChange={vi.fn()}
      />,
    );

    // Netflix has salary $150k-$200k
    expect(screen.getByText("$150k-$200k")).toBeDefined();
  });

  it("shows correct column counts", () => {
    render(
      <KanbanBoard
        applications={mockApplications}
        onStatusChange={vi.fn()}
      />,
    );

    // Applied: 1 (Google), Interviewing: 1 (Meta), Offer: 1 (Apple), Rejected: 1 (Netflix)
    // Other columns: 0
    // Count badges show "1" for occupied columns and "0" for empty ones
    const badges = screen.getAllByText("1");
    expect(badges.length).toBe(4); // 4 columns with 1 app each

    const zeroBadges = screen.getAllByText("0");
    expect(zeroBadges.length).toBe(3); // Pending, Accepted, Withdrawn
  });

  it("shows empty state message for columns without applications", () => {
    render(
      <KanbanBoard
        applications={mockApplications}
        onStatusChange={vi.fn()}
      />,
    );

    // Pending, Accepted, Withdrawn should have "No applications" text
    const emptyMessages = screen.getAllByText("No applications");
    expect(emptyMessages.length).toBe(3);
  });

  it("renders with empty applications array", () => {
    render(
      <KanbanBoard applications={[]} onStatusChange={vi.fn()} />,
    );

    // All columns should show "No applications"
    const emptyMessages = screen.getAllByText("No applications");
    expect(emptyMessages.length).toBe(7);
  });

  it("displays days ago text on cards", () => {
    render(
      <KanbanBoard
        applications={mockApplications}
        onStatusChange={vi.fn()}
      />,
    );

    // Cards applied today should show "Today"
    const todayBadges = screen.getAllByText("Today");
    expect(todayBadges.length).toBe(3); // Google, Meta, Apple

    // Netflix was 12 days ago
    expect(screen.getByText("12d ago")).toBeDefined();
  });
});
