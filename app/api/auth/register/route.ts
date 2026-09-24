import { NextResponse } from "next/server";
import { createUser, neonConfigured } from "@/lib/neon";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
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
        email: user.email || email,
        name: user.name || userName,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
