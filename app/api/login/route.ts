"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ReceiptDetails() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("order_id") || "TRNDY-SECURE-PAY";
	const tracking = searchParams.get("tracking") || "DTDC98765432IN";

	return (
		<div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#fcfcfc", fontFamily: "sans-serif", padding: "20px" }}>
			<div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", textAlign: "center", maxWidth: "500px", width: "100%", border: "1px solid #eee" }}>
				<div style={{ fontSize: "60px", marginBottom: "20px" }}>📦</div>
				<h1 style={{ color: "#111", fontSize: "28px", fontWeight: "900", marginBottom: "10px" }}>Order Placed &amp; Dispatched!</h1>
				<p style={{ color: "#777", marginBottom: "20px", lineHeight: "1.5" }}>
					Thank you for choosing Trendy Jewellery. Your premium order has been recorded at our Bokaro facility and handed over to DTDC.
				</p>
				<div style={{ background: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #eaeaea", marginBottom: "30px", textAlign: "left" }}>
					<div style={{ marginBottom: "15px" }}>
						<span style={{ color: "#777", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>Order ID</span><br />
						<strong style={{ color: "#111", fontSize: "16px" }}>{orderId}</strong>
					</div>
					<div>
						<span style={{ color: "#777", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>DTDC Tracking Number</span><br />
						<strong style={{ color: "#b38728", fontSize: "18px" }}>{tracking}</strong>
					</div>
				</div>
				<a href="/" style={{ background: "#111", color: "#fff", padding: "15px 30px", textDecoration: "none", borderRadius: "4px", fontWeight: "bold", display: "inline-block" }}>
					Continue Shopping
				</a>
			</div>
		</div>
	);
}

export default function SuccessPage() {
	return (
		<Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#fcfcfc", color: "#b38728", fontSize: "20px", fontWeight: "bold" }}>Loading Receipt...</div>}>
			<ReceiptDetails />
		</Suspense>
	);
}
