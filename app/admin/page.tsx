"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase-browser";

type Customer = { id: string; email: string; created_at: string; last_sign_in_at?: string };
type AdminOrder = { id: string | number; user_id: string | null; created_at: string; total_amount: number; status: string | null; customer_name: string | null; customer_email: string | null };

export default function AdminPage() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [orders, setOrders] = useState<AdminOrder[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [signedIn, setSignedIn] = useState(false);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setError("");
		const { error: loginError } = await supabase.auth.signInWithPassword({ email: "trendyjewellery62@gmail.com", password });
		if (loginError) {
			setLoading(false);
			setError("Admin sign-in failed. Check the credentials and Supabase account status.");
			return;
		}
		const { data: sessionData } = await supabase.auth.getSession();
		const response = await fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${sessionData.session?.access_token || ""}` } });
		const result = await response.json();
		setLoading(false);
		if (!response.ok) {
			await supabase.auth.signOut();
			setError(result.error || "Admin access denied.");
			return;
		}
		setCustomers(result.customers || []);
		setOrders(result.orders || []);
		setSignedIn(true);
	};

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push("/");
	};

	if (!signedIn) return <main className="auth-page"><section className="auth-card admin-login-card"><p className="section-kicker">PRIVATE CONSOLE</p><h1>Admin access</h1><p>Restricted to the store administrator.</p><form onSubmit={handleLogin}><label>Admin email<input className="form-input" type="email" value="trendyjewellery62@gmail.com" readOnly /></label><label>Password<input className="form-input" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="checkout-button" type="submit" disabled={loading}>{loading ? "Verifying..." : "Enter console"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}<Link href="/">Return to store</Link></section></main>;

	return <main className="admin-page"><section className="admin-shell"><header className="admin-header"><div><p className="section-kicker">PRIVATE CONSOLE</p><h1>Customer overview</h1><p>Customer passwords are never visible or retrievable.</p></div><button className="dashboard-logout" type="button" onClick={handleLogout}>Log out</button></header><div className="admin-stats"><div><strong>{customers.length}</strong><span>Accounts</span></div><div><strong>{orders.length}</strong><span>Orders</span></div><div><strong>₹{orders.reduce((total, order) => total + Number(order.total_amount || 0), 0).toLocaleString("en-IN")}</strong><span>Recorded value</span></div></div><section className="admin-panel"><h2>Customers</h2><div className="admin-table"><div className="admin-table-row admin-table-head"><span>Email</span><span>Joined</span><span>Last sign-in</span></div>{customers.map(customer => <div className="admin-table-row" key={customer.id}><span>{customer.email}</span><span>{new Date(customer.created_at).toLocaleDateString("en-IN")}</span><span>{customer.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleDateString("en-IN") : "Not yet"}</span></div>)}</div></section><section className="admin-panel"><h2>Recent orders</h2><div className="admin-table">{orders.slice(0, 20).map(order => <div className="admin-table-row" key={order.id}><span>#{order.id}<small>{order.customer_email || order.customer_name || "Guest order"}</small></span><span>₹{Number(order.total_amount).toLocaleString("en-IN")}</span><span>{order.status || "processing"}</span></div>)}</div></section></section></main>;
}