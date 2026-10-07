import { NextResponse } from "next/server";
import { Resend } from "resend";

import { auth } from "@/auth";
import { insertOrder } from "@/lib/neon";
import { razorpayConfigured, verifyRazorpayPayment } from "@/lib/razorpay-verification";
import { getCartPricing } from "@/lib/store-pricing";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character] || character));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature, name, email, phone, address, pincode, cart } = body;

    if (typeof razorpayOrderId !== "string" || typeof razorpayPaymentId !== "string" || typeof signature !== "string"
      || typeof name !== "string" || !name.trim() || typeof phone !== "string" || !phone.trim()
      || typeof address !== "string" || !address.trim() || typeof pincode !== "string" || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "Complete shipping details are required" }, { status: 400 });
    }
    const pricing = getCartPricing(cart);
    if (!pricing) return NextResponse.json({ error: "Your cart contains invalid items or quantities." }, { status: 400 });
    if (!razorpayConfigured) return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
    if (!await verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, signature, pricing.total * 100)) {
      return NextResponse.json({ error: "Payment could not be verified for this cart." }, { status: 400 });
    }

    const session = await auth();
    const orderId = `TJ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalAmount = pricing.total;

    const order = await insertOrder({
      userId: session?.user?.id || null,
      razorpayOrderId,
      razorpayPaymentId,
      customerName: name,
      customerPhone: phone,
      customerEmail: email || "",
      shippingAddress: address,
      pincode,
      cartItems: pricing.cart,
      totalAmount: finalAmount,
    });

    const customerName = escapeHtml(name.trim());
    const customerEmail = typeof email === "string" ? email.trim() : "";
    const customerPhone = escapeHtml(phone.trim());
    const shippingAddress = escapeHtml(address.trim());
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #b38728; text-transform: uppercase; letter-spacing: 2px;">Trendy Jewellery</h2>
        <h3 style="font-size: 20px;">New paid order received</h3>
        <div style="background: #fafafa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Razorpay Payment Order:</strong> ${razorpayOrderId}</p>
          <p><strong>Total Paid:</strong> ₹${finalAmount}</p>
        </div>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${escapeHtml(customerEmail || "Not provided")}</p>
        <p><strong>Phone:</strong> ${customerPhone}</p>
        <p><strong>Address:</strong> ${shippingAddress}</p>
        <p><strong>Pincode:</strong> ${pincode}</p>
        <p style="color: #666;">DTDC tracking will be added manually after dispatch.</p>
      </div>`;

    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: process.env.ADMIN_EMAIL || "rajkrish123321@gmail.com",
          subject: `New paid order: ${orderId}`,
          html: emailHtml,
        });
        if (customerEmail) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: customerEmail,
            subject: `Order confirmed: ${orderId}`,
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error("Order email notification failed:", emailError);
      }
    }

    return NextResponse.json({ success: true, order_id: String(order?.id || orderId) });
  } catch (error) {
    console.error("Order Processing Error:", error);
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
  }
}
