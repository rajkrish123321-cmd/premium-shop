import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { createPasswordResetToken, neonConfigured } from "@/lib/neon";

export async function POST(request: Request) {
  try {
    const { email: rawEmail } = await request.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    if (!neonConfigured || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json({ error: "Password reset is not configured." }, { status: 503 });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const found = await createPasswordResetToken(email, crypto.createHash("sha256").update(token).digest("hex"), new Date(Date.now() + 60 * 60 * 1000));
    if (found) {
      const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;
      await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM_EMAIL, to: email, subject: "Reset your Trendy Jewellery password", html: `<p>Reset your password within one hour:</p><p><a href="${resetUrl}">Choose a new password</a></p>` });
    }
    return NextResponse.json({ success: true, message: "If an account exists for that email, reset instructions have been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Unable to process the password reset request" }, { status: 500 });
  }
}
