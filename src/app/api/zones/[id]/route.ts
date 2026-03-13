import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const zone = await db.query.zones.findFirst({
      where: eq(zones.id, id),
      with: {
        field: {
          with: {
            city: true,
          },
        },
      },
    });

    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    return NextResponse.json(zone);
  } catch (error) {
    console.error("Error fetching zone:", error);
    return NextResponse.json(
      { error: "Failed to fetch zone" },
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

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, capacity, pricePerHour, posLeft, posTop, posWidth, posHeight, isActive } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (pricePerHour !== undefined) updateData.pricePerHour = pricePerHour;
    if (posLeft !== undefined) updateData.posLeft = posLeft;
    if (posTop !== undefined) updateData.posTop = posTop;
    if (posWidth !== undefined) updateData.posWidth = posWidth;
    if (posHeight !== undefined) updateData.posHeight = posHeight;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(zones)
      .set(updateData)
      .where(eq(zones.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating zone:", error);
    return NextResponse.json(
      { error: "Failed to update zone" },
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

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.delete(zones).where(eq(zones.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting zone:", error);
    return NextResponse.json(
      { error: "Failed to delete zone" },
      { status: 500 }
    );
  }
}