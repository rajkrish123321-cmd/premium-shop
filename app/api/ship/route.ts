import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { Resend } from "resend";

import { auth } from "@/auth";
import { insertOrder } from "@/lib/neon";

const PRODUCT_PRICES: Record<string, number> = {
  "1": 599,
  "2": 426,
  "3": 1176,
  "4": 305,
  "5": 77,
  "6": 52,
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);

function isValidSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature, name, email, phone, address, pincode, cart } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !name || !phone || !address || !/^\d{6}$/.test(pincode) || !cart) {
      return NextResponse.json({ error: "Complete shipping details are required" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!secret || !keyId || !isValidSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, secret)) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const session = await auth();

    let cartTotal = 0;
    for (const [id, qty] of Object.entries(cart as Record<string, number>)) {
      const quantity = Number(qty);
      if (!PRODUCT_PRICES[id] || !Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
        return NextResponse.json({ error: "Invalid cart details" }, { status: 400 });
      }
      cartTotal += PRODUCT_PRICES[id] * quantity;
    }

    const igst = pincode.length === 6 && cartTotal > 0 ? cartTotal * 0.03 : 0;
    const finalAmount = Math.round(cartTotal + igst);

    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
    const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
    if (Number(razorpayOrder.amount) !== finalAmount * 100 || razorpayOrder.currency !== "INR") {
      return NextResponse.json({ error: "Payment amount does not match the order" }, { status: 400 });
    }

    const order = await insertOrder({
      userId: session?.user?.id || null,
      razorpayOrderId,
      razorpayPaymentId,
      customerName: name,
      customerPhone: phone,
      customerEmail: email || "",
      shippingAddress: address,
      pincode,
      cartItems: cart,
      totalAmount: finalAmount,
    });

    if (!order) {
      return NextResponse.json({ success: true, order_id: razorpayOrderId, duplicate: true });
    }

    const orderId = `TJ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #b38728; text-transform: uppercase; letter-spacing: 2px;">Trendy Jewellery</h2>
        <h3 style="font-size: 20px;">New paid order received</h3>
        <div style="background: #fafafa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Razorpay Payment Order:</strong> ${razorpayOrderId}</p>
          <p><strong>Total Paid:</strong> ₹${finalAmount}</p>
        </div>
        <p><strong>Customer:</strong> ${escapeHtml(String(name))}</p>
        <p><strong>Email:</strong> ${escapeHtml(String(email || "Not provided"))}</p>
        <p><strong>Phone:</strong> ${escapeHtml(String(phone))}</p>
        <p><strong>Address:</strong> ${escapeHtml(String(address))}</p>
        <p><strong>Pincode:</strong> ${escapeHtml(String(pincode))}</p>
        <p style="color: #666;">DTDC tracking will be added manually after dispatch.</p>
      </div>`;

    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const recipients = [process.env.ADMIN_EMAIL || "rajkrish123321@gmail.com", email].filter(Boolean);
      for (const recipient of recipients) {
        try {
          await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: recipient, subject: `Order confirmed: ${orderId}`, html: emailHtml });
        } catch (emailError) {
          console.error("Order email delivery failed:", emailError);
        }
      }
    }

    return NextResponse.json({ success: true, order_id: String(order.id || orderId) });
  } catch (error) {
    console.error("Order Processing Error:", error);
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
  }
}
