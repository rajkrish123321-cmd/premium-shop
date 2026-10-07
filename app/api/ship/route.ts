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
      || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
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
    const finalAmount = pricing.total;
    const customerEmail = email.trim().toLowerCase();

    const order = await insertOrder({
      userId: session?.user?.id || null,
      razorpayOrderId,
      razorpayPaymentId,
      customerName: name.trim(),
      customerPhone: phone,
      customerEmail,
      shippingAddress: address.trim(),
      pincode,
      cartItems: pricing.cart,
      totalAmount: finalAmount,
    });
    if (!order?.id) throw new Error("The paid order was not returned from the database.");
    const orderReference = `TJ-${order.id.toUpperCase()}`;

    const customerName = escapeHtml(name.trim());
    const customerPhone = escapeHtml(phone.trim());
    const shippingAddress = escapeHtml(address.trim());
    const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
    const itemRows = pricing.items.map(item => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatRupees(item.unitPrice)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatRupees(item.lineTotal)}</td>
      </tr>`).join("");
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #b38728; text-transform: uppercase; letter-spacing: 2px;">Trendy Jewellery</h2>
        <h3 style="font-size: 20px;">${customerEmail ? "Your order receipt" : "New paid order received"}</h3>
        <div style="background: #fafafa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${orderReference}</p>
          <p><strong>Razorpay Payment Order:</strong> ${razorpayOrderId}</p>
          <p><strong>Payment ID:</strong> ${escapeHtml(razorpayPaymentId)}</p>
        </div>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
        <p><strong>Phone:</strong> ${customerPhone}</p>
        <p><strong>Address:</strong> ${shippingAddress}</p>
        <p><strong>Pincode:</strong> ${escapeHtml(pincode)}</p>
        <h3>Items in your order</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr><th style="padding:10px;text-align:left;">Product</th><th style="padding:10px;">Qty</th><th style="padding:10px;text-align:right;">Price</th><th style="padding:10px;text-align:right;">Amount</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="margin-top:16px;text-align:right;line-height:1.8;">
          <div>Subtotal: ${formatRupees(pricing.subtotal)}</div>
          <div>Estimated IGST (3%): ${formatRupees(pricing.tax)}</div>
          <strong>Total paid: ${formatRupees(finalAmount)}</strong>
        </div>
        <p style="color: #666;">DTDC tracking will be added manually after dispatch.</p>
      </div>`;
    const emailText = [
      "Trendy Jewellery order receipt",
      `Order ID: ${orderReference}`,
      `Razorpay Order ID: ${razorpayOrderId}`,
      `Payment ID: ${razorpayPaymentId}`,
      `Customer: ${name.trim()}`,
      `Email: ${customerEmail}`,
      `Phone: ${phone.trim()}`,
      `Shipping address: ${address.trim()}, ${pincode}`,
      "Items:",
      ...pricing.items.map(item => `${item.name} | Qty ${item.quantity} | ${formatRupees(item.unitPrice)} each | ${formatRupees(item.lineTotal)}`),
      `Subtotal: ${formatRupees(pricing.subtotal)}`,
      `Estimated IGST (3%): ${formatRupees(pricing.tax)}`,
      `Total paid: ${formatRupees(finalAmount)}`,
    ].join("\n");

    const receiptDelivery = { customer: false, store: false };
    const senderAddress = process.env.RESEND_FROM_EMAIL || "";
    const senderDomain = senderAddress.match(/@([^>\s]+)/)?.[1]?.toLowerCase();
    const senderDomainIsNotTestDomain = Boolean(senderDomain && senderDomain !== "resend.dev");
    let receiptStatus: "sent" | "partial" | "failed" | "sender_not_configured" = "failed";

    if (process.env.RESEND_API_KEY && senderDomainIsNotTestDomain) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const sendReceipt = async (to: string) => {
        try {
          const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to,
            subject: `Order receipt ${orderReference} | Trendy Jewellery`,
            html: emailHtml,
            text: emailText,
          });
          if (result.error) {
            console.error(`Order receipt rejected for ${to}:`, result.error);
            return false;
          }
          if (!result.data?.id) {
            console.error(`Order receipt was not accepted for ${to}: Resend returned no message ID.`);
            return false;
          }
          return true;
        } catch (emailError) {
          console.error(`Order receipt failed for ${to}:`, emailError);
          return false;
        }
      };
      const [customerSent, storeSent] = await Promise.all([
        sendReceipt(customerEmail),
        customerEmail === "trendyjewellery62@gmail.com" ? Promise.resolve(true) : sendReceipt("trendyjewellery62@gmail.com"),
      ]);
      receiptDelivery.customer = customerSent;
      receiptDelivery.store = storeSent;
      receiptStatus = customerSent && storeSent ? "sent" : customerSent || storeSent ? "partial" : "failed";
    } else if (process.env.RESEND_API_KEY && senderAddress) {
      receiptStatus = "sender_not_configured";
      console.error("Order receipt not sent: configure RESEND_FROM_EMAIL using a sender at a verified domain you own; resend.dev is restricted to testing.");
    } else {
      console.error("Order receipt was not sent: RESEND_API_KEY or RESEND_FROM_EMAIL is missing.");
    }

    return NextResponse.json({
      success: true,
      order_id: orderReference,
      receipt_status: receiptStatus,
      receipt_delivery: receiptDelivery,
    });
  } catch (error) {
    console.error("Order Processing Error:", error);
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
  }
}
