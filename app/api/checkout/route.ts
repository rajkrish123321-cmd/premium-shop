import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Razorpay from "razorpay";
import { getCartPricing } from "@/lib/store-pricing";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const pricing = getCartPricing(body?.cart);
		if (!pricing) {
			return NextResponse.json({ error: "Your cart contains invalid items or quantities." }, { status: 400 });
		}

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
			amount: pricing.total * 100,
			currency: "INR",
			receipt: `TJ-${randomUUID()}`,
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
