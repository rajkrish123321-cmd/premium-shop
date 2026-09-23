"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("order_id") || "Pending";

	return (
		<main className="success-page">
			<section className="success-card" aria-live="polite">
				<div className="success-mark" aria-hidden="true">✓</div>
				<p className="success-eyebrow">Payment successful</p>
				<h1>Your order is placed</h1>
				<p className="success-copy">Thank you for shopping with Trendy Jewellery. We have received your order and shipping details.</p>
				<div className="order-id-box">
					<span>Order ID</span>
					<strong>{orderId}</strong>
				</div>
				<p className="manual-shipping-note">Our team will arrange DTDC shipping manually and share tracking details after dispatch.</p>
				<Link className="success-button" href="/">Continue shopping</Link>
			</section>
		</main>
	);
}

export default function SuccessPage() {
	return (
		<Suspense fallback={<main className="success-page"><section className="success-card"><p className="success-eyebrow">Confirming your order</p><h1>Please wait...</h1></section></main>}>
			<SuccessContent />
		</Suspense>
	);
}
