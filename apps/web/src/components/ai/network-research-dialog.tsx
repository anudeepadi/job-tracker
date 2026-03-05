"use client";

/**
 * Network Research Dialog Component
 *
 * Allows users to generate AI-powered networking strategies
 * for target companies.
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
import { Copy, AlertCircle, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface NetworkResearchDialogProps {
  company: string;
  role: string;
  trigger?: React.ReactNode;
}

export function NetworkResearchDialog({
  company,
  role,
  trigger,
}: NetworkResearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [research, setResearch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResearch(null);

    try {
      const response = await fetch("/api/ai/network-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === "AGENT_UNAVAILABLE") {
          setError(
            "AI agent service is currently unavailable. Please try again later.",
          );
        } else {
          setError(result.error || "Failed to generate networking research");
        }
        return;
      }

      setResearch(result.data.research);
      toast.success("Networking research generated!");
    } catch (err) {
      console.error("Failed to generate networking research:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Research copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Research Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Networking Research
          </DialogTitle>
          <DialogDescription>
            Discover networking strategies for {role} at {company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!research && (
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
                    Researching networking strategies...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Research Networking Opportunities
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center max-w-md">
                Our AI will research the company and provide LinkedIn search
                queries, key contacts to connect with, relevant events, and
                conversation starters.
              </p>
            </div>
          )}

          {research && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {research}
                </pre>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResearch(null);
                    setError(null);
                  }}
                >
                  Research Again
                </Button>
                <Button
                  variant="default"
                  onClick={() => copyToClipboard(research)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Research
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
