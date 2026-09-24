import { NextResponse } from "next/server";
import crypto from "crypto";
import { neonConfigured, updatePassword } from "@/lib/neon";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    const password = String(body.password || "");

    if (!token || password.length < 8) {
      return NextResponse.json({ error: "A valid reset token and password of at least 8 characters are required." }, { status: 400 });
    }

    if (!neonConfigured) return NextResponse.json({ error: "Neon authentication is not configured." }, { status: 503 });
    await updatePassword(crypto.createHash("sha256").update(token).digest("hex"), password);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Unable to reset the password." }, { status: 500 });
  }
}