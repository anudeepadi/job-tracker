"use client";

/**
 * Resume Diff View Component
 *
 * Side-by-side comparison of original and tailored resume content.
 * Lines that differ between the two versions are highlighted in green on the
 * tailored side and in red/muted on the original side.
 */

import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ResumeDiffViewProps {
  readonly original: string;
  readonly tailored: string;
}

interface DiffLine {
  readonly text: string;
  readonly changed: boolean;
}

/**
 * Compare two texts line-by-line and flag lines that differ.
 * Returns a tuple of [originalLines, tailoredLines].
 */
function computeLineDiff(
  original: string,
  tailored: string,
): readonly [readonly DiffLine[], readonly DiffLine[]] {
  const originalLines = original.split("\n");
  const tailoredLines = tailored.split("\n");
  const maxLen = Math.max(originalLines.length, tailoredLines.length);

  const origResult: DiffLine[] = [];
  const tailResult: DiffLine[] = [];

  for (let i = 0; i < maxLen; i++) {
    const origText = originalLines[i] ?? "";
    const tailText = tailoredLines[i] ?? "";
    const changed = origText.trim() !== tailText.trim();

    origResult.push({ text: origText, changed });
    tailResult.push({ text: tailText, changed });
  }

  return [origResult, tailResult] as const;
}

export function ResumeDiffView({ original, tailored }: ResumeDiffViewProps) {
  const [origLines, tailLines] = useMemo(
    () => computeLineDiff(original, tailored),
    [original, tailored],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(tailored);
      toast.success("Tailored resume copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [tailored]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original side */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Original Resume
            </h4>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 max-h-96 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {origLines.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.changed
                    ? "bg-red-500/10 text-red-700 dark:text-red-400 px-1 -mx-1 rounded"
                    : ""
                }
              >
                {line.text || "\u00A0"}
              </div>
            ))}
          </div>
        </div>

        {/* Tailored side */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Tailored Resume
            </h4>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 max-h-96 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {tailLines.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.changed
                    ? "bg-green-500/10 text-green-700 dark:text-green-400 px-1 -mx-1 rounded"
                    : ""
                }
              >
                {line.text || "\u00A0"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
