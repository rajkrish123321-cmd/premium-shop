"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type Product = { id: string; name: string; price: number; stock: number; image: string; desc: string };

const PRODUCTS: Product[] = [
	{ id: "prod_1", name: "Akruti Collection Oxidised Navratri Damini Maangtikka", price: 599, stock: 20, image: "/item1.jpg", desc: "Stunning Oxidised Plated Finish." },
	{ id: "prod_2", name: "Etnico 18k Gold Plated Kundan Kamarband/Waist Chain", price: 426, stock: 20, image: "/item2.jpg", desc: "White Stone Studded Belly Chain for Women." },
	{ id: "prod_3", name: "Palak Art Heritage Austrian Stone Pearl Necklace Set", price: 1176, stock: 20, image: "/item3.jpg", desc: "White Pearl and Beads with Austrian Stone." },
	{ id: "prod_4", name: "Maharani Jewels Oxidised Pota Stone Pearl Jhumki", price: 305, stock: 20, image: "/item4.jpg", desc: "Black Pearl Jhumki Earrings." },
	{ id: "prod_5", name: "Darshana Jewels Oxidised Plated Dangler Earrings (Large)", price: 77, stock: 20, image: "/item5.jpg", desc: "Oxidised Dangler Earrings." },
	{ id: "prod_6", name: "Darshana Jewels Oxidised Plated Dangler Earrings (Small)", price: 52, stock: 20, image: "/item6.jpg", desc: "Oxidised Dangler Earrings." },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Record<string, number>>({});
	const [checkout, setCheckout] = useState(false);
	const [details, setDetails] = useState({ name: "", email: "", phone: "", altPhone: "", address: "", landmark: "", pincode: "" });
	const [tax, setTax] = useState({ cgst: 0, sgst: 0, igst: 0, total: 0 });
	const [calculated, setCalculated] = useState(false);
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("");

	const subtotal = Object.entries(cart).reduce((sum, [id, quantity]) => {
		const product = PRODUCTS.find((item) => item.id === id);
		return sum + (product?.price ?? 0) * quantity;
	}, 0);
	const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

	const calculateTax = async (pincode: string) => {
		if (pincode.length !== 6 || !subtotal) { setCalculated(false); return; }
		setLoading(true);
		try {
			const response = await fetch("/api/calculate-tax", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: subtotal, pincode }) });
			const data = await response.json();
			setTax({ cgst: data.cgst ?? 0, sgst: data.sgst ?? 0, igst: data.igst ?? 0, total: data.total ?? subtotal });
			setCalculated(true);
		} catch { setCalculated(false); }
		finally { setLoading(false); }
	};

	useEffect(() => { if (checkout) void calculateTax(details.pincode); }, [subtotal, checkout]);

	const changeQuantity = (id: string, delta: number) => setCart((current) => {
		const product = PRODUCTS.find((item) => item.id === id);
		const quantity = (current[id] ?? 0) + delta;
		if (!product || quantity > product.stock) { alert(`Only ${product?.stock ?? 0} available.`); return current; }
		const next = { ...current };
		if (quantity > 0) next[id] = quantity; else delete next[id];
		return next;
	});

	const update = (key: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [key]: value }));
	const complete = Boolean(details.name && details.email && details.phone.length >= 10 && details.address && calculated);

	const pay = async () => {
		if (!complete || !(window as any).Razorpay) return;
		setStatus("Initializing secure checkout...");
		try {
			const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: tax.total }) });
			const order = await response.json();
			new (window as any).Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId, name: "TRENDY JEWELLERY", prefill: { name: details.name, email: details.email, contact: details.phone }, theme: { color: "#d4af37" }, handler: async (result: any) => {
				const verified = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
				if ((await verified.json()).success) { alert(`Payment verified! Order ID: ${result.razorpay_payment_id}`); setCart({}); setCheckout(false); }
			} }).open();
		} catch { setStatus("Payment error. Please try again."); }
	};

	const input = (key: keyof typeof details, placeholder: string, type = "text") => <input type={type} placeholder={placeholder} value={details[key]} onChange={(event) => update(key, key === "phone" || key === "altPhone" || key === "pincode" ? event.target.value.replace(/\D/g, "") : event.target.value)} maxLength={key === "pincode" ? 6 : key === "phone" || key === "altPhone" ? 10 : undefined} style={styles.input} />;

	return <main style={styles.main}>
		<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
		<header style={styles.header}><h1 onClick={() => setCheckout(false)} style={styles.logo}>TRENDY JEWELLERY</h1><b onClick={() => subtotal && setCheckout(true)} style={{ cursor: subtotal ? "pointer" : "default" }}>🛒 Cart ({count}) - {money(subtotal)}</b></header>
		<a href="https://wa.me/919279566257" target="_blank" rel="noreferrer" style={styles.whatsapp}>💬 Chat on WhatsApp</a>
		<section style={styles.content}>{!checkout ? <><h2 style={styles.title}>Elegance, Redefined.</h2><div style={styles.grid}>{PRODUCTS.map((product) => <article key={product.id} style={styles.card}><img src={product.image} alt={product.name} style={styles.image} /><div style={styles.body}><h3>{product.name}</h3><p style={{ color: "#777", minHeight: 40 }}>{product.desc}</p><strong style={styles.price}>{money(product.price)}</strong>{cart[product.id] ? <div style={styles.quantity}><button onClick={() => changeQuantity(product.id, -1)}>−</button><b>{cart[product.id]} in cart</b><button onClick={() => changeQuantity(product.id, 1)}>+</button></div> : <div style={styles.actions}><button onClick={() => changeQuantity(product.id, 1)} style={styles.add}>Add to Cart</button><button onClick={() => { changeQuantity(product.id, 1); setCheckout(true); }} style={styles.buy}>Buy Now</button></div>}</div></article>)}</div>{subtotal > 0 && <button onClick={() => setCheckout(true)} style={styles.checkout}>Proceed to Checkout ({money(subtotal)})</button>}</> : <div style={styles.form}><button onClick={() => setCheckout(false)} style={styles.back}>← Back to Shop</button><h2>Secure Checkout</h2>{Object.entries(cart).map(([id, quantity]) => { const product = PRODUCTS.find((item) => item.id === id)!; return <div key={id} style={styles.line}><span>{product.name}<br />{money(product.price)}</span><span><button onClick={() => changeQuantity(id, -1)}>−</button> {quantity} <button onClick={() => changeQuantity(id, 1)}>+</button></span></div>; })}<div>{input("name", "Full Name")}{input("email", "Email Address", "email")}{input("phone", "Primary Phone", "tel")}{input("altPhone", "Alternate Phone (Optional)", "tel")}{input("address", "Full Street Address")}{input("landmark", "Nearby Location / Landmark (Optional)")}{<input {...({} as any)} />}{<input type="text" placeholder="6-Digit Pincode to Calculate Taxes" value={details.pincode} onChange={(event) => { const value = event.target.value.replace(/\D/g, ""); update("pincode", value); void calculateTax(value); }} maxLength={6} style={styles.input} />}</div><div style={styles.total}>Subtotal: {money(subtotal)}<br />Taxes: {calculated ? money(tax.total - subtotal) : "Enter pincode"}<hr /><b>Grand Total: {money(calculated ? tax.total : subtotal)}</b></div><button disabled={!complete || loading} onClick={pay} style={{ ...styles.buy, width: "100%", opacity: complete ? 1 : .5 }}>{status || "Pay Securely"}</button></div>}</section>
	</main>;
}

