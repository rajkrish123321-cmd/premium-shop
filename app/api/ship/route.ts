import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { supabaseServiceRoleKey, supabaseUrl } from '../../../lib/supabase-config';

// Safe lazy initialization to avoid build-time crashes
const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const getSupabase = () => {
	return createClient(supabaseUrl, supabaseServiceRoleKey);
};

const PRODUCT_PRICES: Record<string, number> = {
	"1": 599, "2": 426, "3": 1176,
	"4": 305, "5": 77, "6": 52
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { orderId: razorpayOrderId, name, email, phone, address, pincode, cart } = body;
		if (!razorpayOrderId || !name || !phone || !address || !/^\d{6}$/.test(pincode) || !cart) {
			return NextResponse.json({ error: "Complete shipping details are required" }, { status: 400 });
		}
		const orderId = `TJ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

		let cartTotal = 0;
		for (const [id, qty] of Object.entries(cart as Record<string, number>)) {
			 cartTotal += (PRODUCT_PRICES[id] || 0) * qty;
		}
		const igst = pincode.length === 6 && cartTotal > 0 ? cartTotal * 0.03 : 0;
		const finalAmount = Math.round(cartTotal + igst);

		const supabase = getSupabase();
		const authorization = request.headers.get("authorization");
		const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
		let userId: string | null = null;
		if (accessToken) {
			const { data: authData } = await supabase.auth.getUser(accessToken);
			userId = authData.user?.id || null;
		}
		const { error: dbError } = await supabase
			.from('orders')
			.insert([{
				razorpay_order_id: razorpayOrderId,
				customer_name: name,
				customer_phone: phone,
				customer_email: email,
				shipping_address: address,
				pincode: pincode,
				cart_items: cart,
				total_amount: finalAmount,
				...(userId ? { user_id: userId } : {}),
			}]);

		if (dbError) console.error("Supabase Save Error:", dbError);

		const emailHtml = `
			<div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
				<h2 style="color: #b38728; text-transform: uppercase; letter-spacing: 2px;">Trendy Jewellery</h2>
				<h3 style="font-size: 20px;">New paid order received</h3>
				<div style="background: #fafafa; padding: 15px; border-radius: 6px; margin: 20px 0;">
					<p><strong>Order ID:</strong> ${orderId}</p>
					<p><strong>Razorpay Payment Order:</strong> ${razorpayOrderId}</p>
					<p><strong>Total Paid:</strong> ₹${finalAmount}</p>
				</div>
				<p><strong>Customer:</strong> ${name}</p>
				<p><strong>Email:</strong> ${email || "Not provided"}</p>
				<p><strong>Phone:</strong> ${phone}</p>
				<p><strong>Address:</strong> ${address}</p>
				<p><strong>Pincode:</strong> ${pincode}</p>
				<p style="color: #666;">DTDC tracking will be added manually after dispatch.</p>
			</div>`;

		const resend = getResend();
		await resend.emails.send({
			from: 'Trendy Jewellery <onboarding@resend.dev>',
			to: 'rajkrish123321@gmail.com',
			subject: `New paid order: ${orderId}`,
			html: emailHtml,
		});

		if (email) {
			const resend = getResend();
			await resend.emails.send({
				from: 'Trendy Jewellery <onboarding@resend.dev>',
				to: email,
				subject: `Order confirmed: ${orderId}`,
				html: emailHtml,
			});
		}

		return NextResponse.json({ success: true, order_id: orderId });
	} catch (error) {
		console.error("Order Processing Error:", error);
		return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
	}
}
