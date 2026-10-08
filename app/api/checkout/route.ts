import { NextResponse } from "next/server";

import { createPendingOrder } from "@/lib/neon";
import { buildUpiPaymentLink, DEFAULT_PAYEE_VPA } from "@/lib/upi";
import { getCartPricing } from "@/lib/store-pricing";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const address = typeof body?.address === "string" ? body.address.trim() : "";
    const pincode = typeof body?.pincode === "string" ? body.pincode.trim() : "";
    const cart = body?.cart ?? {};
    const submittedUserId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const userId = submittedUserId || null;

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !address || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "Complete shipping details are required for UPI checkout." }, { status: 400 });
    }

    if (userId && !UUID_PATTERN.test(userId)) {
      return NextResponse.json({ error: "The signed-in customer reference is invalid. Please sign in again." }, { status: 400 });
    }

    const pricing = getCartPricing(cart);
    if (!pricing) {
      return NextResponse.json({ error: "Your cart contains invalid items or quantities." }, { status: 400 });
    }

    const pendingOrder = await createPendingOrder({
      userId,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      shippingAddress: address,
      pincode,
      cartItems: pricing.cart,
      totalAmount: pricing.total,
      payeeVpa: DEFAULT_PAYEE_VPA,
    });

    if (!pendingOrder?.id) {
      return NextResponse.json({ error: "Unable to create a pending order for UPI payment." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId: pendingOrder.id,
      paymentStatus: pendingOrder.payment_status,
      amount: pricing.total,
      upiUrl: buildUpiPaymentLink({ amount: pricing.total, orderId: pendingOrder.id }),
      payeeVpa: DEFAULT_PAYEE_VPA,
    });
  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

