import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { amount } = body;

		const key_id = process.env.RAZORPAY_KEY_ID || "";
		const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

		if (!key_id || !key_secret) {
			return NextResponse.json(
				{ error: "Razorpay keys missing from environment" },
				{ status: 400 },
			);
		}

		const razorpay = new Razorpay({ key_id, key_secret });

		const options = {
			amount: amount || 50000,
			currency: "INR",
			receipt: "rcpt_" + Math.random().toString(36).substring(7),
		};

		const order = await razorpay.orders.create(options);

		return NextResponse.json({
			orderId: order.id,
			keyId: key_id,
			amount: order.amount,
			currency: order.currency,
		});
	} catch (error) {
		console.error("Checkout API Error:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
