"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

type Customer = { id: string; email: string; name: string; createdAt: string; lastSignInAt?: string };
type AdminOrder = { id: string; userId: string | null; createdAt: string; totalAmount: number; status: string | null; paymentStatus: string; customerName: string | null; customerEmail: string | null; shippingAddress: string; pincode: string; refundedAmountPaise: number; latestRefundStatus: string | null };

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
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
	const [refundBusyId, setRefundBusyId] = useState<string | null>(null);
	const [notice, setNotice] = useState("");

	const loadAdminData = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/admin/customers", { cache: "no-store" });
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Unable to load admin data.");
			setCustomers(result.customers || []);
			setOrders(result.orders || []);
			setSignedIn(true);
			setError("");
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : "Unable to load admin data.");
			setSignedIn(false);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (session?.user?.role !== "admin") return;
		const initialLoad = window.setTimeout(() => void loadAdminData(), 0);
		const refreshTimer = window.setInterval(() => void loadAdminData(), 30000);
		return () => {
			window.clearTimeout(initialLoad);
			window.clearInterval(refreshTimer);
		};
	}, [session?.user?.role]);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setError("");

		let signInResult;
		try {
			signInResult = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});
		} catch {
			setLoading(false);
			setError("Admin sign-in is temporarily unavailable. Please try again.");
			return;
		}

		if (signInResult?.error) {
			setLoading(false);
			setError("Admin sign-in failed. Check the password and admin configuration.");
			return;
		}

		await loadAdminData();
		setLoading(false);
	};

	const handleLogout = async () => {
		await signOut({ callbackUrl: "/admin" });
		router.push("/");
	};

	const initiateRefund = async (order: AdminOrder) => {
		const refundable = Math.max(0, order.totalAmount - order.refundedAmountPaise / 100);
		const amountText = window.prompt(`Refund up to ₹${refundable.toLocaleString("en-IN")} for order #${order.id}. Enter the amount in rupees.`, String(refundable));
		if (amountText === null) return;
		const amount = Number(amountText);
		if (!Number.isFinite(amount) || amount <= 0 || amount > refundable) {
			setError("Enter a valid amount no greater than the remaining refundable balance.");
			return;
		}
		setRefundBusyId(order.id);
		setError("");
		setNotice("");
		try {
			const response = await fetch("/api/admin/refunds", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId: order.id, amount }),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Could not start the refund.");
			setNotice(`Refund request ${result.merchantRefundId} is ${result.status}. Customer email is sent after PhonePe confirms completion.`);
			await loadAdminData();
		} catch (refundError) {
			setError(refundError instanceof Error ? refundError.message : "Could not start the refund.");
		} finally {
			setRefundBusyId(null);
		}
	};

	const filteredOrders = orders.filter(order => {
		const matchesSearch = `${order.id} ${order.customerName || ""} ${order.customerEmail || ""}`.toLowerCase().includes(search.toLowerCase());
		return matchesSearch && (statusFilter === "all" || order.paymentStatus === statusFilter);
	});

	if (status === "loading" || (session?.user?.role === "admin" && !signedIn && loading)) return <main className="auth-page"><section className="auth-card admin-login-card"><p className="section-kicker">PRIVATE CONSOLE</p><h1>Admin access</h1><p>Checking session...</p></section></main>;

	if (!signedIn && session?.user?.role !== "admin") return <main className="auth-page"><section className="auth-card admin-login-card"><p className="section-kicker">PRIVATE CONSOLE</p><h1>Admin access</h1><p>Restricted to the store administrator.</p><form onSubmit={handleLogin}><label>Admin email<input className="form-input" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input className="form-input" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="checkout-button" type="submit" disabled={loading}>{loading ? "Verifying..." : "Enter console"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}<Link href="/">Return to store</Link></section></main>;

	return <main className="admin-page"><section className="admin-shell"><header className="admin-header"><div><p className="section-kicker">PRIVATE CONSOLE</p><h1>Store operations</h1><p>Live order ledger, fulfillment details and payment refunds.</p></div><button className="dashboard-logout" type="button" onClick={handleLogout}>Log out</button></header><div className="admin-stats"><div><strong>{customers.length}</strong><span>Accounts</span></div><div><strong>{orders.length}</strong><span>Orders</span></div><div><strong>₹{orders.filter(order => order.paymentStatus === "paid").reduce((total, order) => total + Number(order.totalAmount || 0), 0).toLocaleString("en-IN")}</strong><span>Paid value</span></div><div><strong>{orders.filter(order => order.paymentStatus === "paid" && order.refundedAmountPaise > 0).length}</strong><span>Orders with refunds</span></div></div>{error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="auth-message" role="status">{notice}</p>}<section className="admin-panel"><h2>Live orders</h2><div className="admin-order-tools"><input className="form-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search order, name or email" aria-label="Search orders" /><select className="form-input" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Filter by payment status"><option value="all">All payment states</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="awaiting_verification">Awaiting verification</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select><button className="admin-refresh" type="button" onClick={() => void loadAdminData()} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button></div><div className="admin-order-list">{filteredOrders.map(order => { const refundable = Math.max(0, order.totalAmount - order.refundedAmountPaise / 100); const expanded = expandedOrderId === order.id; return <article className="admin-order-card" key={order.id}><div className="admin-order-summary"><div><strong>#{order.id}</strong><span>{order.customerName || "Guest"} · {order.customerEmail || "No email"}</span><small>{new Date(order.createdAt).toLocaleString("en-IN")}</small></div><div><strong>₹{Number(order.totalAmount).toLocaleString("en-IN")}</strong><span className={`admin-status admin-status-${order.paymentStatus}`}>{order.paymentStatus.replaceAll("_", " ")}</span></div><div><strong>Refunded ₹{(order.refundedAmountPaise / 100).toLocaleString("en-IN")}</strong><span>{order.latestRefundStatus ? `Latest: ${order.latestRefundStatus}` : "No refund"}</span></div><div className="admin-order-actions"><button type="button" onClick={() => setExpandedOrderId(expanded ? null : order.id)}>{expanded ? "Hide details" : "View details"}</button><button type="button" className="admin-refund-button" disabled={order.paymentStatus !== "paid" || refundable < 1 || refundBusyId === order.id} onClick={() => void initiateRefund(order)}>{refundBusyId === order.id ? "Requesting..." : refundable < 1 ? "Fully refunded" : "Refund"}</button></div></div>{expanded && <div className="admin-order-details"><div><small>Shipping address</small><strong>{order.shippingAddress || "Not recorded"}</strong></div><div><small>Delivery pincode</small><strong>{order.pincode || "Not recorded"}</strong></div><div><small>Payment state</small><strong>{order.paymentStatus}</strong></div><div><small>Refund balance</small><strong>₹{refundable.toLocaleString("en-IN")}</strong></div></div>}</article>; })}{filteredOrders.length === 0 && <p className="admin-empty-state">No orders match this search.</p>}</div></section><section className="admin-panel"><h2>Customers</h2><div className="admin-table"><div className="admin-table-row admin-table-head"><span>Customer</span><span>Email</span><span>Last sign-in</span></div>{customers.map(customer => <div className="admin-table-row" key={customer.id}><span><strong>{customer.name || "Customer"}</strong><small>Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "Recently"}</small></span><span>{customer.email}</span><span>{customer.lastSignInAt ? new Date(customer.lastSignInAt).toLocaleDateString("en-IN") : "Not yet"}</span></div>)}</div></section></section></main>;
}