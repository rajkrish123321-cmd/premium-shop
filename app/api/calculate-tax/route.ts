import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	try {
		const { amount, pincode } = await req.json();
		const isIntrastate =
			pincode.startsWith('81') ||
			pincode.startsWith('82') ||
			pincode.startsWith('83');
		const totalTaxRate = 0.18;
		const totalTaxAmount = amount * totalTaxRate;

		if (isIntrastate) {
			return NextResponse.json({
				cgst: totalTaxAmount / 2,
				sgst: totalTaxAmount / 2,
				igst: 0,
				total: amount + totalTaxAmount,
			});
		}

		return NextResponse.json({
			cgst: 0,
			sgst: 0,
			igst: totalTaxAmount,
			total: amount + totalTaxAmount,
		});
	} catch (error) {
		return NextResponse.json({ error: 'Invalid data parameters' }, { status: 400 });
	}
}
