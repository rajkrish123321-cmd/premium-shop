import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabase = (accessToken: string) => createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL || "https://j36YzXcDP5xthE.supabase.co",
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_placeholder",
	{ global: { headers: { Authorization: `Bearer ${accessToken}` } } },
);

export async function GET(request: Request) {
	const authorization = request.headers.get("authorization");
	const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
	if (!accessToken) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

	try {
		const supabase = getSupabase(accessToken);
		const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
		if (authError || !authData.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

		const { data: orders, error } = await supabase
			.from("orders")
			.select("id, created_at, total_amount, status")
			.eq("user_id", authData.user.id)
			.order("created_at", { ascending: false });
		if (error) throw error;

		return NextResponse.json({ orders: orders || [] });
	} catch (error) {
		console.error("Order history error:", error);
		return NextResponse.json({ error: "Unable to load order history" }, { status: 500 });
	}
}
