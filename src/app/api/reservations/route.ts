import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations, users, zones, fields } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, and, or, inArray } from "drizzle-orm";

// Check if user tier can access field based on allowedTiers
function canUserAccessField(userTier: string, allowedTiers: string): boolean {
  if (allowedTiers === "all") return true;
  if (allowedTiers === "gold") return userTier === "gold";
  if (allowedTiers === "gold_silver") return userTier === "gold" || userTier === "silver";
  if (allowedTiers === "silver") return userTier === "silver";
  if (allowedTiers === "silver_bronze") return userTier === "silver" || userTier === "bronze";
  if (allowedTiers === "bronze") return userTier === "bronze";
  return true;
}

function getAllowedTiersDescription(allowedTiers: string): string {
  const descriptions: Record<string, string> = {
    gold: "Gold coaches only",
    gold_silver: "Gold & Silver coaches only",
    silver: "Silver coaches only",
    silver_bronze: "Silver & Bronze coaches only",
    bronze: "Bronze coaches only",
    all: "All coaches",
  };
  return descriptions[allowedTiers] || "All coaches";
}

function isAdmin(role: string): boolean {
  return role === "admin" || role === "silver_admin" || role === "gold_admin";
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const zoneId = searchParams.get("zoneId");
    const fieldId = searchParams.get("fieldId");
    const date = searchParams.get("date");
    const includeCoachInfo = searchParams.get("includeCoachInfo") === "true";

    // If checking availability for a specific field and date - include coach info for logged in users
    if (fieldId && date) {
      // Get all zones for this field
      const fieldZones = await db.query.zones.findMany({
        where: eq(zones.fieldId, fieldId),
      });
      const zoneIds = fieldZones.map(z => z.id);

      const fieldReservations = await db.query.reservations.findMany({
        where: and(
          inArray(reservations.zoneId, zoneIds),
          eq(reservations.date, date),
          or(
            eq(reservations.status, "approved"),
            eq(reservations.status, "pending_gold"),
            eq(reservations.status, "pending")
          )
        ),
        with: {
          user: true,
          zone: true,
        },
      });

      // Always include coach info for logged in users when viewing field reservations
      return NextResponse.json(fieldReservations.map(r => ({
        id: r.id,
        zoneId: r.zoneId,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status,
        user: {
          id: r.user?.id,
          name: r.user?.name || "Unknown",
          teamName: r.user?.teamName || null,
        },
        zone: {
          id: r.zone?.id,
          name: r.zone?.name || "Unknown",
        },
      })));
    }

    // Single zone availability check
    if (zoneId && date) {
      const zoneReservations = await db.query.reservations.findMany({
        where: and(
          eq(reservations.zoneId, zoneId),
          eq(reservations.date, date)
        ),
        with: {
          user: true,
        },
      });

      if (includeCoachInfo && session) {
        return NextResponse.json(zoneReservations.map(r => ({
          id: r.id,
          startTime: r.startTime,
          endTime: r.endTime,
          status: r.status,
          date: r.date,
          coachName: r.user?.name,
          teamName: r.user?.teamName,
        })));
      }

      return NextResponse.json(zoneReservations.map(r => ({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status,
        date: r.date,
      })));
    }

    // For other queries, require authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userIsAdmin = isAdmin(userRole);

    let allReservations;

    if (userIsAdmin) {
      // Admins see all reservations
      // Silver admins see pending reservations
      // Gold admins see pending_gold and pending reservations
      allReservations = await db.query.reservations.findMany({
        with: {
          user: true,
          zone: {
            with: {
              field: {
                with: {
                  city: true,
                },
              },
            },
          },
        },
        orderBy: (reservations, { desc }) => [desc(reservations.createdAt)],
      });
    } else {
      allReservations = await db.query.reservations.findMany({
        where: eq(reservations.userId, session.user.id),
        with: {
          zone: {
            with: {
              field: {
                with: {
                  city: true,
                },
              },
            },
          },
        },
        orderBy: (reservations, { desc }) => [desc(reservations.createdAt)],
      });
    }

    // Filter by status if provided
    if (status) {
      allReservations = allReservations.filter((r) => r.status === status);
    }

    return NextResponse.json(allReservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

// Helper to generate recurring dates
function generateRecurringDates(startDate: string, pattern: string, maxMonths: number): string[] {
  const dates: string[] = [startDate];
  const start = new Date(startDate + "T00:00:00");
  const maxDate = new Date(start);
  maxDate.setMonth(maxDate.getMonth() + maxMonths);
  
  let current = new Date(start);
  
  while (true) {
    if (pattern === "weekly") {
      current.setDate(current.getDate() + 7);
    } else if (pattern === "biweekly") {
      current.setDate(current.getDate() + 14);
    } else if (pattern === "monthly") {
      current.setMonth(current.getMonth() + 1);
    } else {
      break;
    }
    
    if (current > maxDate) break;
    
    // Skip weekends
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    dates.push(current.toISOString().split("T")[0]);
  }
  
  return dates;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { zoneId, date, startTime, endTime, notes, recurringPattern } = body;

    if (!zoneId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Zone ID, date, start time, and end time are required" },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const zone = await db.query.zones.findFirst({
      where: eq(zones.id, zoneId),
      with: {
        field: true,
      },
    });

    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    // Check tier-based access
    const allowedTiers = zone.field.allowedTiers || "all";
    const userTier = user.tier || "bronze";

    if (!canUserAccessField(userTier, allowedTiers)) {
      return NextResponse.json(
        { error: `This field is restricted to: ${getAllowedTiersDescription(allowedTiers)}. Your tier: ${userTier.charAt(0).toUpperCase() + userTier.slice(1)}` },
        { status: 403 }
      );
    }

    // Handle recurring bookings
    const isRecurring = !!recurringPattern && recurringPattern !== "none";
    let datesToBook = [date];
    let recurringGroupId: string | null = null;
    
    if (isRecurring) {
      // Get max months setting (default 3)
      let maxMonths = 3;
      try {
        const settingRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/settings?key=max_recurring_months`);
        const setting = await settingRes.json();
        if (setting.value) {
          maxMonths = parseInt(setting.value, 10) || 3;
        }
      } catch (e) {
        console.log("Using default max months:", maxMonths);
      }
      
      datesToBook = generateRecurringDates(date, recurringPattern, maxMonths);
      recurringGroupId = crypto.randomUUID();
    }

    // Check for conflicts on all dates
    const conflicts: string[] = [];
    for (const bookDate of datesToBook) {
      const existingReservations = await db.query.reservations.findMany({
        where: and(
          eq(reservations.zoneId, zoneId),
          eq(reservations.date, bookDate),
          or(
            eq(reservations.status, "approved"),
            eq(reservations.status, "pending_gold"),
            eq(reservations.status, "pending")
          )
        ),
      });

      const hasConflict = existingReservations.some((existing) => {
        const existingStart = existing.startTime;
        const existingEnd = existing.endTime;
        return (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        );
      });

      if (hasConflict) {
        conflicts.push(bookDate);
      }
    }

    // Filter out conflicting dates
    const availableDates = datesToBook.filter(d => !conflicts.includes(d));
    
    if (availableDates.length === 0) {
      return NextResponse.json(
        { error: isRecurring ? "All dates have conflicts" : "This time slot is already booked" },
        { status: 409 }
      );
    }

    // Create reservations for all available dates
    const createdReservations = [];
    for (const bookDate of availableDates) {
      const [newReservation] = await db
        .insert(reservations)
        .values({
          userId: session.user.id,
          zoneId,
          date: bookDate,
          startTime,
          endTime,
          notes,
          status: "pending",
          isRecurring,
          recurringPattern: isRecurring ? recurringPattern : null,
          recurringGroupId,
        })
        .returning();
      createdReservations.push(newReservation);
    }

    return NextResponse.json({
      reservations: createdReservations,
      totalRequested: datesToBook.length,
      totalCreated: availableDates.length,
      skippedDates: conflicts,
      message: conflicts.length > 0 
        ? `Created ${availableDates.length} reservations. ${conflicts.length} dates were skipped due to conflicts.`
        : `Created ${availableDates.length} reservation(s) successfully.`
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
