"use client";

/**
 * Follow-up Email Dialog Component
 *
 * Allows users to generate AI-powered follow-up emails for job applications.
 * Visible when the application was submitted 7+ days ago.
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
import { Copy, AlertCircle, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

interface FollowupEmailDialogProps {
  company: string;
  role: string;
  applicationDate: string | Date;
  trigger?: React.ReactNode;
}

export function FollowupEmailDialog({
  company,
  role,
  applicationDate,
  trigger,
}: FollowupEmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailContent, setEmailContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setEmailContent(null);

    try {
      const response = await fetch("/api/ai/followup-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          applicationDate:
            typeof applicationDate === "string"
              ? applicationDate
              : applicationDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === "AGENT_UNAVAILABLE") {
          setError(
            "AI agent service is currently unavailable. Please try again later.",
          );
        } else {
          setError(result.error || "Failed to generate follow-up email");
        }
        return;
      }

      setEmailContent(result.data.email);
      toast.success("Follow-up email generated!");
    } catch (err) {
      console.error("Failed to generate follow-up email:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Email copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Draft Follow-up
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            AI Follow-up Email
          </DialogTitle>
          <DialogDescription>
            Generate a professional follow-up email for {role} at {company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!emailContent && (
            <div className="flex flex-col items-center gap-4 py-6">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md w-full">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                size="lg"
                className="w-full max-w-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Drafting follow-up email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Generate Follow-up Email
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center max-w-md">
                Our AI will draft a professional follow-up email with the
                appropriate tone for the time elapsed since your application.
              </p>
            </div>
          )}

          {emailContent && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {emailContent}
                </pre>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailContent(null);
                    setError(null);
                  }}
                >
                  Generate Again
                </Button>
                <Button
                  variant="default"
                  onClick={() => copyToClipboard(emailContent)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
