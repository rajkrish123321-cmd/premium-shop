"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

type Customer = { id: string; email: string; name: string; createdAt: string; lastSignInAt?: string };
type AdminOrder = { id: string | number; userId: string | null; createdAt: string; totalAmount: number; status: string | null; customerName: string | null; customerEmail: string | null };

export default function AdminPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const [email, setEmail] = useState("trendyjewellery62@gmail.com");
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

		const signInResult = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		if (signInResult?.error) {
			setLoading(false);
			setError("Admin sign-in failed. Check the password and admin configuration.");
			return;
		}

		const response = await fetch("/api/admin/customers");
		const result = await response.json();
		setLoading(false);
		if (!response.ok) {
			await signOut({ callbackUrl: "/admin" });
			setError(result.error || "Admin access denied.");
			return;
		}
		setCustomers(result.customers || []);
		setOrders(result.orders || []);
		setSignedIn(true);
	};

	const handleLogout = async () => {
		await signOut({ callbackUrl: "/admin" });
		router.push("/");
	};

	if (status === "loading") return <main className="auth-page"><section className="auth-card admin-login-card"><p className="section-kicker">PRIVATE CONSOLE</p><h1>Admin access</h1><p>Checking session...</p></section></main>;

	if (!signedIn && !session) return <main className="auth-page"><section className="auth-card admin-login-card"><p className="section-kicker">PRIVATE CONSOLE</p><h1>Admin access</h1><p>Restricted to the store administrator.</p><form onSubmit={handleLogin}><label>Admin email<input className="form-input" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input className="form-input" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="checkout-button" type="submit" disabled={loading}>{loading ? "Verifying..." : "Enter console"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}<Link href="/">Return to store</Link></section></main>;

	return <main className="admin-page"><section className="admin-shell"><header className="admin-header"><div><p className="section-kicker">PRIVATE CONSOLE</p><h1>Customer overview</h1><p>Customer passwords are never visible or retrievable.</p></div><button className="dashboard-logout" type="button" onClick={handleLogout}>Log out</button></header><div className="admin-stats"><div><strong>{customers.length}</strong><span>Accounts</span></div><div><strong>{orders.length}</strong><span>Orders</span></div><div><strong>₹{orders.reduce((total, order) => total + Number(order.totalAmount || 0), 0).toLocaleString("en-IN")}</strong><span>Recorded value</span></div></div><section className="admin-panel"><h2>Customers</h2><div className="admin-table"><div className="admin-table-row admin-table-head"><span>Customer</span><span>Email</span><span>Last sign-in</span></div>{customers.map(customer => <div className="admin-table-row" key={customer.id}><span><strong>{customer.name || "Customer"}</strong><small>Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "Recently"}</small></span><span>{customer.email}</span><span>{customer.lastSignInAt ? new Date(customer.lastSignInAt).toLocaleDateString("en-IN") : "Not yet"}</span></div>)}</div></section><section className="admin-panel"><h2>Recent orders</h2><div className="admin-table">{orders.slice(0, 20).map(order => <div className="admin-table-row" key={String(order.id)}><span>#{order.id}<small>{order.customerEmail || order.customerName || "Guest order"}</small></span><span>₹{Number(order.totalAmount).toLocaleString("en-IN")}</span><span>{order.status || "processing"}</span></div>)}</div></section></section></main>;
}