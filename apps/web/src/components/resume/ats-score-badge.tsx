"use client";

/**
 * ATS Score Badge Component
 *
 * Displays the ATS analysis results: a circular progress ring with the score,
 * matched/missing keyword badges, and a numbered list of suggestions.
 */

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";

interface ATSScoreData {
  readonly score: number;
  readonly matchedKeywords: readonly string[];
  readonly missingKeywords: readonly string[];
  readonly suggestions: readonly string[];
}

interface ATSScoreBadgeProps {
  readonly data: ATSScoreData;
}

// ---------------------------------------------------------------------------
// Score ring colour helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
  if (score < 50) return "text-red-500";
  if (score <= 75) return "text-yellow-500";
  return "text-green-500";
}

function getScoreStroke(score: number): string {
  if (score < 50) return "stroke-red-500";
  if (score <= 75) return "stroke-yellow-500";
  return "stroke-green-500";
}

function getScoreTrack(score: number): string {
  if (score < 50) return "stroke-red-500/20";
  if (score <= 75) return "stroke-yellow-500/20";
  return "stroke-green-500/20";
}

function getScoreLabel(score: number): string {
  if (score < 50) return "Needs Work";
  if (score <= 75) return "Good Match";
  return "Excellent";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ATSScoreBadge({ data }: ATSScoreBadgeProps) {
  const { score, matchedKeywords, missingKeywords, suggestions } = data;

  // SVG circle math (radius 45, circumference ~283)
  const circumference = useMemo(() => 2 * Math.PI * 45, []);
  const offset = useMemo(
    () => circumference - (score / 100) * circumference,
    [circumference, score],
  );

  return (
    <div className="space-y-6">
      {/* Score ring */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-32 w-32">
          <svg
            className="h-32 w-32 -rotate-90"
            viewBox="0 0 100 100"
            aria-label={`ATS score: ${score} out of 100`}
          >
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              className={getScoreTrack(score)}
            />
            {/* Progress */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${getScoreStroke(score)} transition-all duration-700 ease-out`}
            />
          </svg>
          {/* Centered score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              ATS Score
            </span>
          </div>
        </div>
        <span
          className={`text-sm font-medium ${getScoreColor(score)}`}
        >
          {getScoreLabel(score)}
        </span>
      </div>

      {/* Keywords columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matched */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Matched Keywords
          </h4>
          {matchedKeywords.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No matched keywords found
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {matchedKeywords.map((kw) => (
                <Badge
                  key={kw}
                  variant="secondary"
                  className="text-[11px] bg-green-500/10 text-green-700 dark:text-green-400 border-0"
                >
                  {kw}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Missing */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Missing Keywords
          </h4>
          {missingKeywords.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              All key skills present
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missingKeywords.map((kw) => (
                <Badge
                  key={kw}
                  variant="secondary"
                  className="text-[11px] bg-orange-500/10 text-orange-700 dark:text-orange-400 border-0"
                >
                  {kw}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            Improvement Suggestions
          </h4>
          <ol className="space-y-2 pl-1">
            {suggestions.map((suggestion, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
