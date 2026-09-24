import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Customer profile handling is managed through the Neon-backed NextAuth flow.",
  });
}
