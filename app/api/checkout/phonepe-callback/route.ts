import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getOrderPayment, confirmPaidOrder, updateOrderPaymentStatus } from "@/lib/neon";
import { getPhonePeOrderStatus } from "@/lib/phonepe";

export async function POST(request: Request) {
	const username = process.env.PHONEPE_WEBHOOK_USER;
	const password = process.env.PHONEPE_WEBHOOK_PASS;
	if (!username || !password) {
		console.error("PhonePe webhook credentials are not configured.");
		return NextResponse.json({ error: "Webhook authentication is not configured." }, { status: 500 });
	}

	const authorization = request.headers.get("authorization") || "";
	const expected = Buffer.from(`Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`);
	const received = Buffer.from(authorization);
	if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
		return NextResponse.json({ error: "Unauthorized webhook request." }, { status: 401 });
	}

	try {
		const body: unknown = await request.json();
		if (typeof body !== "object" || body === null) {
			return NextResponse.json({ error: "Invalid PhonePe webhook payload." }, { status: 400 });
		}
		const payload = "payload" in body && typeof body.payload === "object" && body.payload !== null
			? body.payload
			: body;
		const orderId = "merchantOrderId" in payload && typeof payload.merchantOrderId === "string"
			? payload.merchantOrderId.trim()
			: "";
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
			return NextResponse.json({ error: "Webhook order reference is invalid." }, { status: 400 });
		}

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
			await confirmPaidOrder(orderId);
		} else if (gatewayStatus.state === "FAILED") {
			if (order.payment_status !== "paid") await updateOrderPaymentStatus(orderId, "failed");
		} else if (order.payment_status !== "paid") {
			await updateOrderPaymentStatus(orderId, "pending");
		}

		return NextResponse.json({ received: true, paymentStatus: gatewayStatus.state?.toLowerCase() || "pending" });
	} catch (error) {
		console.error("PhonePe webhook processing failed:", error instanceof Error ? error.message : "Unknown error");
		return NextResponse.json({ error: "Unable to process PhonePe webhook." }, { status: 502 });
	}
}