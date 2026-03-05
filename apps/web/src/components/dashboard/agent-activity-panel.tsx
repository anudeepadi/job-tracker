"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AgentRunCard, AgentRun } from "./agent-run-card";
import { Bot, AlertCircle, Loader2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

interface AgentRunsResponse {
  readonly agentRuns: readonly AgentRun[];
}

type PanelState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "loaded"; readonly runs: readonly AgentRun[] };

// ── Constants ──────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;

// ── Component ──────────────────────────────────────────────────────

export function AgentActivityPanel() {
  const [state, setState] = useState<PanelState>({ kind: "loading" });
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const response = await fetch("/api/agent-runs");
      if (!response.ok) {
        throw new Error(`Failed to fetch agent runs (${response.status})`);
      }
      const data: AgentRunsResponse = await response.json();
      setState({ kind: "loaded", runs: data.agentRuns });
      return data.agentRuns;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setState((prev) =>
        prev.kind === "loaded" ? prev : { kind: "error", message },
      );
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAndPoll = async () => {
      const runs = await fetchRuns();
      if (cancelled) return;

      const hasActive = runs.some(
        (r) => r.status === "running" || r.status === "pending",
      );

      if (hasActive) {
        pollTimerRef.current = setTimeout(loadAndPoll, POLL_INTERVAL_MS);
      }
    };

    loadAndPoll();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchRuns]);

  // ── Render states ──────────────────────────────────────────────

  if (state.kind === "loading") {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading agent activity...
          </p>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => {
              setState({ kind: "loading" });
              fetchRuns();
            }}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (state.runs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16" data-testid="agent-empty-state">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No agent activity yet. Start a job search to see your AI agents in
            action.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="agent-activity-list">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Agent Activity</h2>
        <p className="text-xs text-muted-foreground">
          {state.runs.length} recent search{state.runs.length !== 1 ? "es" : ""}
        </p>
      </div>
      <div className="space-y-3">
        {state.runs.map((run) => (
          <AgentRunCard key={run.id} run={run} />
        ))}
      </div>
    </div>
  );
}
