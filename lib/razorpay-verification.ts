import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";

export const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  expectedAmount?: number,
) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !/^[a-f\d]{64}$/i.test(signature)) return false;

  const expectedSignature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  const providedSignature = Buffer.from(signature, "hex");
  if (expectedSignature.length !== providedSignature.length || !timingSafeEqual(expectedSignature, providedSignature)) {
    return false;
  }

  if (!process.env.RAZORPAY_KEY_ID) return false;
  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: secret });
  const payment = await razorpay.payments.fetch(paymentId);

  return payment.order_id === orderId
    && payment.status === "captured"
    && (expectedAmount === undefined || payment.amount === expectedAmount);
}