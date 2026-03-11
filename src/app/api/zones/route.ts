import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId");

    if (fieldId) {
      const fieldZones = await db.query.zones.findMany({
        where: eq(zones.fieldId, fieldId),
        with: {
          field: {
            with: {
              city: true,
            },
          },
        },
        orderBy: (zones, { asc }) => [asc(zones.name)],
      });
      return NextResponse.json(fieldZones);
    }

    const allZones = await db.query.zones.findMany({
      with: {
        field: {
          with: {
            city: true,
          },
        },
      },
      orderBy: (zones, { asc }) => [asc(zones.name)],
    });

    return NextResponse.json(allZones);
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fieldId, name, description, capacity, pricePerHour } = body;

    if (!fieldId || !name) {
      return NextResponse.json(
        { error: "Field ID and zone name are required" },
        { status: 400 }
      );
    }

    const [newZone] = await db
      .insert(zones)
      .values({
        fieldId,
        name,
        description,
        capacity,
        pricePerHour,
      })
      .returning();

    return NextResponse.json(newZone);
  } catch (error) {
    console.error("Error creating zone:", error);
    return NextResponse.json(
      { error: "Failed to create zone" },
      { status: 500 }
    );
  }
}