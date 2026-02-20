"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";

export function SettingsClient() {
  const [loading, setLoading] = useState(false);
  const [optImportLoading, setOptImportLoading] = useState(false);
  const [optMarkdown, setOptMarkdown] = useState("");
  const [resumeInventoryLoading, setResumeInventoryLoading] = useState(false);
  const [resumeInventoryJson, setResumeInventoryJson] = useState("");
  const [settings, setSettings] = useState({
    // General settings
    defaultStatus: "Saved",
    defaultPriority: "Medium",
    autoImportStatus: "Saved",
    autoImportPriority: "Medium",

    // Notification settings
    emailNotifications: false,
    reminderNotifications: true,
    statusChangeNotifications: true,

    // Appearance settings
    theme: "system",
    fontSize: "medium",
    compactMode: false,

    // Data settings
    autoBackup: false,
    backupFrequency: "weekly",
    dataRetentionDays: 365,
  });

  useEffect(() => {
    // Load all preferences from the API
    const loadPreferences = async () => {
      try {
        const res = await fetch("/api/user/preferences");
        if (!res.ok) return;
        const data = await res.json();
        const prefs = data?.preferences || {};

        // Hydrate resume inventory editor if present
        if (typeof prefs.resume_inventory_v1 === "string") {
          try {
            const parsed = JSON.parse(prefs.resume_inventory_v1);
            setResumeInventoryJson(JSON.stringify(parsed, null, 2));
          } catch {
            // If it's not JSON, still show raw for debugging
            setResumeInventoryJson(prefs.resume_inventory_v1);
          }
        }

        // Load general settings if they exist
        if (prefs.settings) {
          const loadedSettings =
            typeof prefs.settings === "string"
              ? JSON.parse(prefs.settings)
              : prefs.settings;

          setSettings((prev) => ({
            ...prev,
            ...loadedSettings,
          }));
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save settings to user preferences
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            settings: settings,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      if (error instanceof Error && error.message.includes("401")) {
        toast.error("Please log in to save settings");
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResumeInventory = async () => {
    setResumeInventoryLoading(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(resumeInventoryJson);
      } catch {
        throw new Error("Resume inventory must be valid JSON");
      }

      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            resume_inventory_v1: parsed,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || "Failed to save resume inventory (are you logged in?)",
        );
      }

      toast.success("Resume inventory saved");
    } catch (error) {
      console.error("Error saving resume inventory:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save resume inventory",
      );
    } finally {
      setResumeInventoryLoading(false);
    }
  };

  const handleImportOptResults = async () => {
    setOptImportLoading(true);
    try {
      const response = await fetch("/api/import/opt-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: optMarkdown }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to import OPT results");
      }

      toast.success(
        `Imported ${data.created} job(s) (skipped ${data.skipped})`,
      );
    } catch (error) {
      console.error("Error importing OPT results:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import OPT results",
      );
    } finally {
      setOptImportLoading(false);
    }
  };

  const handleOptFileUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setOptMarkdown(text);
      toast.success("Loaded OPT markdown from file");
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to read file");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your preferences and data
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="inline-flex w-fit bg-muted/60 backdrop-blur border border-border/40 rounded-full px-1 py-1 h-auto">
            <TabsTrigger
              value="general"
              className="rounded-full px-4 py-1.5 text-xs font-medium"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-full px-4 py-1.5 text-xs font-medium"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-full px-4 py-1.5 text-xs font-medium"
            >
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="rounded-full px-4 py-1.5 text-xs font-medium"
            >
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Default preferences for new applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Status</Label>
                  <Select
                    value={settings.defaultStatus}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Saved">Saved</SelectItem>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                      <SelectItem value="Technical Interview">
                        Technical Interview
                      </SelectItem>
                      <SelectItem value="Final Interview">
                        Final Interview
                      </SelectItem>
                      <SelectItem value="Offer">Offer</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Priority</Label>
                  <Select
                    value={settings.defaultPriority}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultPriority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auto-Import Default Status</Label>
                  <Select
                    value={settings.autoImportStatus}
                    onValueChange={(value) =>
                      setSettings({ ...settings, autoImportStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Saved">Saved</SelectItem>
                      <SelectItem value="Applied">Applied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auto-Import Default Priority</Label>
                  <Select
                    value={settings.autoImportPriority}
                    onValueChange={(value) =>
                      setSettings({ ...settings, autoImportPriority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reminder Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming reminders
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reminderNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        reminderNotifications: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Status Change Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when application status changes
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.statusChangeNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        statusChangeNotifications: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) =>
                      setSettings({ ...settings, theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select
                    value={settings.fontSize}
                    onValueChange={(value) =>
                      setSettings({ ...settings, fontSize: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use a more compact layout
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        compactMode: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Backup and data retention settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup your data
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoBackup}
                    onChange={(e) =>
                      setSettings({ ...settings, autoBackup: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value) =>
                      setSettings({ ...settings, backupFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Retention (days)</Label>
                  <Input
                    type="number"
                    value={settings.dataRetentionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dataRetentionDays: parseInt(e.target.value) || 365,
                      })
                    }
                    min={30}
                    max={3650}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Inventory (Curated)</CardTitle>
                <CardDescription>
                  Paste your curated projects/achievements/experience bullet
                  bank as JSON. This is what powers job-specific resume
                  tailoring.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resumeInventory">Inventory JSON</Label>
                  <Textarea
                    id="resumeInventory"
                    value={resumeInventoryJson}
                    onChange={(e) => setResumeInventoryJson(e.target.value)}
                    placeholder={`{\n  \"profile\": {\n    \"name\": \"Your Name\",\n    \"titleByTrack\": { \"SWE\": \"Software Engineer\", \"DS\": \"Data Scientist\" },\n    \"location\": \"Austin, TX\",\n    \"email\": \"you@email.com\",\n    \"phone\": \"(xxx) xxx-xxxx\",\n    \"links\": [{\"label\":\"GitHub\",\"url\":\"https://github.com/you\"}]\n  },\n  \"skills\": [{\"category\":\"Languages\",\"items\":[\"Python\",\"TypeScript\",\"SQL\"]}],\n  \"experience\": [{\"company\":\"Company\",\"title\":\"Role\",\"start\":\"2024\",\"end\":\"Present\",\"bullets\":[{\"text\":\"Did X\",\"tags\":[\"python\",\"sql\"]}]}],\n  \"projects\": [{\"name\":\"Project\",\"link\":{\"label\":\"GitHub\",\"url\":\"https://...\"},\"bullets\":[{\"text\":\"Built Y\"}]}],\n  \"achievements\": [\"Award ...\"]\n}`}
                    className="min-h-[260px] font-mono text-xs"
                    disabled={resumeInventoryLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Saving requires login (stored in your `UserPreference` as
                    `resume_inventory_v1`).
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveResumeInventory}
                    disabled={
                      resumeInventoryLoading || !resumeInventoryJson.trim()
                    }
                  >
                    {resumeInventoryLoading
                      ? "Saving..."
                      : "Save Resume Inventory"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import: OPT Job Search Results</CardTitle>
                <CardDescription>
                  Upload or paste `OPT_Job_Search_Results.md` to create
                  Applications (status: Saved).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="optFile">Upload Markdown File</Label>
                  <Input
                    id="optFile"
                    type="file"
                    accept=".md,text/markdown,text/plain"
                    onChange={(e) =>
                      handleOptFileUpload(e.target.files?.[0] ?? null)
                    }
                    disabled={optImportLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="optMarkdown">Or Paste Markdown</Label>
                  <Textarea
                    id="optMarkdown"
                    value={optMarkdown}
                    onChange={(e) => setOptMarkdown(e.target.value)}
                    placeholder="Paste the contents of OPT_Job_Search_Results.md here..."
                    className="min-h-[220px]"
                    disabled={optImportLoading}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleImportOptResults}
                    disabled={optImportLoading || !optMarkdown.trim()}
                  >
                    {optImportLoading ? "Importing..." : "Import All Jobs"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
