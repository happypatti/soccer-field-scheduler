import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });

    return NextResponse.json(userNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (notificationIds && Array.isArray(notificationIds)) {
      for (const id of notificationIds) {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.id, id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}