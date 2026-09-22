"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const PRODUCTS = [
	["prod_1", "Akruti Collection Oxidised Navratri Damini Maangtikka", 599, "/item1.jpg", "Stunning Oxidised Plated Finish."],
	["prod_2", "Etnico 18k Gold Plated Kundan Kamarband/Waist Chain", 426, "/item2.jpg", "White Stone Studded Belly Chain for Women (B003W)."],
	["prod_3", "Palak Art Heritage Austrian Stone Pearl Necklace Set", 1176, "/item3.jpg", "White Pearl and Beads with Austrian Stone."],
	["prod_4", "Maharani Jewels Oxidised Pota Stone Pearl Jhumki", 305, "/item4.jpg", "Black Pearl Jhumki Earrings."],
	["prod_5", "Darshana Jewels Oxidised Plated Dangler Earrings (Large)", 77, "/item5.jpg", "Oxidised Dangler Earrings."],
	["prod_6", "Darshana Jewels Oxidised Plated Dangler Earrings (Small)", 52, "/item6.jpg", "Oxidised Dangler Earrings."],
] as const;

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Record<string, number>>({});
	const [checkout, setCheckout] = useState(false);
	const [details, setDetails] = useState({ name: "", email: "", phone: "", address: "", pincode: "" });
	const [tax, setTax] = useState({ cgst: 0, sgst: 0, igst: 0, total: 0 });
	const [loading, setLoading] = useState(false);

	const subtotal = PRODUCTS.reduce((sum, [id, , price]) => sum + price * (cart[id] || 0), 0);
	const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
	const setField = (field: keyof typeof details, value: string) => setDetails(d => ({ ...d, [field]: value }));

	const change = (id: string, delta: number) => setCart(old => {
		const product = PRODUCTS.find(p => p[0] === id);
		const next = (old[id] || 0) + delta;
		if (!product || next > 20) return old;
		const result = { ...old };
		if (next > 0) result[id] = next; else delete result[id];
		return result;
	});

	useEffect(() => {
		if (!checkout || details.pincode.length !== 6 || !subtotal) return;
		setLoading(true);
		fetch("/api/calculate-tax", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: subtotal, pincode: details.pincode }) })
			.then(r => r.json()).then(d => setTax({ cgst: d.cgst, sgst: d.sgst, igst: d.igst, total: d.total }))
			.finally(() => setLoading(false));
	}, [checkout, details.pincode, subtotal]);

	const pay = async () => {
		if (!details.name || !details.email || details.phone.length < 10 || !details.address || !tax.total) return;
		const order = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: tax.total }) }).then(r => r.json());
		const Razorpay = (window as any).Razorpay;
		if (!Razorpay) return alert("Payment system loading. Please wait.");
		new Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "TRENDY JEWELLERY", order_id: order.orderId, prefill: { name: details.name, email: details.email, contact: details.phone }, theme: { color: "#d4af37" }, handler: () => { alert("Payment received! Thank you for your order."); setCart({}); setCheckout(false); } }).open();
	};

	const input = (field: keyof typeof details, placeholder: string, type = "text") => <input type={type} placeholder={placeholder} value={details[field]} onChange={e => setField(field, field === "phone" || field === "pincode" ? e.target.value.replace(/\D/g, "") : e.target.value)} maxLength={field === "phone" ? 10 : field === "pincode" ? 6 : undefined} style={styles.input} />;

	return <main style={styles.main}>
		<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
		<header style={styles.header}><h1 onClick={() => setCheckout(false)} style={styles.logo}>TRENDY JEWELLERY</h1><b onClick={() => subtotal && setCheckout(true)} style={{ cursor: subtotal ? "pointer" : "default" }}>🛒 Cart ({count}) - ₹{subtotal.toLocaleString("en-IN")}</b></header>
		<a href="https://wa.me/919279566257" target="_blank" rel="noreferrer" style={styles.whatsapp}>💬 Chat on WhatsApp</a>
		<section style={styles.content}>{!checkout ? <><div style={styles.hero}><h2>Elegance, Redefined.</h2></div><div style={styles.grid}>{PRODUCTS.map(([id, name, price, image, desc]) => <article style={styles.card} key={id}><img src={image} alt={name} style={styles.image} /><div style={{ padding: 24 }}><h3>{name}</h3><p style={{ color: "#777", minHeight: 40 }}>{desc}</p><strong style={styles.price}>₹{price.toLocaleString("en-IN")}</strong>{cart[id] ? <div style={styles.pill}><button onClick={() => change(id, -1)}>−</button>{cart[id]} in cart<button onClick={() => change(id, 1)}>+</button></div> : <div style={styles.actions}><button onClick={() => change(id, 1)}>Add to Cart</button><button onClick={() => { change(id, 1); setCheckout(true); }} className="dark">Buy Now</button></div>}</div></article>)}</div>{subtotal > 0 && <button onClick={() => setCheckout(true)} style={styles.checkout}>Proceed to Checkout (₹{subtotal.toLocaleString("en-IN")})</button>}</> : <div style={styles.form}><button onClick={() => setCheckout(false)} style={styles.back}>← Back to Shop</button><h2>Secure Checkout</h2>{input("name", "Full Name")}{input("email", "Email Address", "email")}{input("phone", "Primary Phone", "tel")}{input("address", "Full Street Address")}{input("pincode", "6-Digit Pincode to Calculate Taxes", "tel")}<div style={styles.summary}>Subtotal: ₹{subtotal.toLocaleString("en-IN")}<br />{tax.igst ? `IGST: ₹${tax.igst.toFixed(2)}` : `CGST: ₹${tax.cgst.toFixed(2)} + SGST: ₹${tax.sgst.toFixed(2)}`}<hr /><b>Grand Total: ₹{tax.total.toFixed(2)}</b></div><button onClick={pay} disabled={loading || !tax.total} style={styles.pay}>{loading ? "Calculating..." : tax.total ? `Pay ₹${tax.total.toFixed(2)} Securely` : "Complete Details to Pay"}</button></div>}</section>
	</main>;
}

