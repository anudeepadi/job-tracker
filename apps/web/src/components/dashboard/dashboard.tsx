"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/lib/auth-context";
import {
  useKeyboardShortcuts,
  DEFAULT_SHORTCUTS,
} from "@/lib/keyboard-shortcuts";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";
import { StatsCards } from "./stats-cards";
import { ApplicationCharts } from "./application-charts";
import { ApplicationTable } from "./application-table";
import { AddApplicationDialog } from "./add-application-dialog";
import { EditApplicationDialog } from "./edit-application-dialog";
import { RemindersPanel } from "./reminders-panel";
import { JobSearchPanel } from "@/components/job-search/job-search-panel";
import { ResumeOptimizerPanel } from "@/components/resume/resume-optimizer-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Download,
  Sparkles,
  Keyboard,
  MoreHorizontal,
  DollarSign,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Application, ApplicationStats, JobResult } from "@/lib/types";
import { toast } from "sonner";

// ── Chart colors ────────────────────────────────────────────────────
const PIE_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6b7280",
  "#8b5cf6",
];

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  useKeyboardShortcuts([
    ...DEFAULT_SHORTCUTS.map((s) => ({
      ...s,
      action: s.key === "n" ? () => setIsAddDialogOpen(true) : s.action,
    })),
  ]);

  // ── Data fetching ─────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/applications/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard statistics");
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications?limit=500");
      if (!response.ok) throw new Error("Failed to fetch applications");
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchApplications()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleNewApplication = () => setIsAddDialogOpen(true);
    window.addEventListener("open:new-application", handleNewApplication);
    return () =>
      window.removeEventListener("open:new-application", handleNewApplication);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleApplicationAdded = () => {
    fetchStats();
    fetchApplications();
    setIsAddDialogOpen(false);
    toast.success("Application added successfully");
  };

  const handleApplicationUpdated = () => {
    fetchStats();
    fetchApplications();
    setIsEditDialogOpen(false);
    setEditingApplication(null);
  };

  const handleApplicationDeleted = () => {
    fetchStats();
    fetchApplications();
    toast.success("Application deleted successfully");
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    setIsEditDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/applications/export");
      if (!response.ok) throw new Error("Failed to export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Applications exported successfully");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export applications");
    }
  };

  const handleImportJob = useCallback(async (job: JobResult) => {
    let salaryMin: number | undefined;
    let salaryMax: number | undefined;
    if (job.salary_range) {
      const numbers = job.salary_range.match(/[\d,]+/g);
      if (numbers && numbers.length >= 1) {
        salaryMin = parseInt(numbers[0].replace(/,/g, ""));
        if (numbers.length >= 2) {
          salaryMax = parseInt(numbers[1].replace(/,/g, ""));
        }
      }
    }

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: job.company,
        jobTitle: job.title,
        jobUrl: job.url,
        location: job.location,
        locationType: job.location?.toLowerCase().includes("remote")
          ? "Remote"
          : undefined,
        salaryMin,
        salaryMax,
        status: "Applied",
        priority: "Medium",
        source: job.source || "AI Search",
        appliedDate: new Date().toISOString().split("T")[0],
        notes: job.description ? `Description: ${job.description}` : undefined,
      }),
    });

    if (!response.ok) throw new Error("Failed to import job");
    await Promise.all([fetchStats(), fetchApplications()]);
  }, []);

  // ── Computed chart data ───────────────────────────────────────────
  const weeklyChartData = stats?.weeklyTimelineData.slice(-8) ?? [];

  const successRate = stats
    ? stats.totalApplications > 0
      ? Math.round(
          ((stats.funnelData.offer / stats.totalApplications) * 100 +
            Number.EPSILON) *
            10,
        ) / 10
      : 0
    : 0;

  const sourceData = stats
    ? Object.entries(stats.sourceStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const totalFromSources = sourceData.reduce((sum, s) => sum + s.value, 0);

  // ── Greeting ──────────────────────────────────────────────────────
  const displayName = user?.name || user?.email?.split("@")[0] || "there";

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* ── Floating Tab Bar ─────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex items-center justify-center">
          <TabsList className="inline-flex w-fit bg-muted/60 backdrop-blur border border-border/40 rounded-full px-1 py-1 h-auto">
            <TabsTrigger
              value="overview"
              className="rounded-full px-3 md:px-4 py-1.5 text-xs md:text-sm data-[state=active]:bg-foreground data-[state=active]:text-background whitespace-nowrap"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="rounded-full px-3 md:px-4 py-1.5 text-xs md:text-sm data-[state=active]:bg-foreground data-[state=active]:text-background whitespace-nowrap"
            >
              Applications
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-full px-3 md:px-4 py-1.5 text-xs md:text-sm data-[state=active]:bg-foreground data-[state=active]:text-background whitespace-nowrap"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="reminders"
              className="rounded-full px-3 md:px-4 py-1.5 text-xs md:text-sm data-[state=active]:bg-foreground data-[state=active]:text-background whitespace-nowrap"
            >
              Reminders
            </TabsTrigger>
            <TabsTrigger
              value="ai-search"
              className="rounded-full px-3 md:px-4 py-1.5 text-xs md:text-sm data-[state=active]:bg-foreground data-[state=active]:text-background flex items-center gap-1 whitespace-nowrap"
            >
              <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />
              AI Search
            </TabsTrigger>
            <TabsTrigger
              value="resume"
              className="rounded-full px-3 md:px-4 py-1.5 text-xs md:text-sm data-[state=active]:bg-foreground data-[state=active]:text-background flex items-center gap-1 whitespace-nowrap"
            >
              <FileText className="h-3 w-3 md:h-3.5 md:w-3.5" />
              Resume
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Welcome Header ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here&apos;s what&apos;s happening with your job search today.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcutsHelp(true)}
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            OVERVIEW TAB
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {stats && (
            <>
              {/* Row 1: 4 KPI stat cards in a row */}
              <StatsCards stats={stats} onViewDetails={setActiveTab} />

              {/* Row 1.5: Hiring Funnel — visual conversion stages */}
              <Card className="border-border/50">
                <CardContent className="py-5 px-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Hiring Funnel</h3>
                    <span className="text-xs text-muted-foreground">
                      Conversion through stages
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      {
                        label: "Applied",
                        value: stats.funnelData.applied,
                        color: "#3b82f6",
                      },
                      {
                        label: "Screen",
                        value: stats.funnelData.screen,
                        color: "#8b5cf6",
                      },
                      {
                        label: "Interview",
                        value: stats.funnelData.interview,
                        color: "#ec4899",
                      },
                      {
                        label: "Offer",
                        value: stats.funnelData.offer,
                        color: "#10b981",
                      },
                    ].map((stage, idx, arr) => (
                      <div
                        key={stage.label}
                        className="flex items-center gap-2 flex-1"
                      >
                        <div className="flex-1 text-center">
                          <div
                            className="mx-auto mb-2 rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: `${stage.color}15`,
                              border: `1.5px solid ${stage.color}40`,
                              height: "56px",
                            }}
                          >
                            <span
                              className="text-xl font-bold"
                              style={{ color: stage.color }}
                            >
                              {stage.value}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {stage.label}
                          </span>
                          {idx > 0 && stats.funnelData.applied > 0 && (
                            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                              {Math.round(
                                (stage.value / stats.funnelData.applied) * 100,
                              )}
                              %
                            </p>
                          )}
                        </div>
                        {idx < arr.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Row 2: Pipeline chart + Success donut */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Pipeline bar chart (2/3 width) */}
                <div className="lg:col-span-2">
                  <Card className="border-border/50 h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            Application Pipeline
                          </CardTitle>
                          <div className="flex items-baseline gap-3 mt-1">
                            <span className="text-2xl font-bold">
                              {stats.totalApplications}
                            </span>
                            {stats.monthlyApplications > 0 && (
                              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                                +{stats.monthlyApplications} this month
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="p-1 rounded hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={weeklyChartData} barSize={28}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-border/40"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            tickFormatter={(v) =>
                              new Date(v).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            }
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "8px",
                              border: "1px solid hsl(var(--border))",
                              backgroundColor: "hsl(var(--card))",
                              color: "hsl(var(--foreground))",
                              fontSize: "12px",
                            }}
                            labelFormatter={(v) =>
                              `Week of ${new Date(v).toLocaleDateString()}`
                            }
                          />
                          <Bar
                            dataKey="count"
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Right column: Success rate + Salary insight */}
                <div className="lg:col-span-1 flex flex-col gap-4 lg:gap-6">
                  {/* Success rate donut */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          Success Rate
                        </CardTitle>
                        <button className="p-1 rounded hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="relative w-36 h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  {
                                    name: "Success",
                                    value: successRate || 0.1,
                                  },
                                  {
                                    name: "Remaining",
                                    value: 100 - (successRate || 0.1),
                                  },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={44}
                                outerRadius={60}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="hsl(var(--muted))" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold">
                              {successRate}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Offer Rate
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full mt-3 pt-3 border-t border-border/40">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              Offers
                            </p>
                            <p className="text-lg font-bold">
                              {stats.funnelData.offer}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              Interviews
                            </p>
                            <p className="text-lg font-bold">
                              {stats.funnelData.interview}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Salary insight card */}
                  {stats.salaryAnalysis && stats.salaryAnalysis.count > 0 && (
                    <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-blue-500/5">
                      <CardContent className="py-4 px-5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-semibold">
                            Salary Range
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-muted-foreground">
                              Average
                            </span>
                            <span className="text-lg font-bold">
                              ${Math.round(stats.salaryAnalysis.avgMid / 1000)}k
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                              style={{
                                width: `${Math.min(100, ((stats.salaryAnalysis.avgMid - stats.salaryAnalysis.min) / (stats.salaryAnalysis.max - stats.salaryAnalysis.min)) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>
                              ${Math.round(stats.salaryAnalysis.min / 1000)}k
                            </span>
                            <span>
                              ${Math.round(stats.salaryAnalysis.max / 1000)}k
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Row 3: Recent apps table + Source overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Recent applications (2/3 width) */}
                <div className="lg:col-span-2">
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            Recent Applications
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Keep track of all your applications here
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setActiveTab("applications")}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ApplicationTable
                        applications={applications.slice(0, 10)}
                        onUpdate={handleApplicationUpdated}
                        onDelete={handleApplicationDeleted}
                        onEdit={handleEdit}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Source overview (1/3 width) */}
                <div className="lg:col-span-1">
                  <Card className="border-border/50 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          Source Overview
                        </CardTitle>
                        <button className="p-1 rounded hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Source percentage breakdown */}
                      {sourceData.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 mb-4">
                            {sourceData.slice(0, 3).map((s, i) => (
                              <div
                                key={s.name}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="h-2.5 w-2.5 rounded-sm"
                                  style={{ backgroundColor: PIE_COLORS[i] }}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {s.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-3 mb-6">
                            {sourceData.slice(0, 3).map((s) => {
                              const pct =
                                totalFromSources > 0
                                  ? (
                                      (s.value / totalFromSources) *
                                      100
                                    ).toFixed(1)
                                  : "0";
                              return (
                                <div key={s.name}>
                                  <span className="text-xl font-bold">
                                    {pct}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Bar visualization */}
                          <div className="flex h-6 rounded-md overflow-hidden mb-6">
                            {sourceData.map((s, i) => {
                              const pct =
                                totalFromSources > 0
                                  ? (s.value / totalFromSources) * 100
                                  : 0;
                              return (
                                <div
                                  key={s.name}
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor:
                                      PIE_COLORS[i % PIE_COLORS.length],
                                  }}
                                  className="first:rounded-l-md last:rounded-r-md"
                                  title={`${s.name}: ${s.value}`}
                                />
                              );
                            })}
                          </div>

                          {/* Source list */}
                          <div className="space-y-3">
                            {sourceData.map((s, i) => {
                              const pct =
                                totalFromSources > 0
                                  ? (
                                      (s.value / totalFromSources) *
                                      100
                                    ).toFixed(0)
                                  : "0";
                              return (
                                <div
                                  key={s.name}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                                      style={{
                                        backgroundColor:
                                          PIE_COLORS[i % PIE_COLORS.length],
                                      }}
                                    >
                                      {s.name[0]}
                                    </div>
                                    <span className="text-sm font-medium">
                                      {s.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-muted-foreground">
                                      {pct}%
                                    </span>
                                    <span className="font-semibold">
                                      {s.value}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No source data yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            APPLICATIONS TAB
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="applications" className="space-y-4 mt-0">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                All Applications
              </CardTitle>
              <CardDescription className="text-xs">
                {applications.length} total applications tracked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationTable
                applications={applications}
                onUpdate={handleApplicationUpdated}
                onDelete={handleApplicationDeleted}
                onEdit={handleEdit}
                showPagination={true}
                showFilters={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            ANALYTICS TAB
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          {stats && (
            <>
              <StatsCards stats={stats} onViewDetails={setActiveTab} />
              <ApplicationCharts stats={stats} />
            </>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            REMINDERS TAB
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="reminders" className="space-y-4 mt-0">
          <RemindersPanel />
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            AI SEARCH TAB
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="ai-search" className="space-y-4 mt-0">
          <JobSearchPanel onImportJob={handleImportJob} />
        </TabsContent>

        {/* ════════════════════════════════════════════════════════
            RESUME OPTIMIZER TAB
            ════════════════════════════════════════════════════════ */}
        <TabsContent value="resume" className="space-y-6 mt-0">
          <ResumeOptimizerPanel />
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ──────────────────────────────────────────────── */}
      <AddApplicationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onApplicationAdded={handleApplicationAdded}
      />
      <EditApplicationDialog
        application={editingApplication}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onApplicationUpdated={handleApplicationUpdated}
      />
      <CommandPalette />
      <KeyboardShortcutsHelp
        open={showShortcutsHelp}
        onOpenChange={setShowShortcutsHelp}
      />
    </div>
  );
}
