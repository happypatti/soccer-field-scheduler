"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  key: string;
  value: string;
  description?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(Array.isArray(data) ? data : []);
      const values: Record<string, string> = {};
      data.forEach((s: Setting) => { values[s.key] = s.value; });
      setEditedValues(values);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (key: string) => {
    setIsSaving(key);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editedValues[key] }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Setting saved!");
    } catch (e) {
      toast.error("Failed to save setting");
    } finally {
      setIsSaving(null);
    }
  };

  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      max_recurring_months: "Maximum Recurring Booking Duration",
      recurring_enabled: "Enable Recurring Bookings",
      max_advance_booking_days: "Maximum Advance Booking Days",
    };
    return labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold">Settings</h1></div>
        <Card><CardContent className="p-12 text-center">Loading settings...</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Settings
        </h1>
        <p className="text-muted-foreground">Configure system-wide settings for the booking platform</p>
      </div>

      <div className="grid gap-6">
        {/* Recurring Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Recurring Booking Settings</CardTitle>
            <CardDescription>Control how recurring bookings work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Max Recurring Months */}
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="max_recurring_months">{getSettingLabel("max_recurring_months")}</Label>
                <p className="text-sm text-muted-foreground">
                  How many months into the future a coach can book recurring sessions
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="max_recurring_months"
                    type="number"
                    min="1"
                    max="12"
                    value={editedValues.max_recurring_months || "3"}
                    onChange={(e) => setEditedValues({ ...editedValues, max_recurring_months: e.target.value })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">months</span>
                </div>
              </div>
              <Button 
                onClick={() => saveSetting("max_recurring_months")}
                disabled={isSaving === "max_recurring_months"}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving === "max_recurring_months" ? "Saving..." : "Save"}
              </Button>
            </div>

            {/* Recurring Enabled */}
            <div className="flex items-end gap-4 pt-4 border-t">
              <div className="flex-1 space-y-2">
                <Label htmlFor="recurring_enabled">{getSettingLabel("recurring_enabled")}</Label>
                <p className="text-sm text-muted-foreground">
                  Allow coaches to create recurring bookings (weekly, bi-weekly, monthly)
                </p>
                <select
                  id="recurring_enabled"
                  value={editedValues.recurring_enabled || "true"}
                  onChange={(e) => setEditedValues({ ...editedValues, recurring_enabled: e.target.value })}
                  className="w-40 border rounded-md p-2"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <Button 
                onClick={() => saveSetting("recurring_enabled")}
                disabled={isSaving === "recurring_enabled"}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving === "recurring_enabled" ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Booking Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Limits</CardTitle>
            <CardDescription>Control booking restrictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Max Advance Booking Days */}
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="max_advance_booking_days">{getSettingLabel("max_advance_booking_days")}</Label>
                <p className="text-sm text-muted-foreground">
                  How many days in advance a coach can make a booking
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="max_advance_booking_days"
                    type="number"
                    min="7"
                    max="365"
                    value={editedValues.max_advance_booking_days || "90"}
                    onChange={(e) => setEditedValues({ ...editedValues, max_advance_booking_days: e.target.value })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
              <Button 
                onClick={() => saveSetting("max_advance_booking_days")}
                disabled={isSaving === "max_advance_booking_days"}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving === "max_advance_booking_days" ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">Current Settings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-amber-900">
              <li>• Coaches can make recurring bookings for up to <strong>{editedValues.max_recurring_months || "3"} months</strong></li>
              <li>• Recurring bookings are <strong>{editedValues.recurring_enabled === "false" ? "disabled" : "enabled"}</strong></li>
              <li>• Coaches can book up to <strong>{editedValues.max_advance_booking_days || "90"} days</strong> in advance</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}