const styles: Record<string, React.CSSProperties> = { main: { minHeight: "100vh", fontFamily: "Arial, sans-serif", color: "#111" }, header: { padding: "20px 5%", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fffffff2", zIndex: 2 }, logo: { color: "#d4af37", letterSpacing: 2, cursor: "pointer", margin: 0 }, whatsapp: { position: "fixed", right: 24, bottom: 24, zIndex: 3, background: "#25d366", color: "white", padding: "14px 18px", borderRadius: 30, textDecoration: "none", fontWeight: "bold" }, content: { maxWidth: 1200, margin: "auto", padding: "45px 20px" }, title: { textAlign: "center", fontWeight: 300, fontSize: 36, marginBottom: 50 }, grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 30 }, card: { border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }, image: { width: "100%", height: 280, objectFit: "cover" }, body: { padding: 22 }, price: { display: "block", color: "#d4af37", fontSize: 22, margin: "18px 0" }, actions: { display: "flex", gap: 10 }, add: { ...({} as React.CSSProperties), flex: 1, padding: 13, border: "1px solid #111", borderRadius: 30, background: "white" }, buy: { padding: 14, border: 0, borderRadius: 10, background: "#111", color: "white", fontWeight: "bold", cursor: "pointer" }, quantity: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", color: "white", padding: 10, borderRadius: 30 }, checkout: { display: "block", margin: "50px auto", padding: "18px 40px", border: 0, borderRadius: 30, background: "#d4af37", color: "white", fontWeight: "bold" }, form: { maxWidth: 600, margin: "auto", padding: 35, boxShadow: "0 10px 40px #0001", borderRadius: 20 }, back: { border: 0, background: "none", color: "#d4af37", cursor: "pointer" }, input: { width: "100%", boxSizing: "border-box", padding: 14, margin: "7px 0", border: "1px solid #ddd", borderRadius: 8 }, line: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eee" }, total: { background: "#fafafa", padding: 20, margin: "20px 0", lineHeight: 2 } };
