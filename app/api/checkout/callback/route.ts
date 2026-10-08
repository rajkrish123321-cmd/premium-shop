import { NextResponse } from "next/server";

import { updateOrderPaymentStatus } from "@/lib/neon";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

    if (!orderId) {
      return NextResponse.json({ error: "Missing order execution token" }, { status: 400 });
    }

    const result = await updateOrderPaymentStatus(orderId, "awaiting_verification");
    if (!result?.id) {
      return NextResponse.json({ error: "Order could not be updated for verification." }, { status: 404 });
    }

    console.log(`[Auto-Callback] Order #${orderId} moved to verification queue.`);
    return NextResponse.json({ success: true, orderId: result.id, paymentStatus: result.payment_status });
  } catch (error) {
    console.error("Callback engine failure:", error);
    return NextResponse.json({ error: "Failed to process return hook" }, { status: 500 });
  }
}
