import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Only admin or the reservation owner can view
    if (
      session.user.role !== "admin" &&
      reservation.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservation" },
      { status: 500 }
    );
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
    const { status, adminNotes, notes } = body;

    // Get the current reservation
    const currentReservation = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
    });

    if (!currentReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Only admin can change status, users can only update notes and cancel their own
    const isAdmin = session.user.role === "admin";
    const isOwner = currentReservation.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only cancel their pending reservations
    if (!isAdmin && status && status !== "cancelled") {
      return NextResponse.json(
        { error: "You can only cancel your reservations" },
        { status: 403 }
      );
    }

    if (!isAdmin && status === "cancelled" && currentReservation.status !== "pending") {
      return NextResponse.json(
        { error: "You can only cancel pending reservations" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status && (isAdmin || status === "cancelled")) {
      updateData.status = status;
    }

    if (adminNotes !== undefined && isAdmin) {
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
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 }
    );
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

    // Get the reservation first
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Only admin or owner can delete, and owner can only delete pending
    const isAdmin = session.user.role === "admin";
    const isOwner = reservation.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin && reservation.status !== "pending") {
      return NextResponse.json(
        { error: "You can only delete pending reservations" },
        { status: 403 }
      );
    }

    await db.delete(reservations).where(eq(reservations.id, id));

    return NextResponse.json({ message: "Reservation deleted successfully" });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { error: "Failed to delete reservation" },
      { status: 500 }
    );
  }
}