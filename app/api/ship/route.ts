import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { orderId, name, email, phone, address, pincode } = body;

		const fakeAWB = `DTDC${Math.floor(10000000 + Math.random() * 90000000)}IN`;

		if (email) {
			await resend.emails.send({
				from: 'Trendy Jewellery <onboarding@resend.dev>',
				to: email,
				subject: `Order Confirmed: ${orderId}`,
				html: `
					<div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
						<h2 style="color: #b38728; text-transform: uppercase; letter-spacing: 2px;">Trendy Jewellery</h2>
						<h3 style="font-size: 20px;">Hi ${name}, your premium order is confirmed! 🎉</h3>
						<p style="color: #555;">Your jewelry is being packed at our facility and will be handed over to DTDC shortly.</p>
						<div style="background: #fafafa; padding: 15px; border-radius: 6px; margin: 20px 0;">
							<p style="margin: 5px 0;"><strong>Order ID:</strong> <span style="color: #111;">${orderId}</span></p>
							<p style="margin: 5px 0;"><strong>Tracking Number:</strong> <span style="color: #b38728; font-weight: bold;">${fakeAWB}</span></p>
						</div>
						<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
						<p style="text-transform: uppercase; font-size: 12px; color: #999; font-weight: bold;">Shipping Details</p>
						<p style="margin: 5px 0;">${address}</p>
						<p style="margin: 5px 0;">Pincode: ${pincode}</p>
						<p style="margin: 5px 0;">Phone: ${phone}</p>
						<p style="margin-top: 30px; font-size: 12px; color: #999;">Thank you for shopping with Trendy Jewellery!</p>
					</div>
				`,
			});
		}

		return NextResponse.json({ success: true, awb_number: fakeAWB });
	} catch (error) {
		console.error('Email/Shipping Error:', error);
		return NextResponse.json(
			{ error: 'Failed to process shipping and email' },
			{ status: 500 },
		);
	}
}
