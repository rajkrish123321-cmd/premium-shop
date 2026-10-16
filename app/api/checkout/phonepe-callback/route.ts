import { NextResponse } from "next/server";

import { verifyPhonePeCallback } from "@/lib/phonepe";

export async function POST(request: Request) {
	try {
		const body: unknown = await request.json();
		if (typeof body !== "object" || body === null || !("response" in body) || typeof body.response !== "string") {
			return NextResponse.json({ error: "Invalid PhonePe callback payload." }, { status: 400 });
		}

		const checksum = request.headers.get("x-verify") || "";
		if (!verifyPhonePeCallback(body.response, checksum)) {
			return NextResponse.json({ error: "PhonePe callback signature is invalid." }, { status: 401 });
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("PhonePe callback validation failed:", error instanceof Error ? error.message : "Unknown error");
		return NextResponse.json({ error: "Unable to validate PhonePe callback." }, { status: 400 });
	}
}