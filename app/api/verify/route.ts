import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
	try {
		const {
			razorpay_order_id,
			razorpay_payment_id,
			razorpay_signature,
		} = await req.json();

		const secret = process.env.RAZORPAY_KEY_SECRET;
		if (!secret) throw new Error("Razorpay secret missing");

		const body = razorpay_order_id + "|" + razorpay_payment_id;
		const expectedSignature = crypto
			.createHmac("sha256", secret)
			.update(body.toString())
			.digest("hex");

		const isAuthentic = expectedSignature === razorpay_signature;

		if (isAuthentic) {
			return NextResponse.json(
				{ success: true, message: "Payment verified successfully" },
				{ status: 200 },
			);
		}

		return NextResponse.json(
			{ success: false, message: "Invalid signature" },
			{ status: 400 },
		);
	} catch (error) {
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