const styles: Record<string, React.CSSProperties> = {
	main: { minHeight: "100vh", color: "#111", fontFamily: "sans-serif", background: "#fff" },
	header: { padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fffffff2", zIndex: 2 },
	logo: { color: "#d4af37", letterSpacing: 2, cursor: "pointer", margin: 0 },
	content: { maxWidth: 1200, margin: "auto", padding: "40px 20px" }, hero: { textAlign: "center", marginBottom: 50 },
	grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 40 }, card: { border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }, image: { width: "100%", height: 300, objectFit: "cover" }, price: { color: "#d4af37", fontSize: 22 }, actions: { display: "flex", gap: 10, marginTop: 20 }, pill: { display: "flex", justifyContent: "space-between", background: "#111", color: "#fff", borderRadius: 30, padding: 12, marginTop: 20 }, checkout: { display: "block", margin: "50px auto", padding: "18px 40px", background: "#d4af37", color: "#fff", border: 0, borderRadius: 30, fontWeight: "bold" }, form: { maxWidth: 600, margin: "auto", padding: 40, boxShadow: "0 10px 40px #00000012", borderRadius: 20 }, input: { width: "100%", padding: 14, marginBottom: 16, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }, summary: { background: "#fafafa", padding: 20, lineHeight: 2, margin: "16px 0" }, pay: { width: "100%", padding: 18, background: "#111", color: "#fff", border: 0, borderRadius: 10, fontWeight: "bold" }, back: { background: "none", border: 0, color: "#d4af37", cursor: "pointer" }, whatsapp: { position: "fixed", right: 25, bottom: 25, zIndex: 3, padding: 16, borderRadius: 30, background: "#25d366", color: "white", textDecoration: "none", fontWeight: "bold" }
};
