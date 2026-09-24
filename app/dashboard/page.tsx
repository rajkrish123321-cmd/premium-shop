"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL || "https://j36YzXcDP5xthE.supabase.co",
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_placeholder",
);

type Order = {
	id: string | number;
	created_at: string;
	total_amount: number;
	status: string | null;
};

export default function DashboardPage() {
	const router = useRouter();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [userEmail, setUserEmail] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchSessionAndOrders = async () => {
			try {
				const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
				const session = sessionData.session;
				if (sessionError || !session) {
					router.push("/login");
					return;
				}

				setUserEmail(session.user.email || "");
				const response = await fetch("/api/orders", {
					headers: { Authorization: `Bearer ${session.access_token}` },
				});
				const data = await response.json();
				if (!response.ok) throw new Error(data.error || "Failed to fetch order history.");
				setOrders(data.orders || []);
			} catch (dashboardError) {
				console.error(dashboardError);
				setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load your orders.");
			} finally {
				setLoading(false);
			}
		};

		fetchSessionAndOrders();
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push("/login");
	};

	if (loading) return <main className="dashboard-page"><p className="dashboard-loading">Loading your dashboard...</p></main>;

	return <main className="dashboard-page"><section className="dashboard-shell"><header className="dashboard-header"><div><p className="section-kicker">CUSTOMER ACCOUNT</p><h1>Trendy Jewellery</h1><p>Welcome back, <strong>{userEmail}</strong></p></div><button className="dashboard-logout" type="button" onClick={handleLogout}>Log out</button></header><div className="dashboard-heading"><div><p className="section-kicker">YOUR PURCHASES</p><h2>Order history</h2></div><Link className="dashboard-shop-link" href="/">Continue shopping</Link></div>{error ? <p className="auth-error" role="alert">{error}</p> : orders.length === 0 ? <div className="dashboard-empty"><h3>No orders yet</h3><p>You have not placed a purchase yet. Explore our handcrafted collection to make your first order.</p><Link className="success-button" href="/">Explore the collection</Link></div> : <div className="dashboard-orders">{orders.map(order => { const status = (order.status || "processing").toLowerCase(); const isComplete = status === "paid" || status === "delivered"; return <article className="dashboard-order" key={order.id}><div><h3>Order #{order.id}</h3><p>Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div><div className="dashboard-order-total"><strong>₹{Number(order.total_amount).toLocaleString("en-IN")}</strong><span className={isComplete ? "order-status order-status-complete" : "order-status"}>{status}</span></div></article>; })}</div>}</section></main>;
}
