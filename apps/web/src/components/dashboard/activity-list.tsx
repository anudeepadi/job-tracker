"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityDialog } from "./activity-dialog";
import { Activity } from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Clock,
  Mail,
  FileText,
  MessageSquare,
} from "lucide-react";
import { AddToCalendar } from "@/components/calendar/add-to-calendar";

interface ActivityListProps {
  applicationId?: string;
  limit?: number;
  showCreateButton?: boolean;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  "Status Change": <Clock className="h-4 w-4" />,
  Interview: <Calendar className="h-4 w-4" />,
  Email: <Mail className="h-4 w-4" />,
  Note: <FileText className="h-4 w-4" />,
  Resume: <FileText className="h-4 w-4" />,
};

export function ActivityList({
  applicationId,
  limit = 10,
  showCreateButton = false,
}: ActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const fetchActivities = async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/applications/${applicationId}/activities?limit=${limit}`,
      );
      if (!response.ok) throw new Error("Failed to fetch activities");

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [applicationId, limit]);

  const handleCreateActivity = () => {
    setEditingActivity(null);
    setIsDialogOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsDialogOpen(true);
  };

  const handleActivitySaved = () => {
    fetchActivities();
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!applicationId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest activity history</CardDescription>
          </div>
          {showCreateButton && (
            <Button onClick={handleCreateActivity} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No activities yet.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">
                  {ACTIVITY_ICONS[activity.type] || (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                  <p className="text-sm">{activity.description}</p>
                </div>
                <div className="flex gap-1 items-center">
                  {(activity.type === "Interview" ||
                    activity.type === "Phone Screen") && (
                    <AddToCalendar
                      title={`${activity.type}`}
                      description={activity.description}
                      startDate={new Date(activity.date)}
                      compact
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditActivity(activity)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onActivitySaved={handleActivitySaved}
        applicationId={applicationId}
        activity={editingActivity}
      />
    </Card>
  );
}
