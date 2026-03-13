import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const zoneId = searchParams.get("zoneId");
    const date = searchParams.get("date");

    // If checking availability for a specific zone and date (public access allowed)
    if (zoneId && date) {
      const zoneReservations = await db.query.reservations.findMany({
        where: and(
          eq(reservations.zoneId, zoneId),
          eq(reservations.date, date)
        ),
      });
      
      // Only return basic info for public availability check
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

    // Admin can see all reservations, users only see their own
    const isAdmin = session.user.role === "admin";

    let allReservations;

    if (isAdmin) {
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
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { zoneId, date, startTime, endTime, notes } = body;

    if (!zoneId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Zone ID, date, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Check for conflicting reservations (approved ones on same zone, date, and overlapping times)
    const existingReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.zoneId, zoneId),
        eq(reservations.date, date),
        eq(reservations.status, "approved")
      ),
    });

    // Check for time overlap
    const hasConflict = existingReservations.some((existing) => {
      const existingStart = existing.startTime;
      const existingEnd = existing.endTime;
      // Check if times overlap
      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    const [newReservation] = await db
      .insert(reservations)
      .values({
        userId: session.user.id,
        zoneId,
        date,
        startTime,
        endTime,
        notes,
        status: "pending",
      })
      .returning();

    return NextResponse.json(newReservation);
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}