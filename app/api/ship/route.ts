import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// VERCEL BUILD FIX: Added fallbacks so the compiler doesn't crash if it reads this during build-time
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

const PRODUCT_PRICES: Record<string, number> = {
	"prod_1": 599, "prod_2": 426, "prod_3": 1176,
	"prod_4": 305, "prod_5": 77, "prod_6": 52
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { orderId, name, email, phone, address, pincode, cart } = body;

		let cartTotal = 0;
		for (const [id, qty] of Object.entries(cart as Record<string, number>)) {
			cartTotal += (PRODUCT_PRICES[id] || 0) * qty;
		}
		const igst = pincode.length === 6 && cartTotal > 0 ? cartTotal * 0.03 : 0;
		const finalAmount = Math.round(cartTotal + igst);

		const fakeAWB = "DTDC" + Math.floor(10000000 + Math.random() * 90000000) + "IN";

		const { error: dbError } = await supabase
			.from('orders')
			.insert([{
				razorpay_order_id: orderId,
				customer_name: name,
				customer_phone: phone,
				customer_email: email,
				shipping_address: address,
				pincode,
				cart_items: cart,
				total_amount: finalAmount,
				dtdc_tracking_number: fakeAWB
			}]);

		if (dbError) console.error("Supabase Save Error:", dbError);

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
							<p style="margin: 5px 0;"><strong>Total Paid:</strong> <span style="color: #111;">₹${finalAmount}</span></p>
						</div>
						<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
						<p style="text-transform: uppercase; font-size: 12px; color: #999; font-weight: bold;">Shipping Details</p>
						<p style="margin: 5px 0;">${address}</p>
						<p style="margin: 5px 0;">Pincode: ${pincode}</p>
						<p style="margin: 5px 0;">Phone: ${phone}</p>
					</div>
				`
			});
		}

		return NextResponse.json({ success: true, awb_number: fakeAWB });
	} catch (error) {
		return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
	}
}
