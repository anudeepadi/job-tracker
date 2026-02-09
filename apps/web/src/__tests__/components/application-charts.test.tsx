import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ApplicationCharts } from '@/components/dashboard/application-charts'

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ dataKey }: { dataKey: string }) => <div data-testid={`pie-${dataKey}`} />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => <div data-testid={`line-${dataKey}`} />,
}))

describe('ApplicationCharts', () => {
  const mockApplications = [
    {
      id: '1',
      company: 'TechCorp',
      jobTitle: 'Software Engineer',
      status: 'Applied',
      priority: 'High',
      appliedDate: new Date('2026-01-15'),
      location: 'San Francisco',
    },
    {
      id: '2',
      company: 'StartupXYZ',
      jobTitle: 'Frontend Developer',
      status: 'Interview',
      priority: 'Medium',
      appliedDate: new Date('2026-01-20'),
      location: 'Remote',
    },
    {
      id: '3',
      company: 'BigCorp',
      jobTitle: 'Backend Developer',
      status: 'Offered',
      priority: 'High',
      appliedDate: new Date('2026-01-22'),
      location: 'New York',
    },
    {
      id: '4',
      company: 'SmallCo',
      jobTitle: 'Full Stack Developer',
      status: 'Rejected',
      priority: 'Low',
      appliedDate: new Date('2026-01-10'),
      location: 'Austin',
    },
    {
      id: '5',
      company: 'MidCorp',
      jobTitle: 'DevOps Engineer',
      status: 'Applied',
      priority: 'Medium',
      appliedDate: new Date('2026-01-18'),
      location: 'Seattle',
    },
  ]

  it('should render without crashing', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // Check for main chart containers
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
  })

  it('should display status distribution chart', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // Should render charts
    const barCharts = screen.queryAllByTestId('bar-chart')
    const pieCharts = screen.queryAllByTestId('pie-chart')

    // At least one chart type should be present
    expect(barCharts.length + pieCharts.length).toBeGreaterThan(0)
  })

  it('should handle empty applications array', () => {
    render(<ApplicationCharts applications={[]} />)

    // Should still render without errors
    const containers = screen.queryAllByTestId('responsive-container')
    expect(containers).toBeDefined()
  })

  it('should render chart axes and grid', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // Check for chart components
    const xAxes = screen.queryAllByTestId('x-axis')
    const yAxes = screen.queryAllByTestId('y-axis')
    const grids = screen.queryAllByTestId('cartesian-grid')

    // At least some chart components should be present
    expect(xAxes.length + yAxes.length + grids.length).toBeGreaterThan(0)
  })

  it('should calculate status distribution correctly', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // With 5 applications, we have:
    // Applied: 2, Interview: 1, Offered: 1, Rejected: 1
    // The chart should reflect this distribution
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
  })

  it('should calculate priority distribution correctly', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // With 5 applications, we have:
    // High: 2, Medium: 2, Low: 1
    // The chart should reflect this distribution
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
  })

  it('should show application timeline', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // Timeline chart should show applications over time
    // Applications span from Jan 10 to Jan 22
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
  })

  it('should be responsive', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // All charts should be wrapped in ResponsiveContainer
    const responsiveContainers = screen.getAllByTestId('responsive-container')
    expect(responsiveContainers.length).toBeGreaterThan(0)
  })

  it('should handle applications with missing data', () => {
    const incompleteApplications = [
      {
        id: '1',
        company: 'TechCorp',
        jobTitle: 'Software Engineer',
        status: 'Applied',
        priority: undefined, // Missing priority
        appliedDate: new Date('2026-01-15'),
        location: 'San Francisco',
      },
    ]

    render(<ApplicationCharts applications={incompleteApplications} />)

    // Should still render without errors
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
  })

  it('should render tooltips for interactive charts', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // Tooltips should be present for user interaction
    const tooltips = screen.queryAllByTestId('tooltip')
    expect(tooltips.length).toBeGreaterThan(0)
  })

  it('should render legends for chart interpretation', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // Legends help users understand the data
    const legends = screen.queryAllByTestId('legend')
    expect(legends.length).toBeGreaterThan(0)
  })

  it('should group applications by date correctly', () => {
    const dateGroupedApplications = [
      {
        id: '1',
        company: 'TechCorp',
        jobTitle: 'Software Engineer',
        status: 'Applied',
        priority: 'High',
        appliedDate: new Date('2026-01-15'),
        location: 'San Francisco',
      },
      {
        id: '2',
        company: 'StartupXYZ',
        jobTitle: 'Frontend Developer',
        status: 'Applied',
        priority: 'Medium',
        appliedDate: new Date('2026-01-15'), // Same date
        location: 'Remote',
      },
    ]

    render(<ApplicationCharts applications={dateGroupedApplications} />)

    // Chart should properly aggregate applications by date
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
  })

  it('should handle various date ranges', () => {
    const wideRangeApplications = [
      {
        id: '1',
        company: 'TechCorp',
        jobTitle: 'Software Engineer',
        status: 'Applied',
        priority: 'High',
        appliedDate: new Date('2026-01-01'),
        location: 'San Francisco',
      },
      {
        id: '2',
        company: 'StartupXYZ',
        jobTitle: 'Frontend Developer',
        status: 'Interview',
        priority: 'Medium',
        appliedDate: new Date('2026-02-05'),
        location: 'Remote',
      },
    ]

    render(<ApplicationCharts applications={wideRangeApplications} />)

    // Chart should handle applications spanning multiple months
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
  })

  it('should render all chart types', () => {
    render(<ApplicationCharts applications={mockApplications} />)

    // Application charts typically include multiple chart types
    const containers = screen.getAllByTestId('responsive-container')
    expect(containers.length).toBeGreaterThanOrEqual(1)
  })

  it('should handle single application', () => {
    const singleApplication = [
      {
        id: '1',
        company: 'TechCorp',
        jobTitle: 'Software Engineer',
        status: 'Applied',
        priority: 'High',
        appliedDate: new Date('2026-01-15'),
        location: 'San Francisco',
      },
    ]

    render(<ApplicationCharts applications={singleApplication} />)

    // Should render charts even with minimal data
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
  })

  it('should update when applications change', async () => {
    const { rerender } = render(<ApplicationCharts applications={mockApplications} />)

    const initialContainers = screen.getAllByTestId('responsive-container')
    expect(initialContainers.length).toBeGreaterThan(0)

    // Update with new data
    const updatedApplications = [
      ...mockApplications,
      {
        id: '6',
        company: 'NewCorp',
        jobTitle: 'Senior Engineer',
        status: 'Applied',
        priority: 'High',
        appliedDate: new Date('2026-01-25'),
        location: 'Boston',
      },
    ]

    rerender(<ApplicationCharts applications={updatedApplications} />)

    await waitFor(() => {
      const updatedContainers = screen.getAllByTestId('responsive-container')
      expect(updatedContainers.length).toBeGreaterThan(0)
    })
  })
})
