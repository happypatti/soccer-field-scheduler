import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fieldIssues, notifications, users, reservations } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, desc, and, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId");
    const status = searchParams.get("status");

    // Only admins can see all issues, coaches see their reported issues
    const isAdmin = session.user.role === "silver_admin" || session.user.role === "gold_admin" || session.user.role === "admin";

    let issues;
    if (isAdmin) {
      const whereConditions = [];
      if (fieldId) whereConditions.push(eq(fieldIssues.fieldId, fieldId));
      if (status) whereConditions.push(eq(fieldIssues.status, status));

      issues = await db.query.fieldIssues.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          field: true,
          reporter: true,
        },
        orderBy: [desc(fieldIssues.createdAt)],
      });
    } else {
      issues = await db.query.fieldIssues.findMany({
        where: eq(fieldIssues.reportedBy, session.user.id),
        with: {
          field: true,
        },
        orderBy: [desc(fieldIssues.createdAt)],
      });
    }

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching field issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch field issues" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fieldId, issueType, description } = body;

    if (!fieldId || !description) {
      return NextResponse.json(
        { error: "Field ID and description are required" },
        { status: 400 }
      );
    }

    // Get field info
    const field = await db.query.fields.findFirst({
      where: eq(fieldIssues.fieldId, fieldId),
    });

    const [newIssue] = await db
      .insert(fieldIssues)
      .values({
        fieldId,
        reportedBy: session.user.id,
        issueType: issueType || "other",
        description,
      })
      .returning();

    // Notify all admins about the new issue
    const admins = await db.query.users.findMany({
      where: inArray(users.role, ["silver_admin", "gold_admin", "admin"]),
    });

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: "field_issue",
        title: `New Field Issue: ${issueType || "Other"}`,
        message: `${session.user.name} reported an issue at ${field?.name || "a field"}: ${description.substring(0, 100)}...`,
        relatedFieldId: fieldId,
      });
    }

    return NextResponse.json(newIssue);
  } catch (error) {
    console.error("Error creating field issue:", error);
    return NextResponse.json(
      { error: "Failed to create field issue" },
      { status: 500 }
    );
  }
}