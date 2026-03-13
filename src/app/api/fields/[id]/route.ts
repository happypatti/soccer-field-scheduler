import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fields } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const field = await db.query.fields.findFirst({
      where: eq(fields.id, id),
      with: {
        city: true,
        zones: true,
      },
    });

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json(field);
  } catch (error) {
    console.error("Error fetching field:", error);
    return NextResponse.json(
      { error: "Failed to fetch field" },
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
    const { name, address, description, imageUrl, allowedTiers, isActive } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (allowedTiers !== undefined && ["gold", "gold_silver", "silver", "silver_bronze", "bronze", "all"].includes(allowedTiers)) {
      updateData.allowedTiers = allowedTiers;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedField] = await db
      .update(fields)
      .set(updateData)
      .where(eq(fields.id, id))
      .returning();

    if (!updatedField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json(updatedField);
  } catch (error) {
    console.error("Error updating field:", error);
    return NextResponse.json(
      { error: "Failed to update field" },
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
    const [deletedField] = await db
      .delete(fields)
      .where(eq(fields.id, id))
      .returning();

    if (!deletedField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Field deleted successfully" });
  } catch (error) {
    console.error("Error deleting field:", error);
    return NextResponse.json(
      { error: "Failed to delete field" },
      { status: 500 }
    );
  }
}