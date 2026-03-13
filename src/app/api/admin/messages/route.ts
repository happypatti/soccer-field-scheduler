import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "silver_admin" || role === "gold_admin";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, recipientType, selectedTier, selectedUserId } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // Get recipient users
    let recipientUsers: { id: string }[] = [];

    if (recipientType === "all") {
      // All users (excluding admins)
      const allUsers = await db.query.users.findMany({
        where: eq(users.role, "user"),
        columns: { id: true },
      });
      recipientUsers = allUsers;
    } else if (recipientType === "tier" && selectedTier) {
      // Users of specific tier
      const tierUsers = await db.query.users.findMany({
        columns: { id: true },
      });
      // Filter by tier (Drizzle doesn't have a direct tier query)
      const allUsers = await db.query.users.findMany({
        columns: { id: true, tier: true, role: true },
      });
      recipientUsers = allUsers.filter(u => u.tier === selectedTier && u.role === "user");
    } else if (recipientType === "single" && selectedUserId) {
      // Single user
      recipientUsers = [{ id: selectedUserId }];
    } else {
      return NextResponse.json({ error: "Invalid recipient selection" }, { status: 400 });
    }

    if (recipientUsers.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Create notifications for all recipients
    const notificationsToInsert = recipientUsers.map((user) => ({
      userId: user.id,
      type: "announcement",
      title: title,
      message: message,
      isRead: false,
    }));

    await db.insert(notifications).values(notificationsToInsert);

    return NextResponse.json({
      success: true,
      recipientCount: recipientUsers.length,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}