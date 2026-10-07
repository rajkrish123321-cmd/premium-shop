import { NextResponse } from "next/server";
import { createUser, neonConfigured } from "@/lib/neon";
import { isPasswordValid } from "@/lib/password-strength";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "A valid email and password are required." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return NextResponse.json({ error: "A valid email and password are required." }, { status: 400 });
    }

    if (!isPasswordValid(password)) {
      return NextResponse.json({ error: "Use at least 8 characters with a lowercase letter, uppercase letter, and number." }, { status: 400 });
    }

    const userName = name || email;
    if (!neonConfigured) {
      return NextResponse.json({ error: "Neon authentication is not configured." }, { status: 503 });
    }

    const user = await createUser(email, password, userName);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    const databaseError = error as { code?: string; cause?: { code?: string } };
    if (databaseError.code === "23505" || databaseError.cause?.code === "23505") {
      return NextResponse.json({ error: "An account with this email already exists. Please sign in instead." }, { status: 409 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
