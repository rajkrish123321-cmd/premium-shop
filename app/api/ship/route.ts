import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { orderId, name, phone, address, pincode, cart } = body;

		// In the future, this is where we send the package weight and dimensions to DTDC/Shiprocket
		// Example: Assuming each jewelry piece weighs 150 grams
		const totalItems = Object.values(cart as Record<string, number>).reduce((a, b) => a + b, 0);
		const totalWeightGrams = totalItems * 150;

		console.log(`📦 Preparing shipment for ${name} to Pincode ${pincode}. Weight: ${totalWeightGrams}g`);

		// Simulate a successful DTDC API response with a Tracking Number
		const fakeAWB = "DTDC" + Math.floor(10000000 + Math.random() * 90000000) + "IN";

		return NextResponse.json({
			success: true,
			courier: "DTDC",
			awb_number: fakeAWB,
			status: "Manifest Generated"
		});
	} catch (error) {
		return NextResponse.json({ error: "Failed to generate shipping label" }, { status: 500 });
	}
}
