"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

type Order = {
	id: string | number;
	createdAt: string;
	totalAmount: number;
	status: string | null;
};

export default function DashboardPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (status === "loading") return;
		if (!session) {
			router.push("/login");
			return;
		}

		const fetchOrders = async () => {
			try {
				const response = await fetch("/api/orders");
				const data = await response.json();
				if (!response.ok) throw new Error(data.error || "Order history request failed.");
				setOrders(data.orders || []);
			} catch (dashboardError) {
				console.error(dashboardError);
				setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load your orders.");
			} finally {
				setLoading(false);
			}
		};

		fetchOrders();
	}, [router, session, status]);

	const handleLogout = async () => {
		await signOut({ callbackUrl: "/login" });
	};

	if (loading || status === "loading") return <main className="dashboard-page"><p className="dashboard-loading">Loading your dashboard...</p></main>;

	const displayName = session?.user?.name?.trim() || "Customer";
	const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
	return <main className="dashboard-page"><section className="dashboard-shell"><header className="dashboard-header"><div className="dashboard-welcome"><span className="dashboard-avatar">{initials}</span><div><p className="section-kicker">CUSTOMER ACCOUNT</p><h1>Welcome, {initials}</h1><p>{displayName}<span className="dashboard-email">{session?.user?.email}</span></p></div></div><button className="dashboard-logout" type="button" onClick={handleLogout}>Log out</button></header><div className="dashboard-heading"><div><p className="section-kicker">YOUR PURCHASES</p><h2>Order history</h2></div><Link className="dashboard-shop-link" href="/">Continue shopping</Link></div>{error ? <p className="auth-error" role="alert">{error}</p> : orders.length === 0 ? <div className="dashboard-empty"><h3>No orders yet</h3><p>You have not placed a purchase yet. Explore our handcrafted collection to make your first order.</p><Link className="success-button" href="/">Explore the collection</Link></div> : <div className="dashboard-orders">{orders.map(order => { const status = (order.status || "processing").toLowerCase(); const isComplete = status === "paid" || status === "delivered"; return <article className="dashboard-order" key={String(order.id)}><div><h3>Order #{order.id}</h3><p>Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div><div className="dashboard-order-total"><strong>₹{Number(order.totalAmount).toLocaleString("en-IN")}</strong><span className={isComplete ? "order-status order-status-complete" : "order-status"}>{status}</span></div></article>; })}</div>}</section></main>;
}
