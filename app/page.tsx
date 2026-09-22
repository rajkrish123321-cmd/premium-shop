"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// We separate the actual receipt into a component
function ReceiptDetails() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("order_id");
	const tracking = searchParams.get("tracking");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setLoading(false), 1500);
		return () => clearTimeout(timer);
	}, []);

	if (loading) {
		return (
			<div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#fcfcfc", color: "#b38728", fontSize: "20px", fontWeight: "bold" }}>
				Finalizing your order and generating DTDC AWB...
			</div>
		);
	}

	return (
		<div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#fcfcfc", fontFamily: "sans-serif" }}>
			<div style={{ background: "white", padding: "50px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", textAlign: "center", maxWidth: "500px", border: "1px solid #eee" }}>
				<div style={{ fontSize: "60px", marginBottom: "20px" }}>📦</div>
				<h1 style={{ color: "#111", fontSize: "28px", fontWeight: "900", marginBottom: "10px" }}>Order Dispatched!</h1>
				<p style={{ color: "#777", marginBottom: "20px", lineHeight: "1.5" }}>
					Thank you for choosing Trendy Jewellery. Your premium order is being packed at our Bokaro facility and will be shipped via DTDC.
				</p>

				<div style={{ background: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #eaeaea", marginBottom: "30px", textAlign: "left" }}>
					<div style={{ marginBottom: "15px" }}>
						<span style={{ color: "#777", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>Order ID</span><br />
						<strong style={{ color: "#111", fontSize: "16px" }}>{orderId || "TRNDY-SECURE-PAY"}</strong>
					</div>
					<div>
						<span style={{ color: "#777", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>DTDC Tracking Number</span><br />
						<strong style={{ color: "#b38728", fontSize: "18px" }}>{tracking || "Generating..."}</strong>
					</div>
				</div>

				<a href="/" style={{ background: "#111", color: "#fff", padding: "15px 30px", textDecoration: "none", borderRadius: "4px", fontWeight: "bold", display: "inline-block" }}>
					Continue Shopping
				</a>
			</div>
		</div>
	);
}

// VERCEL FIX: We must wrap the URL-reading component in Suspense
export default function SuccessPage() {
	return (
		<Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#fcfcfc", color: "#b38728", fontSize: "20px", fontWeight: "bold" }}>Loading Secure Receipt...</div>}>
			<ReceiptDetails />
		</Suspense>
	);
}
