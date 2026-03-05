"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Search,
  Brain,
  MessageSquare,
  Compass,
  Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

export interface AgentOutput {
  readonly id: string;
  readonly type: string;
  readonly output: string;
  readonly createdAt: string;
}

export interface AgentRun {
  readonly id: string;
  readonly query: string;
  readonly location: string | null;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resultCount: number;
  readonly agentOutputs: readonly AgentOutput[];
}

// ── Helpers ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; animate?: boolean }
> = {
  completed: {
    label: "Completed",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  },
  running: {
    label: "Running",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    animate: true,
  },
  pending: {
    label: "Pending",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    animate: true,
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-700 border-red-500/20",
  },
};

const AGENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  job_searcher: { label: "Job Search Results", icon: Search },
  playwriter_linkedin: { label: "Job Search Results", icon: Search },
  skills_advisor: { label: "Skills Analysis", icon: Brain },
  interview_coach: { label: "Interview Prep", icon: MessageSquare },
  career_advisor: { label: "Career Strategy", icon: Compass },
};

function getAgentTypeConfig(type: string) {
  // Map short forms from the schema to full config
  if (type.includes("search") || type.includes("job")) {
    return AGENT_TYPE_CONFIG.job_searcher;
  }
  if (type.includes("skill")) {
    return AGENT_TYPE_CONFIG.skills_advisor;
  }
  if (type.includes("interview")) {
    return AGENT_TYPE_CONFIG.interview_coach;
  }
  if (type.includes("career")) {
    return AGENT_TYPE_CONFIG.career_advisor;
  }
  return (
    AGENT_TYPE_CONFIG[type] ?? {
      label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: Brain,
    }
  );
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const MAX_OUTPUT_LENGTH = 500;

// ── Output Section ─────────────────────────────────────────────────

function AgentOutputSection({ output }: { readonly output: AgentOutput }) {
  const [expanded, setExpanded] = useState(false);
  const config = getAgentTypeConfig(output.type);
  const Icon = config.icon;

  const isLong = output.output.length > MAX_OUTPUT_LENGTH;
  const displayText = expanded
    ? output.output
    : output.output.slice(0, MAX_OUTPUT_LENGTH);

  return (
    <details className="group border-t border-border/40">
      <summary className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors select-none">
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">{config.label}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {timeAgo(output.createdAt)}
        </span>
      </summary>
      <div className="px-4 pb-3">
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
          {displayText}
          {isLong && !expanded && "..."}
        </div>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs text-primary hover:underline mt-2"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </details>
  );
}

// ── Main Card ──────────────────────────────────────────────────────

export function AgentRunCard({ run }: { readonly run: AgentRun }) {
  const statusConfig = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.pending;

  return (
    <Card className="border-border/50 overflow-hidden" data-testid="agent-run-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" data-testid="agent-run-query">
              {run.query}
            </h3>
            {run.location && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {run.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={cn("text-[10px]", statusConfig.className)}
              data-testid="agent-run-status"
            >
              {statusConfig.animate && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1" />
              )}
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(run.createdAt)}
          </span>
          {run.resultCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {run.resultCount} job{run.resultCount !== 1 ? "s" : ""} found
            </span>
          )}
        </div>
      </CardHeader>
      {run.agentOutputs.length > 0 && (
        <CardContent className="p-0">
          {run.agentOutputs.map((output) => (
            <AgentOutputSection key={output.id} output={output} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
