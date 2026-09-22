import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const PRODUCT_PRICES: Record<string, number> = {
	prod_1: 599,
	prod_2: 426,
	prod_3: 1176,
	prod_4: 305,
	prod_5: 77,
	prod_6: 52,
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { orderId, name, email, phone, address, pincode, cart } = body;

		if (!orderId || !name || !email || !phone || !address || !/^\d{6}$/.test(String(pincode)) || !cart || typeof cart !== 'object') {
			return NextResponse.json({ error: 'Invalid order details' }, { status: 400 });
		}

		let cartTotal = 0;
		for (const [id, rawQuantity] of Object.entries(cart as Record<string, unknown>)) {
			const quantity = Number(rawQuantity);
			if (!Number.isInteger(quantity) || quantity <= 0 || !(id in PRODUCT_PRICES)) {
				return NextResponse.json({ error: 'Invalid cart' }, { status: 400 });
			}
			cartTotal += PRODUCT_PRICES[id] * quantity;
		}

		if (cartTotal <= 0) {
			return NextResponse.json({ error: 'Cart cannot be empty' }, { status: 400 });
		}

		const igst = cartTotal * 0.03;
		const finalAmount = Math.round(cartTotal + igst);
		const fakeAWB = `DTDC${Math.floor(10000000 + Math.random() * 90000000)}IN`;

		const { error: dbError } = await supabase.from('orders').insert([{
			razorpay_order_id: orderId,
			customer_name: name,
			customer_phone: phone,
			customer_email: email,
			shipping_address: address,
			pincode,
			cart_items: cart,
			total_amount: finalAmount,
			dtdc_tracking_number: fakeAWB,
		}]);

		if (dbError) {
			console.error('Supabase Save Error:', dbError);
			return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
		}

		await resend.emails.send({
			from: 'Trendy Jewellery <onboarding@resend.dev>',
			to: email,
			subject: `Order Confirmed: ${orderId}`,
			html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-width: 600px; border: 1px solid #eee; border-radius: 10px;"><h2 style="color: #b38728; text-transform: uppercase; letter-spacing: 2px;">Trendy Jewellery</h2><h3>Hi ${name}, your premium order is confirmed! 🎉</h3><p>Your jewelry is being packed and will be handed over to DTDC shortly.</p><div style="background: #fafafa; padding: 15px; border-radius: 6px;"><p><strong>Order ID:</strong> ${orderId}</p><p><strong>Tracking Number:</strong> ${fakeAWB}</p><p><strong>Total Paid:</strong> ₹${finalAmount}</p></div><p>${address}</p><p>Pincode: ${pincode}</p><p>Phone: ${phone}</p></div>`,
		});

		return NextResponse.json({ success: true, awb_number: fakeAWB });
	} catch (error) {
		console.error('Order Processing Error:', error);
		return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
	}
}
