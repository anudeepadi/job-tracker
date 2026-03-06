"use client";

/**
 * Cover Letter Dialog Component
 *
 * Generates AI-powered cover letters tailored to specific job applications.
 * Persists resume text to localStorage for re-use across sessions.
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Copy,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RESUME_STORAGE_KEY = "hireagent-resume-text";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CoverLetterDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  company: string;
  role: string;
  jobDescription?: string;
  trigger?: React.ReactNode;
}

interface GenerationResult {
  coverLetter: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CoverLetterDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  company,
  role,
  jobDescription: initialJobDescription,
  trigger,
}: CoverLetterDialogProps) {
  // Dialog can be controlled or uncontrolled
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setInternalOpen;

  // Form state
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState(
    initialJobDescription ?? "",
  );

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load resume text from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RESUME_STORAGE_KEY);
      if (saved) {
        setResumeText(saved);
      }
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, []);

  // Sync job description when prop changes
  useEffect(() => {
    if (initialJobDescription) {
      setJobDescription(initialJobDescription);
    }
  }, [initialJobDescription]);

  // Save resume text to localStorage when it changes
  const handleResumeChange = (value: string) => {
    setResumeText(value);
    try {
      localStorage.setItem(RESUME_STORAGE_KEY, value);
    } catch {
      // Silently handle localStorage errors
    }
  };

  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text before generating.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please enter the job description before generating.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
          company,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "AGENT_UNAVAILABLE") {
          setError(
            "AI agent service is currently unavailable. Please try again later.",
          );
        } else {
          setError(data.error || "Failed to generate cover letter");
        }
        return;
      }

      setResult({
        coverLetter: data.data.coverLetter,
        generatedAt: data.data.generatedAt,
      });
      toast.success("Cover letter generated!");
    } catch (err) {
      console.error("Failed to generate cover letter:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.coverLetter);
      toast.success("Cover letter copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cover-letter-${company.toLowerCase().replace(/\s+/g, "-")}-${role.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Cover letter downloaded!");
  };

  const handleRegenerate = () => {
    setResult(null);
    setError(null);
    handleGenerate();
  };

  const canGenerate =
    resumeText.trim().length > 0 && jobDescription.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            AI Cover Letter Generator
          </DialogTitle>
          <DialogDescription>
            Generate a tailored cover letter for {role} at {company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input Form (hidden after generation) */}
          {!result && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cover-letter-resume">Your Resume</Label>
                <Textarea
                  id="cover-letter-resume"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => handleResumeChange(e.target.value)}
                  rows={6}
                  className="resize-y text-sm"
                  data-testid="resume-textarea"
                />
                <p className="text-xs text-muted-foreground">
                  Your resume is saved locally for convenience.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover-letter-job-desc">Job Description</Label>
                <Textarea
                  id="cover-letter-job-desc"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="resize-y text-sm"
                  data-testid="job-description-textarea"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !canGenerate}
                size="lg"
                className="w-full"
                data-testid="generate-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating your cover letter...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </>
          )}

          {/* Generated Result */}
          {result && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre
                  className="text-sm whitespace-pre-wrap font-sans leading-relaxed"
                  data-testid="cover-letter-output"
                >
                  {result.coverLetter}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download .txt
                </Button>
                <Button variant="outline" onClick={handleRegenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Generated at{" "}
                {new Date(result.generatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
