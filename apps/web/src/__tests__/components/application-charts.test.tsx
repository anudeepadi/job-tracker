import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplicationCharts } from "@/components/dashboard/application-charts";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`bar-${dataKey}`} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`pie-${dataKey}`} />
  ),
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`line-${dataKey}`} />
  ),
  FunnelChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="funnel-chart">{children}</div>
  ),
  Funnel: () => <div data-testid="funnel" />,
  LabelList: () => <div data-testid="label-list" />,
}));

const mockStats = {
  statusCounts: { Applied: 2, Interviewing: 1, Offer: 1, Rejected: 1 },
  sourceStats: { LinkedIn: 3, Indeed: 2 },
  funnelData: { applied: 5, screen: 3, interview: 2, offer: 1 },
  sourceResponseRate: {
    LinkedIn: { rate: 60, total: 3, responded: 2 },
  },
  weeklyTimelineData: [
    { date: "2026-01-06", count: 2 },
    { date: "2026-01-13", count: 3 },
  ],
  salaryAnalysis: null,
};

describe("ApplicationCharts", () => {
  it("renders without crashing with valid stats", () => {
    render(<ApplicationCharts stats={mockStats as any} />);
    expect(
      screen.getAllByTestId("responsive-container").length,
    ).toBeGreaterThan(0);
  });

  it("renders null when stats is undefined", () => {
    const { container } = render(
      <ApplicationCharts stats={undefined as any} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders null when statusCounts is missing", () => {
    const { container } = render(<ApplicationCharts stats={{} as any} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders status distribution pie chart", () => {
    render(<ApplicationCharts stats={mockStats as any} />);
    expect(screen.queryAllByTestId("pie-chart").length).toBeGreaterThan(0);
  });

  it("renders bar charts for timeline and sources", () => {
    render(<ApplicationCharts stats={mockStats as any} />);
    expect(screen.queryAllByTestId("bar-chart").length).toBeGreaterThan(0);
  });

  it("renders funnel data when present", () => {
    render(<ApplicationCharts stats={mockStats as any} />);
    expect(screen.getAllByText("Applied").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Interview").length).toBeGreaterThan(0);
  });
});
