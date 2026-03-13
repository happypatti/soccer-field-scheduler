import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, notifications, users } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, desc, and, or, sql } from "drizzle-orm";
import crypto from "crypto";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "silver_admin" || role === "gold_admin";
}

// Get messages for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const userIsAdmin = isAdmin(session.user.role);

    if (conversationId) {
      // Get specific conversation
      const conversationMessages = await db.query.messages.findMany({
        where: eq(messages.conversationId, conversationId),
        orderBy: [desc(messages.createdAt)],
        with: {
          sender: {
            columns: { id: true, name: true, email: true, role: true },
          },
          receiver: {
            columns: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // Verify user has access to this conversation
      const hasAccess = conversationMessages.some(
        (m) =>
          m.senderId === session.user.id ||
          m.receiverId === session.user.id ||
          (userIsAdmin && (m.receiverId === null || m.isFromAdmin))
      );

      if (!hasAccess && conversationMessages.length > 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json(conversationMessages);
    }

    // Get all conversations (grouped)
    let userMessages;

    if (userIsAdmin) {
      // Admins see all messages sent to admins (receiverId = null) plus direct messages
      userMessages = await db.query.messages.findMany({
        where: or(
          eq(messages.senderId, session.user.id),
          eq(messages.receiverId, session.user.id),
          eq(messages.receiverId, sql`null`) // Messages sent to "all admins"
        ),
        orderBy: [desc(messages.createdAt)],
        limit: limit * 5, // Get more to group conversations
        with: {
          sender: {
            columns: { id: true, name: true, email: true, role: true, tier: true },
          },
          receiver: {
            columns: { id: true, name: true, email: true, role: true },
          },
        },
      });
    } else {
      // Regular users see only their messages
      userMessages = await db.query.messages.findMany({
        where: or(
          eq(messages.senderId, session.user.id),
          eq(messages.receiverId, session.user.id)
        ),
        orderBy: [desc(messages.createdAt)],
        limit: limit,
        with: {
          sender: {
            columns: { id: true, name: true, email: true, role: true },
          },
          receiver: {
            columns: { id: true, name: true, email: true, role: true },
          },
        },
      });
    }

    // Group by conversation and get latest message
    const conversations = new Map();
    for (const msg of userMessages) {
      if (!conversations.has(msg.conversationId)) {
        conversations.set(msg.conversationId, {
          conversationId: msg.conversationId,
          subject: msg.subject,
          lastMessage: msg,
          unreadCount: 0,
          messages: [],
        });
      }
      conversations.get(msg.conversationId).messages.push(msg);
      
      // Count unread for current user
      if (!msg.isRead && msg.receiverId === session.user.id) {
        conversations.get(msg.conversationId).unreadCount++;
      }
      // For admins, count unread messages sent to all admins
      if (userIsAdmin && !msg.isRead && msg.receiverId === null && !msg.isFromAdmin) {
        conversations.get(msg.conversationId).unreadCount++;
      }
    }

    // Get total unread count
    let unreadCount = 0;
    for (const conv of conversations.values()) {
      unreadCount += conv.unreadCount;
    }

    return NextResponse.json({
      conversations: Array.from(conversations.values()).slice(0, limit),
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// Send a new message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      subject, 
      content, 
      receiverId, 
      conversationId, 
      relatedReservationId,
      parentMessageId 
    } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const userIsAdmin = isAdmin(session.user.role);

    // If replying to conversation, use existing conversationId, otherwise create new
    const convId = conversationId || crypto.randomUUID();

    // Determine message subject
    let messageSubject = subject;
    if (!messageSubject && conversationId) {
      // Get subject from existing conversation
      const existingMsg = await db.query.messages.findFirst({
        where: eq(messages.conversationId, conversationId),
      });
      messageSubject = existingMsg?.subject || "Message";
    }
    if (!messageSubject) {
      messageSubject = "New Message";
    }

    // Create the message
    const [newMessage] = await db.insert(messages).values({
      conversationId: convId,
      senderId: session.user.id,
      receiverId: receiverId || null, // null = sent to all admins
      subject: messageSubject,
      content: content.trim(),
      isFromAdmin: userIsAdmin,
      relatedReservationId: relatedReservationId || null,
      parentMessageId: parentMessageId || null,
    }).returning();

    // Create notification for recipient(s)
    if (userIsAdmin && receiverId) {
      // Admin replying to specific user
      await db.insert(notifications).values({
        userId: receiverId,
        type: "message",
        title: `New message from Admin`,
        message: content.length > 100 ? content.substring(0, 100) + "..." : content,
        relatedMessageId: newMessage.id,
      });
    } else if (!userIsAdmin) {
      // User sending to admins - notify all admins
      const admins = await db.query.users.findMany({
        where: or(
          eq(users.role, "admin"),
          eq(users.role, "silver_admin"),
          eq(users.role, "gold_admin")
        ),
        columns: { id: true },
      });

      // Get sender name for notification
      const sender = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { name: true },
      });

      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: "message",
          title: `New message from ${sender?.name || "User"}`,
          message: content.length > 100 ? content.substring(0, 100) + "..." : content,
          relatedMessageId: newMessage.id,
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: newMessage,
      conversationId: convId,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// Mark messages as read
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds, conversationId } = body;

    const now = new Date();
    const userIsAdmin = isAdmin(session.user.role);

    if (conversationId) {
      // Mark all messages in conversation as read
      if (userIsAdmin) {
        // Admin can mark messages from users as read
        await db
          .update(messages)
          .set({ isRead: true, readAt: now })
          .where(
            and(
              eq(messages.conversationId, conversationId),
              eq(messages.isRead, false),
              or(
                eq(messages.receiverId, session.user.id),
                eq(messages.receiverId, sql`null`)
              )
            )
          );
      } else {
        // User can mark messages from admin as read
        await db
          .update(messages)
          .set({ isRead: true, readAt: now })
          .where(
            and(
              eq(messages.conversationId, conversationId),
              eq(messages.receiverId, session.user.id),
              eq(messages.isRead, false)
            )
          );
      }
    } else if (messageIds && Array.isArray(messageIds)) {
      for (const id of messageIds) {
        await db
          .update(messages)
          .set({ isRead: true, readAt: now })
          .where(
            and(
              eq(messages.id, id),
              or(
                eq(messages.receiverId, session.user.id),
                userIsAdmin ? eq(messages.receiverId, sql`null`) : sql`false`
              )
            )
          );
      }
    }

    return NextResponse.json({ success: true, readAt: now.toISOString() });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to update messages" },
      { status: 500 }
    );
  }
}