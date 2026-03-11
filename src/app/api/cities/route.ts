import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const allCities = await db.query.cities.findMany({
      orderBy: (cities, { asc }) => [asc(cities.name)],
      with: {
        fields: true,
      },
    });

    return NextResponse.json(allCities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
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
    const { name, state, country } = body;

    if (!name) {
      return NextResponse.json(
        { error: "City name is required" },
        { status: 400 }
      );
    }

    const [newCity] = await db
      .insert(cities)
      .values({
        name,
        state,
        country: country || "USA",
      })
      .returning();

    return NextResponse.json(newCity);
  } catch (error) {
    console.error("Error creating city:", error);
    return NextResponse.json(
      { error: "Failed to create city" },
      { status: 500 }
    );
  }
}