import { NextResponse } from "next/server";
import { Resend } from "resend";

import {
  claimRefundEmail,
  finishRefundEmail,
  getRefundByMerchantId,
  updateRefundState,
} from "@/lib/neon";
import { verifyPhonePeWebhookAuthorization } from "@/lib/phonepe";

type RefundWebhook = {
  event?: string;
  payload?: {
    merchantRefundId?: string;
    originalMerchantOrderId?: string;
    amount?: number;
    state?: string;
    refundId?: string;
  };
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

async function sendRefundEmail(merchantRefundId: string) {
  const refund = await claimRefundEmail(merchantRefundId);
  if (!refund) return;

  let sent = false;
  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !refund.customer_email) {
      throw new Error("Refund email sender or customer address is not configured.");
    }
    const amountRupees = (refund.amount_paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: refund.amount_paise % 100 ? 2 : 0,
      maximumFractionDigits: 2,
    });
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: refund.customer_email,
      subject: `Refund successful - Order ${refund.order_id}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#26231d"><p style="color:#8b681f;font-weight:bold">TRENDY JEWELLERY</p><h1>Your refund has been processed</h1><p>Hello ${escapeHtml(refund.customer_name || "there")},</p><p>We have successfully refunded <strong>₹${amountRupees}</strong> for order <strong>#${escapeHtml(refund.order_id)}</strong> to your original payment method.</p><p>Please allow <strong>5 to 7 bank working days</strong> for the amount to reflect in your account statement, depending on your bank.</p><p>Thank you for shopping with Trendy Jewellery.</p></div>`,
    });
    if (result.error) throw new Error(result.error.message);
    sent = true;
  } catch (error) {
    console.error("Refund confirmation email failed:", error);
  } finally {
    await finishRefundEmail(merchantRefundId, sent);
  }
}

export async function POST(request: Request) {
  if (!verifyPhonePeWebhookAuthorization(request.headers.get("authorization") || "")) {
    return NextResponse.json({ error: "Unauthorized webhook request." }, { status: 401 });
  }

  let body: RefundWebhook;
  try {
    body = await request.json() as RefundWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (body.event !== "pg.refund.completed" && body.event !== "pg.refund.failed") {
    return NextResponse.json({ received: true, ignored: true });
  }
  const payload = body.payload;
  const merchantRefundId = typeof payload?.merchantRefundId === "string" ? payload.merchantRefundId.trim() : "";
  const orderId = typeof payload?.originalMerchantOrderId === "string" ? payload.originalMerchantOrderId.trim() : "";
  const amountPaise = Number(payload?.amount);
  if (!merchantRefundId || !orderId || !Number.isSafeInteger(amountPaise) || amountPaise < 100) {
    return NextResponse.json({ error: "Refund webhook fields are invalid." }, { status: 400 });
  }

  try {
    const refund = await getRefundByMerchantId(merchantRefundId);
    if (!refund) return NextResponse.json({ error: "Refund reference not found." }, { status: 404 });
    if (refund.order_id !== orderId || Number(refund.amount_paise) !== amountPaise) {
      return NextResponse.json({ error: "Refund details did not match the reserved request." }, { status: 409 });
    }

    const state = body.event === "pg.refund.completed" ? "completed" : "failed";
    await updateRefundState(merchantRefundId, state, payload?.refundId);
    if (state === "completed") await sendRefundEmail(merchantRefundId);
    return NextResponse.json({ received: true, refundStatus: state });
  } catch (error) {
    console.error("PhonePe refund webhook processing failed:", error);
    return NextResponse.json({ error: "Unable to process refund webhook." }, { status: 500 });
  }
}