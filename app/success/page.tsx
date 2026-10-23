"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

type Receipt = {
	orderId: string;
	customerName: string;
	customerEmail: string;
	createdAt: string;
	amount: number;
	items: Array<{ id: string; name: string; image: string; unitPrice: number; quantity: number; lineTotal: number }>;
};

function SuccessContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const orderId = searchParams.get("order_id") || "";
	const [paymentStatus, setPaymentStatus] = useState<"checking" | "pending" | "paid" | "failed" | "error">("checking");
	const [receipt, setReceipt] = useState<Receipt | null>(null);
	const [receiptStatus, setReceiptStatus] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		if (!orderId) return;

		let active = true;
		let attempts = 0;
		let timer: ReturnType<typeof setTimeout>;
		const checkPayment = async () => {
			try {
				const response = await fetch(`/api/checkout/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
				const result = await response.json();
				if (!response.ok) throw new Error(result.error || "Unable to confirm payment yet.");
				if (!active) return;
				setPaymentStatus(result.paymentStatus);
				if (result.paymentStatus === "paid") {
					setReceipt(result.receipt);
					setReceiptStatus(result.receiptStatus);
					return;
				}
				setErrorMessage("");
			} catch (error) {
				if (!active) return;
				setPaymentStatus("error");
				setErrorMessage(error instanceof Error ? error.message : "Unable to confirm payment yet.");
			}

			attempts += 1;
			if (active && attempts < 60) timer = setTimeout(checkPayment, 2500);
		};

		void checkPayment();
		return () => {
			active = false;
			clearTimeout(timer);
		};
	}, [orderId]);

	useEffect(() => {
		if (paymentStatus !== "paid" || !receipt) return;
		const timer = setTimeout(() => router.push("/"), 4000);
		return () => clearTimeout(timer);
	}, [paymentStatus, receipt, router]);

	const visiblePaymentStatus = orderId ? paymentStatus : "error";
	const visibleErrorMessage = orderId ? errorMessage : "No order reference was provided. Check your order history or contact the store.";

	if (visiblePaymentStatus === "paid" && receipt) {
		const emailMessage = receiptStatus === "sent" || receiptStatus === "already_sent"
			? `A copy was sent to ${receipt.customerEmail}.`
			: receiptStatus === "sender_not_configured"
				? "Your payment is confirmed. Email receipts are not configured, so this on-page receipt is ready to print."
				: "Your payment is confirmed. Email delivery was not accepted, but this on-page receipt is ready to print.";
		return <main className="success-page"><motion.section className="success-card receipt-card" aria-live="polite" initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
			<motion.div className="success-mark" aria-hidden="true" initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ duration: 0.4, ease: "backOut" }}>✓</motion.div>
			<p className="success-eyebrow">Payment successful</p>
			<h1>Thank you, {receipt.customerName}</h1>
			<p className="success-copy">Your order is confirmed. We will arrange shipping and share tracking details after dispatch.</p>
			<div className="order-id-box"><span>Order ID</span><strong>{receipt.orderId}</strong></div>
			<div className="receipt-details"><div><span>Paid to</span><strong>Trendy Jewellery</strong></div><div><span>Date</span><strong>{new Date(receipt.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</strong></div><div><span>Payment</span><strong>PhonePe · Confirmed</strong></div></div>
			<div className="receipt-items"><h2>Order receipt</h2>{receipt.items.map(item => <div className="receipt-item" key={item.id}><Image src={item.image} alt={item.name} width={52} height={52} /><span>{item.name}<small>₹{item.unitPrice.toLocaleString("en-IN")} × {item.quantity}</small></span><strong>₹{item.lineTotal.toLocaleString("en-IN")}</strong></div>)}<div className="receipt-total"><span>Total paid</span><strong>₹{receipt.amount.toLocaleString("en-IN")}</strong></div></div>
			<p className={`receipt-status ${receiptStatus === "sent" || receiptStatus === "already_sent" ? "receipt-status-sent" : "receipt-status-pending"}`}>{emailMessage}</p>
			<div className="receipt-actions"><button className="success-button" type="button" onClick={() => window.print()}>Print receipt</button><Link className="success-button" href="/">Continue shopping</Link></div>
			<p className="redirect-copy">Returning to the store shortly</p>
			<div className="success-redirect-track" aria-hidden="true"><motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 4, ease: "linear" }} /></div>
		</motion.section></main>;
	}

	const failed = visiblePaymentStatus === "failed";
	return <main className="success-page"><section className="success-card" aria-live="polite">
		<div className={`success-mark${failed ? " success-mark-failed" : ""}`} aria-hidden="true">{failed ? "!" : "…"}</div>
		<p className="success-eyebrow">{failed ? "Payment not completed" : visiblePaymentStatus === "checking" ? "Confirming payment" : "Payment processing"}</p>
		<h1>{failed ? "Your order is not paid" : visiblePaymentStatus === "checking" ? "Checking with PhonePe" : "Waiting for confirmation"}</h1>
		<p className="success-copy">{failed ? "PhonePe reports this payment did not complete. You can return to the store and try checkout again." : visibleErrorMessage || "We are checking the payment directly with PhonePe. Please keep this page open; your order will not be marked paid until confirmation arrives."}</p>
		{orderId && <div className="order-id-box"><span>Order ID</span><strong>{orderId}</strong></div>}
		{visiblePaymentStatus === "error" && <button className="success-button" type="button" onClick={() => window.location.reload()}>Check again</button>}
		<Link className="success-button" href="/">Return to store</Link>
	</section></main>;
}

export default function SuccessPage() {
	return <Suspense fallback={<main className="success-page"><section className="success-card"><p className="success-eyebrow">Confirming your order</p><h1>Please wait...</h1></section></main>}><SuccessContent /></Suspense>;
}
