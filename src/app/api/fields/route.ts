import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fields } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get("cityId");

    let query = db.query.fields.findMany({
      with: {
        city: true,
        zones: true,
      },
      orderBy: (fields, { asc }) => [asc(fields.name)],
    });

    if (cityId) {
      query = db.query.fields.findMany({
        where: eq(fields.cityId, cityId),
        with: {
          city: true,
          zones: true,
        },
        orderBy: (fields, { asc }) => [asc(fields.name)],
      });
    }

    const allFields = await query;
    return NextResponse.json(allFields);
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch fields" },
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
    const { cityId, name, address, description, imageUrl } = body;

    if (!cityId || !name) {
      return NextResponse.json(
        { error: "City ID and field name are required" },
        { status: 400 }
      );
    }

    const [newField] = await db
      .insert(fields)
      .values({
        cityId,
        name,
        address,
        description,
        imageUrl,
      })
      .returning();

    return NextResponse.json(newField);
  } catch (error) {
    console.error("Error creating field:", error);
    return NextResponse.json(
      { error: "Failed to create field" },
      { status: 500 }
    );
  }
}