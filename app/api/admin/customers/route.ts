import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseServiceRoleKey, supabaseUrl } from "../../../../lib/supabase-config";

const ADMIN_EMAIL = "trendyjewellery62@gmail.com";

export async function GET(request: Request) {
	const authorization = request.headers.get("authorization");
	const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
	if (!accessToken || !supabaseServiceRoleKey) return NextResponse.json({ error: "Admin service is not configured" }, { status: 503 });

	try {
		const authClient = createClient(supabaseUrl, supabasePublishableKey);
		const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
		if (authError || authData.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
			return NextResponse.json({ error: "Admin access denied" }, { status: 403 });
		}

		const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
		const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
		if (usersError) throw usersError;
		const { data: orders, error: ordersError } = await adminClient
			.from("orders")
			.select("id, user_id, created_at, total_amount, status, customer_name, customer_email")
			.order("created_at", { ascending: false });
		if (ordersError) throw ordersError;

		return NextResponse.json({
			customers: usersData.users.map(user => ({
				id: user.id,
				email: user.email || "",
				created_at: user.created_at,
				last_sign_in_at: user.last_sign_in_at,
			})),
			orders: orders || [],
		});
	} catch (error) {
		console.error("Admin customer lookup error:", error);
		return NextResponse.json({ error: "Unable to load customer details" }, { status: 500 });
	}
}
