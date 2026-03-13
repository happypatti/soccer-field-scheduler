import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fieldIssues } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["admin", "silver_admin", "gold_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    const [updated] = await db
      .update(fieldIssues)
      .set({ 
        status: status || undefined,
        adminNotes: adminNotes || undefined,
        resolvedAt: status === "resolved" ? new Date() : undefined,
        resolvedBy: status === "resolved" ? session.user.id : undefined,
        updatedAt: new Date(),
      })
      .where(eq(fieldIssues.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["admin", "silver_admin", "gold_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.delete(fieldIssues).where(eq(fieldIssues.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json({ error: "Failed to delete issue" }, { status: 500 });
  }
}