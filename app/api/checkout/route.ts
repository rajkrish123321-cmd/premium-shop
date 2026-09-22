import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// This securely loads your keys from the hidden .env.local vault
const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID!,
	key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const options = {
			amount: body.amount,
			currency: 'INR',
			receipt: 'trndy_' + Math.floor(Math.random() * 100000),
		};

		const order = await razorpay.orders.create(options);

		return NextResponse.json({
			orderId: order.id,
			keyId: process.env.RAZORPAY_KEY_ID,
			amount: order.amount,
			currency: order.currency,
		});
	} catch (error) {
		console.error('Razorpay Backend Error:', error);
		return NextResponse.json(
			{ error: 'Failed to create secure order' },
			{ status: 500 },
		);
	}
}
