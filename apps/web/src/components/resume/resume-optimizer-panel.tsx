"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FileText,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  Eye,
} from "lucide-react";
import { TailoredResumeDialog } from "./tailored-resume-dialog";
import { ResumeDiffView } from "./resume-diff-view";
import { ATSScoreBadge } from "./ats-score-badge";
import { toast } from "sonner";
import Link from "next/link";

interface Application {
  id: string;
  company: string;
  jobTitle: string;
  status: string;
  notes?: string | null;
  jobUrl?: string | null;
  tailoredResumeContent?: string | null;
}

interface ATSScoreData {
  readonly score: number;
  readonly matchedKeywords: readonly string[];
  readonly missingKeywords: readonly string[];
  readonly suggestions: readonly string[];
}

export function ResumeOptimizerPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [hasInventory, setHasInventory] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Diff + ATS state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [atsData, setAtsData] = useState<ATSScoreData | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [resumeInventoryText, setResumeInventoryText] = useState<string | null>(
    null,
  );

  // Fetch resume inventory text for ATS scoring
  const fetchResumeInventoryText = useCallback(async (): Promise<
    string | null
  > => {
    if (resumeInventoryText !== null) return resumeInventoryText;
    try {
      const res = await fetch("/api/settings/resume-inventory");
      if (!res.ok) return null;
      const data = await res.json();
      const text =
        typeof data.value === "string"
          ? data.value
          : JSON.stringify(data.value, null, 2);
      setResumeInventoryText(text);
      return text;
    } catch {
      return null;
    }
  }, [resumeInventoryText]);

  // Select an app and fetch its ATS score
  const handleViewDiff = useCallback(
    (app: Application) => {
      // Toggle off if already selected
      if (selectedApp?.id === app.id) {
        setSelectedApp(null);
        setAtsData(null);
        return;
      }
      setSelectedApp(app);
      setAtsData(null);
    },
    [selectedApp],
  );

  const handleCheckATS = useCallback(
    async (app: Application) => {
      if (!app.tailoredResumeContent || !app.notes) {
        toast.error("Both a tailored resume and job description are required.");
        return;
      }

      setSelectedApp(app);
      setAtsLoading(true);
      setAtsData(null);

      try {
        const inventoryText = await fetchResumeInventoryText();
        const resumeText = app.tailoredResumeContent;
        const jobDescription = app.notes;

        const res = await fetch("/api/ai/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText, jobDescription }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to check ATS score");
          return;
        }

        const result = await res.json();
        setAtsData(result.data);
      } catch (error) {
        console.error("Failed to check ATS score:", error);
        toast.error("An unexpected error occurred while checking ATS score.");
      } finally {
        setAtsLoading(false);
      }
    },
    [fetchResumeInventoryText],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, inventoryRes] = await Promise.all([
          fetch("/api/applications"),
          fetch("/api/ai/tailor-resume"),
        ]);

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications || []);
        }

        if (inventoryRes.ok) {
          const invData = await inventoryRes.json();
          setHasInventory(invData.hasInventory);
        }
      } catch (error) {
        console.error("Failed to load resume optimizer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Active applications (in interview pipeline or recently applied)
  const activeApps = applications.filter((app) =>
    [
      "Applied",
      "Phone Screen",
      "Technical Interview",
      "Final Interview",
      "Interviewing",
    ].includes(app.status),
  );

  // Applications that already have tailored resumes
  const tailoredCount = applications.filter(
    (app) => app.tailoredResumeContent,
  ).length;

  const optimizationScore =
    applications.length > 0
      ? Math.round((tailoredCount / Math.max(activeApps.length, 1)) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading resume optimizer...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
          <CardContent className="py-5 px-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Optimization Score
                </p>
                <p className="text-2xl font-bold">{optimizationScore}%</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, optimizationScore)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="py-5 px-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Active Applications
                </p>
                <p className="text-2xl font-bold">{activeApps.length}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Needing tailored resumes
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="py-5 px-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Resumes Tailored
                </p>
                <p className="text-2xl font-bold">{tailoredCount}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              AI-optimized for specific roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resume Inventory Check */}
      {hasInventory === false && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-5 px-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                  Resume Inventory Required
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  To use AI resume tailoring, add your skills, experience, and
                  projects in Settings. This helps the AI generate personalized
                  resume content.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link href="/settings">
                    Go to Settings
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Applications needing resume tailoring */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Quick Tailor
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Generate AI-optimized resume content for your active
                applications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeApps.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No active applications to optimize
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Apply to jobs first, then come back to tailor your resume
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeApps.slice(0, 10).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-border/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                      {app.company[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {app.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {app.status}
                    </Badge>
                    {app.tailoredResumeContent ? (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-0"
                        >
                          Tailored
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleViewDiff(app)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Diff
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCheckATS(app)}
                          disabled={atsLoading}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          ATS
                        </Button>
                      </div>
                    ) : (
                      <TailoredResumeDialog
                        jobTitle={app.jobTitle}
                        jobDescription={app.notes || ""}
                        company={app.company}
                        applicationId={app.id}
                        trigger={
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={!hasInventory}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Tailor
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume Diff View */}
      {selectedApp?.tailoredResumeContent && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Resume Comparison — {selectedApp.jobTitle} at{" "}
                  {selectedApp.company}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Side-by-side diff of original job notes vs tailored resume
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedApp(null);
                  setAtsData(null);
                }}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResumeDiffView
              original={selectedApp.notes || "(No original job description)"}
              tailored={selectedApp.tailoredResumeContent}
            />
          </CardContent>
        </Card>
      )}

      {/* ATS Score */}
      {selectedApp && (atsLoading || atsData) && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              ATS Compatibility Score — {selectedApp.jobTitle} at{" "}
              {selectedApp.company}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              How well the tailored resume matches the job description for ATS
              screening
            </CardDescription>
          </CardHeader>
          <CardContent>
            {atsLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Analyzing ATS compatibility...
                </p>
              </div>
            ) : atsData ? (
              <ATSScoreBadge data={atsData} />
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Resume Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: "Match Keywords",
                desc: "Mirror the exact job posting language in your resume to pass ATS filters",
              },
              {
                title: "Quantify Impact",
                desc: "Use numbers and metrics (e.g., 'Reduced load time by 40%') for every bullet",
              },
              {
                title: "Tailor Per Application",
                desc: "Reorder skills and experience to match each specific job's priorities",
              },
              {
                title: "Keep it Concise",
                desc: "1 page for <10 years experience, 2 pages max. Every line must earn its place",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tip.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
