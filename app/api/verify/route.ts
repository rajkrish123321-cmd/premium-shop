import { NextResponse } from "next/server";
import { razorpayConfigured, verifyRazorpayPayment } from "@/lib/razorpay-verification";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Payment details are incomplete." }, { status: 400 });
    }
    if (!razorpayConfigured) {
      return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
    }
    if (!await verifyRazorpayPayment(orderId, paymentId, signature)) {
      return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Unable to verify the payment." }, { status: 500 });
  }
}