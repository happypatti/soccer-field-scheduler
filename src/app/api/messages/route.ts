import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, notifications, users } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, desc, and, or, sql, ne } from "drizzle-orm";
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

    if (conversationId) {
      // Get specific conversation
      const conversationMessages = await db.query.messages.findMany({
        where: eq(messages.conversationId, conversationId),
        orderBy: [desc(messages.createdAt)],
        with: {
          sender: {
            columns: { id: true, name: true, email: true, role: true, tier: true },
          },
          receiver: {
            columns: { id: true, name: true, email: true, role: true, tier: true },
          },
        },
      });

      // Verify user has access to this conversation
      const hasAccess = conversationMessages.some(
        (m) => m.senderId === session.user.id || m.receiverId === session.user.id
      );

      if (!hasAccess && conversationMessages.length > 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json(conversationMessages);
    }

    // Get all conversations for the user
    const userMessages = await db.query.messages.findMany({
      where: or(
        eq(messages.senderId, session.user.id),
        eq(messages.receiverId, session.user.id)
      ),
      orderBy: [desc(messages.createdAt)],
      limit: limit * 5, // Get more to group conversations
      with: {
        sender: {
          columns: { id: true, name: true, email: true, role: true, tier: true },
        },
        receiver: {
          columns: { id: true, name: true, email: true, role: true, tier: true },
        },
      },
    });

    // Group by conversation and get latest message
    const conversations = new Map();
    for (const msg of userMessages) {
      if (!conversations.has(msg.conversationId)) {
        // Get the other person in the conversation
        const otherPerson = msg.senderId === session.user.id ? msg.receiver : msg.sender;
        
        conversations.set(msg.conversationId, {
          conversationId: msg.conversationId,
          subject: msg.subject,
          lastMessage: msg,
          unreadCount: 0,
          messages: [],
          otherPerson: otherPerson,
        });
      }
      conversations.get(msg.conversationId).messages.push(msg);
      
      // Count unread messages sent TO the current user
      if (!msg.isRead && msg.receiverId === session.user.id) {
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
    } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (!receiverId && !conversationId) {
      return NextResponse.json({ error: "Recipient or conversation is required" }, { status: 400 });
    }

    // If replying to conversation, get receiver from existing conversation
    let actualReceiverId = receiverId;
    let convId = conversationId || crypto.randomUUID();
    
    if (conversationId && !receiverId) {
      // Find the other person in the conversation
      const existingMsg = await db.query.messages.findFirst({
        where: eq(messages.conversationId, conversationId),
      });
      
      if (existingMsg) {
        actualReceiverId = existingMsg.senderId === session.user.id 
          ? existingMsg.receiverId 
          : existingMsg.senderId;
      }
    }

    if (!actualReceiverId) {
      return NextResponse.json({ error: "Could not determine recipient" }, { status: 400 });
    }

    // Verify recipient exists
    const recipient = await db.query.users.findFirst({
      where: eq(users.id, actualReceiverId),
      columns: { id: true, name: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Determine message subject
    let messageSubject = subject;
    if (!messageSubject && conversationId) {
      const existingMsg = await db.query.messages.findFirst({
        where: eq(messages.conversationId, conversationId),
      });
      messageSubject = existingMsg?.subject || "Message";
    }
    if (!messageSubject) {
      messageSubject = "New Message";
    }

    const userIsAdmin = isAdmin(session.user.role);

    // Create the message
    const [newMessage] = await db.insert(messages).values({
      conversationId: convId,
      senderId: session.user.id,
      receiverId: actualReceiverId,
      subject: messageSubject,
      content: content.trim(),
      isFromAdmin: userIsAdmin,
      relatedReservationId: relatedReservationId || null,
    }).returning();

    // Get sender name for notification
    const sender = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true },
    });

    // Create notification for recipient
    await db.insert(notifications).values({
      userId: actualReceiverId,
      type: "message",
      title: `New message from ${sender?.name || "User"}`,
      message: content.length > 100 ? content.substring(0, 100) + "..." : content,
      relatedMessageId: newMessage.id,
    });

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

    if (conversationId) {
      // Mark all messages in conversation as read (only messages sent TO the current user)
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
    } else if (messageIds && Array.isArray(messageIds)) {
      for (const id of messageIds) {
        await db
          .update(messages)
          .set({ isRead: true, readAt: now })
          .where(
            and(
              eq(messages.id, id),
              eq(messages.receiverId, session.user.id)
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