import { NextResponse } from "next/server";
import { Resend } from "resend";

import { confirmPaidOrder, getOrderPayment, updateOrderPaymentStatus } from "@/lib/neon";
import { getPhonePeOrderStatus } from "@/lib/phonepe";
import { getCartPricing } from "@/lib/store-pricing";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

async function sendReceipt(order: NonNullable<Awaited<ReturnType<typeof confirmPaidOrder>>>) {
	if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return "sender_not_configured";
	const pricing = getCartPricing(order.cart_items);
	if (!pricing) return "failed";
	const items = pricing.items.map(item => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.name)} × ${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.lineTotal.toLocaleString("en-IN")}</td></tr>`).join("");
	const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
		from: process.env.RESEND_FROM_EMAIL,
		to: order.customer_email,
		subject: `Payment receipt for Trendy Jewellery order ${order.id}`,
		html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222"><p style="color:#8b6b23;font-weight:bold">TRENDY JEWELLERY</p><h1 style="font-size:24px">Payment received</h1><p>Thank you, ${escapeHtml(order.customer_name)}. Your PhonePe payment is confirmed.</p><p>Order <strong>#${order.id}</strong><br>Placed ${new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</p><table style="width:100%;border-collapse:collapse"><tbody>${items}</tbody><tfoot><tr><td style="padding:12px 8px;font-weight:bold">Total paid</td><td style="padding:12px 8px;text-align:right;font-weight:bold">₹${Number(order.total_amount).toLocaleString("en-IN")}</td></tr></tfoot></table><p>Your team will arrange shipping and share tracking details after dispatch.</p></div>`,
	});
	return result.error ? "failed" : "sent";
}

export async function GET(request: Request) {
	const orderId = new URL(request.url).searchParams.get("orderId")?.trim() || "";
	if (!UUID_PATTERN.test(orderId)) {
		return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
	}

	try {
		const order = await getOrderPayment(orderId);
		if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

		const gatewayStatus = await getPhonePeOrderStatus(orderId);
		if (gatewayStatus.merchantOrderId !== orderId) {
			return NextResponse.json({ error: "PhonePe order reference did not match." }, { status: 409 });
		}

		if (gatewayStatus.state === "COMPLETED") {
			if (Number(gatewayStatus.amount) !== Number(order.total_amount) * 100) {
				return NextResponse.json({ error: "PhonePe payment amount did not match this order." }, { status: 409 });
			}
			const receipt = await confirmPaidOrder(orderId);
			if (!receipt) return NextResponse.json({ error: "Paid order could not be loaded." }, { status: 404 });
			const receiptStatus = receipt.newlyPaid ? await sendReceipt(receipt).catch(error => {
				console.error("Receipt delivery failed:", error);
				return "failed";
			}) : "already_sent";
			const pricing = getCartPricing(receipt.cart_items);
			return NextResponse.json({
				paymentStatus: "paid",
				receiptStatus,
				receipt: {
					orderId: receipt.id,
					customerName: receipt.customer_name,
					customerEmail: receipt.customer_email,
					createdAt: receipt.created_at,
					amount: Number(receipt.total_amount),
					items: pricing?.items || [],
				},
			});
		}

		const paymentStatus = gatewayStatus.state === "FAILED" ? "failed" : "pending";
		if (order.payment_status !== "paid") await updateOrderPaymentStatus(orderId, paymentStatus);
		return NextResponse.json({ paymentStatus: order.payment_status === "paid" ? "paid" : paymentStatus });
	} catch (error) {
		console.error("PhonePe order verification failed:", error);
		return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to confirm payment." }, { status: 502 });
	}
}