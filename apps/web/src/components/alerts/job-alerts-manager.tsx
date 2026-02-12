"use client";

/**
 * Job Alerts Manager Component
 *
 * Allows users to create, view, edit, and delete job search alerts
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, BellOff, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SavedAlert {
  id: string;
  name: string;
  searchCriteria: {
    role: string;
    location?: string;
  };
  frequency: "daily" | "weekly" | "realtime";
  isActive: boolean;
  lastRunAt: string | null;
  lastJobCount: number;
  createdAt: string;
}

export function JobAlertsManager() {
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SavedAlert | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    location: "",
    frequency: "daily" as "daily" | "weekly" | "realtime",
  });

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch("/api/alerts");
      if (!response.ok) throw new Error("Failed to fetch alerts");
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (error) {
      console.error("Failed to load alerts:", error);
      toast.error("Failed to load job alerts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = editingAlert ? `/api/alerts/${editingAlert.id}` : "/api/alerts";
      const method = editingAlert ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          searchCriteria: {
            role: formData.role,
            location: formData.location || undefined,
          },
          frequency: formData.frequency,
        }),
      });

      if (!response.ok) throw new Error("Failed to save alert");

      toast.success(editingAlert ? "Alert updated!" : "Alert created!");
      setIsDialogOpen(false);
      resetForm();
      loadAlerts();
    } catch (error) {
      console.error("Failed to save alert:", error);
      toast.error("Failed to save alert");
    }
  };

  const handleToggleActive = async (alert: SavedAlert) => {
    try {
      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !alert.isActive }),
      });

      if (!response.ok) throw new Error("Failed to toggle alert");

      toast.success(alert.isActive ? "Alert disabled" : "Alert enabled");
      loadAlerts();
    } catch (error) {
      console.error("Failed to toggle alert:", error);
      toast.error("Failed to update alert");
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete alert");

      toast.success("Alert deleted");
      loadAlerts();
    } catch (error) {
      console.error("Failed to delete alert:", error);
      toast.error("Failed to delete alert");
    }
  };

  const handleEdit = (alert: SavedAlert) => {
    setEditingAlert(alert);
    setFormData({
      name: alert.name,
      role: alert.searchCriteria.role,
      location: alert.searchCriteria.location || "",
      frequency: alert.frequency,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAlert(null);
    setFormData({
      name: "",
      role: "",
      location: "",
      frequency: "daily",
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Alerts</h2>
          <p className="text-sm text-muted-foreground">
            Get notified when new jobs match your criteria
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAlert ? "Edit Job Alert" : "Create Job Alert"}
              </DialogTitle>
              <DialogDescription>
                Set up automated job searches and get email notifications
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Alert Name*</Label>
                <Input
                  id="name"
                  placeholder="e.g., Senior React Developer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Job Role*</Label>
                <Input
                  id="role"
                  placeholder="e.g., Software Engineer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdate}>
                {editingAlert ? "Update" : "Create"} Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No job alerts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first alert to get notified about new job opportunities
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{alert.name}</CardTitle>
                      <Badge variant={alert.isActive ? "default" : "secondary"}>
                        {alert.isActive ? "Active" : "Paused"}
                      </Badge>
                      <Badge variant="outline">{alert.frequency}</Badge>
                    </div>
                    <CardDescription>
                      {alert.searchCriteria.role}
                      {alert.searchCriteria.location && ` • ${alert.searchCriteria.location}`}
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(alert)}
                    >
                      {alert.isActive ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(alert)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {alert.lastRunAt ? (
                    <>
                      <span>
                        Last run: {new Date(alert.lastRunAt).toLocaleDateString()}
                      </span>
                      <span>
                        {alert.lastJobCount} {alert.lastJobCount === 1 ? "job" : "jobs"} found
                      </span>
                    </>
                  ) : (
                    <span>Never run yet</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
