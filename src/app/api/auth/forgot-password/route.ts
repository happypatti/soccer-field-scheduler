import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Set expiry to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save the token to database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Send the email
    await sendPasswordResetEmail(user.email, token, user.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}