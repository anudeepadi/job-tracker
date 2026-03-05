"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { Application } from "@/lib/types";

interface KanbanBoardProps {
  applications: Application[];
  onStatusChange: (applicationId: string, newStatus: string) => void;
}

const COLUMN_ORDER = [
  "Pending",
  "Applied",
  "Interviewing",
  "Offer",
  "Accepted",
  "Rejected",
  "Withdrawn",
];

function groupByStatus(
  applications: ReadonlyArray<Application>,
): Record<string, Application[]> {
  const grouped: Record<string, Application[]> = {};
  for (const status of COLUMN_ORDER) {
    grouped[status] = [];
  }
  for (const app of applications) {
    const status = app.status;
    if (grouped[status]) {
      grouped[status] = [...grouped[status], app];
    } else {
      // If status doesn't match known columns, place in Applied
      grouped["Applied"] = [...grouped["Applied"], app];
    }
  }
  return grouped;
}

export function KanbanBoard({ applications, onStatusChange }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const grouped = useMemo(() => groupByStatus(applications), [applications]);

  const activeApplication = useMemo(
    () => (activeId ? applications.find((app) => app.id === activeId) ?? null : null),
    [activeId, applications],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicationId = String(active.id);

    // Determine the target column status
    let targetStatus: string | null = null;

    // Check if dropped over a column droppable (id starts with "column-")
    const overId = String(over.id);
    if (overId.startsWith("column-")) {
      targetStatus = overId.replace("column-", "");
    } else {
      // Dropped over another card — find which column that card belongs to
      const targetApp = applications.find((app) => app.id === overId);
      if (targetApp) {
        targetStatus = targetApp.status;
      }
    }

    if (!targetStatus) return;

    // Find the dragged application's current status
    const draggedApp = applications.find((app) => app.id === applicationId);
    if (!draggedApp) return;

    // Only call onStatusChange if the status actually changed
    if (draggedApp.status !== targetStatus) {
      onStatusChange(applicationId, targetStatus);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // No-op: column highlighting is handled by useDroppable's isOver
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {COLUMN_ORDER.map((status) => {
          const columnApps = grouped[status] ?? [];
          return (
            <KanbanColumn
              key={status}
              status={status}
              applications={columnApps}
              count={columnApps.length}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeApplication ? (
          <div className="w-[260px] opacity-90">
            <KanbanCard application={activeApplication} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
