"use client";

/**
 * Tailored Resume Dialog Component
 *
 * Allows users to generate AI-tailored resume content for specific job applications
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TailoredResumeDialogProps {
  jobTitle: string;
  jobDescription: string;
  company?: string;
  applicationId?: string;
  trigger?: React.ReactNode;
}

interface TailoredContent {
  summary: string;
  keySkills: string[];
  experienceHighlights: {
    original: string;
    tailored: string;
    reasoning: string;
  }[];
  projectHighlights: {
    original: string;
    tailored: string;
    reasoning: string;
  }[];
  additionalTips: string[];
}

export function TailoredResumeDialog({
  jobTitle,
  jobDescription,
  company,
  applicationId,
  trigger,
}: TailoredResumeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInventory, setHasInventory] = useState<boolean | null>(null);
  const [tailoredContent, setTailoredContent] = useState<TailoredContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkInventory = async () => {
    try {
      const response = await fetch("/api/ai/tailor-resume");
      const data = await response.json();
      setHasInventory(data.hasInventory);
      if (!data.hasInventory) {
        setError("Please add your resume details in Settings first.");
      }
    } catch (err) {
      console.error("Failed to check inventory:", err);
      setError("Failed to check resume inventory");
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setTailoredContent(null);

    try {
      const response = await fetch("/api/ai/tailor-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          company,
          applicationId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === "NO_RESUME_INVENTORY") {
          setError("Please add your resume details in Settings → Resume Inventory first.");
        } else if (result.code === "API_KEY_MISSING") {
          setError("AI service is not configured. Please contact support.");
        } else {
          setError(result.error || "Failed to generate tailored resume");
        }
        return;
      }

      setTailoredContent(result.data);
      toast.success("Resume tailored successfully!");
    } catch (err) {
      console.error("Failed to tailor resume:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && hasInventory === null) {
      checkInventory();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Tailor Resume
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Resume Tailoring
          </DialogTitle>
          <DialogDescription>
            Generate customized resume content for {jobTitle}
            {company && ` at ${company}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate Button */}
          {!tailoredContent && (
            <div className="flex flex-col items-center gap-4 py-8">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md w-full">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isLoading || hasInventory === false}
                size="lg"
                className="w-full max-w-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating tailored resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI-Tailored Resume
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center max-w-md">
                Our AI will analyze the job description and your resume to create
                tailored content that emphasizes your most relevant skills and experiences.
              </p>
            </div>
          )}

          {/* Tailored Content Display */}
          {tailoredContent && (
            <div className="space-y-6">
              {/* Professional Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Professional Summary</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(tailoredContent.summary, "Summary")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">{tailoredContent.summary}</p>
                </div>
              </div>

              {/* Key Skills */}
              {tailoredContent.keySkills.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Key Skills to Emphasize</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(tailoredContent.keySkills.join(", "), "Skills")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tailoredContent.keySkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience Highlights */}
              {tailoredContent.experienceHighlights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Experience Highlights</h3>
                  <div className="space-y-4">
                    {tailoredContent.experienceHighlights.map((item, idx) => (
                      <div key={idx} className="border rounded-md p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium">{item.tailored}</p>
                            <p className="text-xs text-muted-foreground italic">
                              {item.reasoning}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(item.tailored, "Experience bullet")
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Highlights */}
              {tailoredContent.projectHighlights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Project Highlights</h3>
                  <div className="space-y-4">
                    {tailoredContent.projectHighlights.map((item, idx) => (
                      <div key={idx} className="border rounded-md p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium">{item.tailored}</p>
                            <p className="text-xs text-muted-foreground italic">
                              {item.reasoning}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(item.tailored, "Project description")
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Tips */}
              {tailoredContent.additionalTips.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Additional Tips</h3>
                  <ul className="space-y-2">
                    {tailoredContent.additionalTips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTailoredContent(null);
                    setError(null);
                  }}
                >
                  Generate Again
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    // Copy all content
                    const allContent = `
Professional Summary:
${tailoredContent.summary}

Key Skills:
${tailoredContent.keySkills.join(", ")}

Experience Highlights:
${tailoredContent.experienceHighlights.map(h => `• ${h.tailored}`).join("\n")}

Project Highlights:
${tailoredContent.projectHighlights.map(h => `• ${h.tailored}`).join("\n")}
                    `.trim();
                    copyToClipboard(allContent, "All content");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
