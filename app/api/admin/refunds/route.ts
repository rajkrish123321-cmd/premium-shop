import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createPendingRefund, getOrderPayment, getRefund, updateRefundState } from "@/lib/neon";
import { createPhonePeRefund } from "@/lib/phonepe";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Admin access denied." }, { status: 403 });
  }

  let merchantRefundId = "";
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    const amount = Number(body?.amount);
    if (!UUID_PATTERN.test(orderId)) {
      return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "A positive refund amount is required." }, { status: 400 });
    }

    const amountPaise = Math.round(amount * 100);
    if (amountPaise < 100) return NextResponse.json({ error: "Refunds must be at least ₹1." }, { status: 400 });
    const order = await getOrderPayment(orderId);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.payment_status !== "paid") {
      return NextResponse.json({ error: "Only paid orders can be refunded." }, { status: 409 });
    }

    merchantRefundId = `REF-${orderId}-${randomUUID().slice(0, 8)}`;
    const reserved = await createPendingRefund(orderId, merchantRefundId, amountPaise);
    if (!reserved) {
      return NextResponse.json({ error: "Refund exceeds the remaining paid balance or is already reserved." }, { status: 409 });
    }

    const phonePeResult = await createPhonePeRefund({
      merchantRefundId,
      originalMerchantOrderId: orderId,
      amount: amountPaise,
    });
    if (!phonePeResult.ok) {
      await updateRefundState(merchantRefundId, "failed");
      return NextResponse.json({ error: "PhonePe could not accept this refund. Check the order and try again." }, { status: 502 });
    }

    const refund = await getRefund(orderId);
    return NextResponse.json({
      success: true,
      merchantRefundId,
      status: phonePeResult.state?.toLowerCase() || "pending",
      refundedAmountPaise: refund?.refunded_amount_paise || 0,
      latestRefundStatus: refund?.latest_refund_status || "pending",
    });
  } catch (error) {
    if (merchantRefundId) {
      try {
        await updateRefundState(merchantRefundId, "pending");
      } catch (stateError) {
        console.error("Could not preserve uncertain refund state:", stateError);
      }
    }
    console.error("Admin PhonePe refund failed:", error);
    return NextResponse.json({ error: "Unable to confirm the refund request. Check its status before retrying." }, { status: 502 });
  }
}