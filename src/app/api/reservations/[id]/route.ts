import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations, notifications, users, zones } from "@/lib/db/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "silver_admin" || role === "gold_admin";
}

function isSilverAdmin(role: string): boolean {
  return role === "silver_admin" || role === "admin";
}

function isGoldAdmin(role: string): boolean {
  return role === "gold_admin" || role === "admin";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
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
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (!isAdmin(session.user.role) && reservation.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json({ error: "Failed to fetch reservation" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes, notes, moveToZoneId, moveReason } = body;

    const currentReservation = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
      with: {
        user: true,
        zone: {
          with: {
            field: true,
          },
        },
      },
    });

    if (!currentReservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const userRole = session.user.role;
    const userIsAdmin = isAdmin(userRole);
    const userIsSilverAdmin = isSilverAdmin(userRole);
    const userIsGoldAdmin = isGoldAdmin(userRole);
    const isOwner = currentReservation.userId === session.user.id;

    if (!userIsAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    // Handle status changes
    if (status) {
      // Silver admin can approve pending -> pending_gold, or deny
      if (status === "pending_gold" && userIsSilverAdmin && currentReservation.status === "pending") {
        updateData.status = "pending_gold";
        updateData.silverApprovedBy = session.user.id;
        updateData.silverApprovedAt = new Date();
        
        // Notify the coach that first approval is done
        await db.insert(notifications).values({
          userId: currentReservation.userId,
          type: "approval",
          title: "First Approval Received",
          message: `Your reservation for ${currentReservation.zone?.name} on ${currentReservation.date} has been approved by the first reviewer. Waiting for final approval.`,
          relatedReservationId: id,
        });
      }
      // Gold admin can approve pending_gold -> approved
      else if (status === "approved" && userIsGoldAdmin && currentReservation.status === "pending_gold") {
        updateData.status = "approved";
        updateData.goldApprovedBy = session.user.id;
        updateData.goldApprovedAt = new Date();
        
        // Notify the coach
        await db.insert(notifications).values({
          userId: currentReservation.userId,
          type: "approval",
          title: "Reservation Approved!",
          message: `Your reservation for ${currentReservation.zone?.name} on ${currentReservation.date} has been fully approved!`,
          relatedReservationId: id,
        });
      }
      // Gold admin can also directly approve pending -> approved (skip silver)
      else if (status === "approved" && userIsGoldAdmin && currentReservation.status === "pending") {
        updateData.status = "approved";
        updateData.goldApprovedBy = session.user.id;
        updateData.goldApprovedAt = new Date();
        
        await db.insert(notifications).values({
          userId: currentReservation.userId,
          type: "approval",
          title: "Reservation Approved!",
          message: `Your reservation for ${currentReservation.zone?.name} on ${currentReservation.date} has been approved!`,
          relatedReservationId: id,
        });
      }
      // Admin denial
      else if (status === "denied" && userIsAdmin) {
        updateData.status = "denied";
        
        await db.insert(notifications).values({
          userId: currentReservation.userId,
          type: "denial",
          title: "Reservation Denied",
          message: `Your reservation for ${currentReservation.zone?.name} on ${currentReservation.date} has been denied. ${adminNotes ? `Reason: ${adminNotes}` : ""}`,
          relatedReservationId: id,
        });
      }
      // Admin cancellation - notify other coaches on same field
      else if (status === "cancelled" && userIsAdmin) {
        updateData.status = "cancelled";
        
        // Notify the reservation owner
        await db.insert(notifications).values({
          userId: currentReservation.userId,
          type: "cancellation",
          title: "Reservation Cancelled by Admin",
          message: `Your reservation for ${currentReservation.zone?.name} on ${currentReservation.date} has been cancelled by an admin. ${adminNotes ? `Reason: ${adminNotes}` : ""}`,
          relatedReservationId: id,
        });

        // Notify other coaches on the same field/date about the cancellation (opportunity for them)
        await notifyOtherCoachesOfCancellation(currentReservation);
      }
      // User cancellation
      else if (status === "cancelled" && isOwner) {
        if (currentReservation.status === "approved" || currentReservation.status === "pending" || currentReservation.status === "pending_gold") {
          updateData.status = "cancelled";
          
          // Notify other coaches on same field/date
          await notifyOtherCoachesOfCancellation(currentReservation);
        } else {
          return NextResponse.json({ error: "Cannot cancel this reservation" }, { status: 403 });
        }
      }
    }

    // Handle move reservation to different zone
    if (moveToZoneId && userIsAdmin) {
      const newZone = await db.query.zones.findFirst({
        where: eq(zones.id, moveToZoneId),
        with: { field: true },
      });

      if (!newZone) {
        return NextResponse.json({ error: "Target zone not found" }, { status: 404 });
      }

      updateData.zoneId = moveToZoneId;
      updateData.movedFromId = currentReservation.zoneId;
      updateData.movedReason = moveReason || "Admin moved reservation";

      // Notify coach about the move
      await db.insert(notifications).values({
        userId: currentReservation.userId,
        type: "moved",
        title: "Reservation Moved",
        message: `Your reservation has been moved from ${currentReservation.zone?.name} (${currentReservation.zone?.field?.name}) to ${newZone.name} (${newZone.field?.name}) on ${currentReservation.date}. ${moveReason ? `Reason: ${moveReason}` : ""}`,
        relatedReservationId: id,
        relatedFieldId: newZone.fieldId,
      });
    }

    if (adminNotes !== undefined && userIsAdmin) {
      updateData.adminNotes = adminNotes;
    }

    if (notes !== undefined && isOwner) {
      updateData.notes = notes;
    }

    const [updatedReservation] = await db
      .update(reservations)
      .set(updateData)
      .where(eq(reservations.id, id))
      .returning();

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
  }
}

// Helper function to notify other coaches when a reservation is cancelled
async function notifyOtherCoachesOfCancellation(reservation: {
  id: string;
  userId: string;
  zoneId: string;
  date: string;
  startTime: string;
  endTime: string;
  zone?: { name: string; fieldId: string; field?: { name: string; id: string } } | null;
}) {
  try {
    // Get all zones on the same field
    if (!reservation.zone?.fieldId) return;

    const fieldZones = await db.query.zones.findMany({
      where: eq(zones.fieldId, reservation.zone.fieldId),
    });
    const zoneIds = fieldZones.map(z => z.id);

    // Find other reservations on same date and overlapping times
    const otherReservations = await db.query.reservations.findMany({
      where: and(
        inArray(reservations.zoneId, zoneIds),
        eq(reservations.date, reservation.date),
        or(
          eq(reservations.status, "approved"),
          eq(reservations.status, "pending_gold")
        )
      ),
    });

    // Get unique user IDs (excluding the cancelling user)
    const userIds = [...new Set(otherReservations.map(r => r.userId))].filter(uid => uid !== reservation.userId);

    // Notify each coach
    for (const userId of userIds) {
      await db.insert(notifications).values({
        userId,
        type: "cancellation",
        title: "Spot Available!",
        message: `A coach cancelled their reservation at ${reservation.zone?.field?.name} (${reservation.zone?.name}) on ${reservation.date} from ${reservation.startTime} to ${reservation.endTime}. This time slot may now be available!`,
        relatedFieldId: reservation.zone?.field?.id,
      });
    }
  } catch (error) {
    console.error("Error notifying coaches of cancellation:", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const userIsAdmin = isAdmin(session.user.role);
    const isOwner = reservation.userId === session.user.id;

    if (!userIsAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userIsAdmin && reservation.status !== "pending") {
      return NextResponse.json({ error: "You can only delete pending reservations" }, { status: 403 });
    }

    await db.delete(reservations).where(eq(reservations.id, id));

    return NextResponse.json({ message: "Reservation deleted successfully" });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
  }
}