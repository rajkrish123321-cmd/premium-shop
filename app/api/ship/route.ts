import { NextResponse } from "next/server";

import { updateOrderPaymentStatus } from "@/lib/neon";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    const paymentStatus = body?.paymentStatus;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const normalizedStatus = paymentStatus === "paid" || paymentStatus === "pending" || paymentStatus === "failed" || paymentStatus === "cancelled"
      ? paymentStatus
      : null;

    if (!normalizedStatus) {
      return NextResponse.json({ error: "Payment status is invalid." }, { status: 400 });
    }

    const result = await updateOrderPaymentStatus(orderId, normalizedStatus);
    if (!result?.id) {
      return NextResponse.json({ error: "Order status could not be updated." }, { status: 404 });
    }

    return NextResponse.json({ success: true, orderId: result.id, paymentStatus: result.payment_status });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Unable to update the order" }, { status: 500 });
  }
}

