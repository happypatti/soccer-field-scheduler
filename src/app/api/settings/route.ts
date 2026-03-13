import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Default settings
const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  max_recurring_months: { value: "3", description: "Maximum months allowed for recurring bookings" },
  recurring_enabled: { value: "true", description: "Enable/disable recurring bookings feature" },
  max_advance_booking_days: { value: "90", description: "Maximum days in advance a booking can be made" },
};

function isAdmin(role: string): boolean {
  return role === "admin" || role === "silver_admin" || role === "gold_admin";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      // Get single setting
      const setting = await db.query.siteSettings.findFirst({
        where: eq(siteSettings.key, key),
      });
      
      if (setting) {
        return NextResponse.json(setting);
      }
      
      // Return default if not found
      if (DEFAULT_SETTINGS[key]) {
        return NextResponse.json({
          key,
          value: DEFAULT_SETTINGS[key].value,
          description: DEFAULT_SETTINGS[key].description,
        });
      }
      
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    // Get all settings
    const allSettings = await db.query.siteSettings.findMany();
    
    // Merge with defaults for any missing settings
    const settingsMap = new Map(allSettings.map(s => [s.key, s]));
    const result = Object.entries(DEFAULT_SETTINGS).map(([key, defaults]) => {
      const existing = settingsMap.get(key);
      if (existing) {
        return existing;
      }
      return { key, value: defaults.value, description: defaults.description };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    // Check if setting exists
    const existing = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    });

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return NextResponse.json(updated);
    } else {
      // Insert new
      const description = DEFAULT_SETTINGS[key]?.description || "";
      const [inserted] = await db
        .insert(siteSettings)
        .values({ key, value, description })
        .returning();
      return NextResponse.json(inserted);
    }
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}