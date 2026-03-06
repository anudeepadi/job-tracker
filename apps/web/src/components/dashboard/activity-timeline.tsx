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

interface ActivityTimelineProps {
  applicationId: string;
  application?: {
    company: string;
    jobTitle: string;
  };
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  "Status Change": <Clock className="h-4 w-4" />,
  Interview: <Calendar className="h-4 w-4" />,
  Email: <Mail className="h-4 w-4" />,
  Note: <FileText className="h-4 w-4" />,
  Resume: <FileText className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  "Status Change": "bg-blue-500",
  Interview: "bg-purple-500",
  Email: "bg-green-500",
  Note: "bg-gray-500",
  Resume: "bg-orange-500",
};

export function ActivityTimeline({
  applicationId,
  application,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("type", filter);
      }

      const response = await fetch(
        `/api/applications/${applicationId}/activities?${params.toString()}`,
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
  }, [applicationId, filter]);

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

  const handleDeleteActivity = async (activity: Activity) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const response = await fetch(`/api/activities/${activity.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete activity");

      toast.success("Activity deleted successfully");
      fetchActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
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

  const activityTypes = [
    "all",
    "Status Change",
    "Interview",
    "Email",
    "Note",
    "Resume",
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              {application
                ? `Activity history for ${application.company} - ${application.jobTitle}`
                : "Track all activities for this application"}
            </CardDescription>
          </div>
          <Button onClick={handleCreateActivity} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {activityTypes.map((type) => (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(type)}
            >
              {type === "all" ? "All" : type}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activities found. Create one to get started.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {activities.map((activity, index) => (
                <div key={activity.id} className="relative flex gap-4">
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${ACTIVITY_COLORS[activity.type] || "bg-gray-500"} text-white`}
                  >
                    {ACTIVITY_ICONS[activity.type] || (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{activity.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(activity.date)}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center">
                        {(activity.type === "Interview" ||
                          activity.type === "Phone Screen") && (
                          <AddToCalendar
                            title={
                              application
                                ? `${activity.type} - ${application.company} (${application.jobTitle})`
                                : `${activity.type}`
                            }
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(activity)}
                          className="text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
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
