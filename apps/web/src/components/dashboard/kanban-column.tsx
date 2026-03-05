"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { KanbanCard } from "./kanban-card";
import { Application } from "@/lib/types";

interface KanbanColumnProps {
  status: string;
  applications: Application[];
  count: number;
}

const COLUMN_HEADER_COLORS: Record<string, string> = {
  Pending: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  Applied: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  Interviewing: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  Offer: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
  Accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  Withdrawn: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30",
};

const COLUMN_ACCENT_COLORS: Record<string, string> = {
  Pending: "bg-purple-500",
  Applied: "bg-blue-500",
  Interviewing: "bg-amber-500",
  Offer: "bg-green-500",
  Accepted: "bg-emerald-500",
  Rejected: "bg-red-500",
  Withdrawn: "bg-gray-500",
};

export function KanbanColumn({ status, applications, count }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const headerColor =
    COLUMN_HEADER_COLORS[status] ?? "bg-muted text-foreground border-border";
  const accentColor = COLUMN_ACCENT_COLORS[status] ?? "bg-gray-500";

  const applicationIds = applications.map((app) => app.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-[280px] min-w-[280px] rounded-xl border bg-muted/30 transition-colors ${
        isOver ? "border-primary/50 bg-primary/5" : "border-border/40"
      }`}
    >
      {/* Color accent bar */}
      <div className={`h-1 rounded-t-xl ${accentColor}`} />

      {/* Header */}
      <div className="px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{status}</span>
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 ${headerColor}`}
          >
            {count}
          </Badge>
        </div>
      </div>

      {/* Card list */}
      <SortableContext
        items={applicationIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[120px]">
          {applications.length > 0 ? (
            applications.map((app) => (
              <KanbanCard key={app.id} application={app} />
            ))
          ) : (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
              No applications
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
