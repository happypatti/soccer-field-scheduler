import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const unreadOnly = searchParams.get("unread") === "true";

    let whereClause = eq(notifications.userId, session.user.id);
    if (unreadOnly) {
      whereClause = and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false)
      ) as any;
    }

    const userNotifications = await db.query.notifications.findMany({
      where: whereClause,
      orderBy: [desc(notifications.createdAt)],
      limit: limit,
    });

    // Get counts
    const [countResult] = await db
      .select({
        total: sql<number>`count(*)::int`,
        unread: sql<number>`count(*) filter (where is_read = false)::int`,
      })
      .from(notifications)
      .where(eq(notifications.userId, session.user.id));

    return NextResponse.json({
      notifications: userNotifications,
      counts: {
        total: countResult?.total || 0,
        unread: countResult?.unread || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// Mark notifications as read with read receipt timestamp
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    const now = new Date();

    if (markAllRead) {
      // Mark all notifications as read for this user
      await db
        .update(notifications)
        .set({ isRead: true, readAt: now })
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
          )
        );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      for (const id of notificationIds) {
        await db
          .update(notifications)
          .set({ isRead: true, readAt: now })
          .where(
            and(
              eq(notifications.id, id),
              eq(notifications.userId, session.user.id)
            )
          );
      }
    }

    return NextResponse.json({ success: true, readAt: now.toISOString() });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// Delete notifications
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, deleteAll } = body;

    if (deleteAll) {
      // Delete all notifications for user
      await db
        .delete(notifications)
        .where(eq(notifications.userId, session.user.id));
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Delete specific notifications - verify ownership
      for (const id of notificationIds) {
        await db
          .delete(notifications)
          .where(
            and(
              eq(notifications.id, id),
              eq(notifications.userId, session.user.id)
            )
          );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}