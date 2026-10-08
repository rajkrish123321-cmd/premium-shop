import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { updateOrderAdminState } from "@/lib/neon";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !session.user.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin access denied" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const paymentStatus = body?.paymentStatus;
    const validPaymentStatus = paymentStatus === "pending" || paymentStatus === "awaiting_verification" || paymentStatus === "paid" || paymentStatus === "failed" || paymentStatus === "cancelled"
      ? paymentStatus
      : undefined;

    const flaggedForRefund = typeof body?.flaggedForRefund === "boolean" ? body.flaggedForRefund : undefined;

    const result = await updateOrderAdminState(orderId, {
      paymentStatus: validPaymentStatus,
      flaggedForRefund,
    });

    if (!result?.id) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: result });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "Unable to update the order." }, { status: 500 });
  }
}
