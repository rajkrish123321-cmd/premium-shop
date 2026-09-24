import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "../../../../lib/supabase-config";

const getSupabase = () => createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
	try {
		const { email } = await request.json();
		if (typeof email !== "string" || !email.trim()) {
			return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
		}

		const redirectTo = new URL("/reset-password", request.url).toString();
		const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo });
		if (error) {
			console.error("Reset request failed:", error.message);
			return NextResponse.json({ error: "Unable to send the password reset email" }, { status: 400 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Forgot password error:", error);
		return NextResponse.json({ error: "Unable to process the password reset request" }, { status: 500 });
	}
}
