"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Application } from "@/lib/types";

interface KanbanCardProps {
  application: Application;
}

const PRIORITY_DOT_COLORS: Record<string, string> = {
  High: "bg-red-500",
  Medium: "bg-yellow-500",
  Low: "bg-green-500",
};

function formatDaysAgo(date: string | Date): string {
  const appliedDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - appliedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d ago";
  return `${diffDays}d ago`;
}

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  if (min && max) return `${fmt(min)}-${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export function KanbanCard({ application }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const salary = formatSalary(application.salaryMin, application.salaryMax);
  const priorityDot = PRIORITY_DOT_COLORS[application.priority] ?? "bg-gray-400";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all ${
          isDragging ? "opacity-50 shadow-lg scale-105" : ""
        }`}
      >
        <div className="space-y-1.5">
          {/* Company + Priority dot */}
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full flex-shrink-0 ${priorityDot}`}
              title={`${application.priority} priority`}
            />
            <span className="font-semibold text-sm truncate">
              {application.company}
            </span>
          </div>

          {/* Role title */}
          <p className="text-xs text-muted-foreground truncate">
            {application.jobTitle}
          </p>

          {/* Bottom row: salary + days ago */}
          <div className="flex items-center justify-between gap-2">
            {salary ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {salary}
              </Badge>
            ) : (
              <span />
            )}
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDaysAgo(application.appliedDate)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
