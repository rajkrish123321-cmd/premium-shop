"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

const PRODUCTS = [
	["prod_1", "Akruti Collection Oxidised Navratri Damini Maangtikka", 599, "/item1.jpg", "Stunning Oxidised Plated Finish."],
	["prod_2", "Etnico 18k Gold Plated Kundan Kamarband/Waist Chain", 426, "/item2.jpg", "White Stone Studded Belly Chain for Women (B003W)."],
	["prod_3", "Palak Art Heritage Austrian Stone Pearl Necklace Set", 1176, "/item3.jpg", "White Pearl and Beads with Austrian Stone."],
	["prod_4", "Maharani Jewels Oxidised Pota Stone Pearl Jhumki", 305, "/item4.jpg", "Black Pearl Jhumki Earrings."],
	["prod_5", "Darshana Jewels Oxidised Plated Dangler Earrings (Large)", 77, "/item5.jpg", "Oxidised Dangler Earrings."],
	["prod_6", "Darshana Jewels Oxidised Plated Dangler Earrings (Small)", 52, "/item6.jpg", "Oxidised Dangler Earrings."]
] as const;
type Product = typeof PRODUCTS[number];
type Cart = Record<string, number>;

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Cart>({});
	const [checkout, setCheckout] = useState(false);
	const [form, setForm] = useState({ name: "", email: "", phone: "", altPhone: "", address: "", landmark: "", pincode: "" });
	const [status, setStatus] = useState("");
	const total = PRODUCTS.reduce((n, p) => n + p[2] * (cart[p[0]] || 0), 0);
	const count = Object.values(cart).reduce((n, x) => n + x, 0);
	const tax = form.pincode.length === 6 && total ? total * .03 : 0;
	const setField = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));
	const quantity = (id: string, delta: number) => setCart(c => {
		const product = PRODUCTS.find(p => p[0] === id);
		if (!product) return c;
		const next = (c[id] || 0) + delta;
		if (next > 20) { alert("Only 20 of this item are available."); return c; }
		const result = { ...c }; if (next > 0) result[id] = next; else delete result[id]; return result;
	});
	const buy = (id: string) => { if (!cart[id]) quantity(id, 1); setCheckout(true); };
	const complete = !!form.name && !!form.email && form.phone.length >= 10 && !!form.address && !!tax;

	useEffect(() => { if (!total) setCheckout(false); }, [total]);
	async function pay() {
		if (!complete) return;
		const Razorpay = (window as any).Razorpay;
		if (!Razorpay) return alert("Secure payment system loading. Please try again.");
		setStatus("Initializing secure checkout...");
		try {
			const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total + tax }) });
			const order = await r.json(); if (!order.orderId) throw Error();
			new Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "TRENDY JEWELLERY", order_id: order.orderId,
				prefill: { name: form.name, email: form.email, contact: form.phone }, theme: { color: "#b38728" },
				handler: async (response: any) => {
					setStatus("Verifying payment security...");
					const v = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature }) });
					if (!(await v.json()).success) return setStatus("Payment verification failed.");
					await fetch("/api/webhooks/shipping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "order.paid", id: response.razorpay_payment_id, amount: order.amount, contact: form.phone, notes: { customer_name: form.name, email: form.email, shipping_address: form.address, landmark: form.landmark || "None", alternate_phone: form.altPhone || "None", shipping_pincode: form.pincode } }) });
					alert(`🎉 Order Confirmed! ID: ${response.razorpay_payment_id}`); setCart({}); setCheckout(false); setStatus("");
				}
			}).open();
		} catch { setStatus("Payment error. Please try again."); }
	}
	const input = (key: keyof typeof form, placeholder: string, type = "text", extra = {}) => <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setField(key, type === "tel" || key === "pincode" ? e.target.value.replace(/\D/g, "") : e.target.value)} {...extra} />;
	return <main className="page"><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
		<style>{`.page{min-height:100vh;background:#fdfdfd;color:#111;font-family:Arial,sans-serif}.marquee{padding:10px;text-align:center;color:#b38728;border-bottom:1px solid #eee;font-size:13px;font-weight:bold;letter-spacing:1px}header{padding:24px 5%;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;position:sticky;top:0;background:#fff;z-index:2}h1{margin:0;color:#b38728;font-size:28px;letter-spacing:2px;cursor:pointer}.cart{background:#111;color:#fff;padding:12px 24px;border-radius:4px;font-weight:bold}.wrap{max-width:1200px;margin:auto;padding:40px 20px}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px}.card{border:1px solid #eee;padding:16px;border-radius:8px;background:#fff}.card img{width:100%;height:300px;object-fit:cover}.card h3{font-size:17px;line-height:1.4}.price{font-size:20px;font-weight:bold;color:#b38728}.actions{display:flex;gap:8px}.actions button,.pay{flex:1;padding:14px;border-radius:4px;cursor:pointer;font-weight:bold;border:1px solid #111;background:#fff}.actions button:last-child,.pay{background:#b38728;color:#fff;border:0}.checkout{max-width:650px;margin:auto;background:#fff;padding:32px;border:1px solid #eee;border-radius:10px}.summary,.totals{border:1px solid #eee;padding:20px;margin:20px 0}.row{display:flex;justify-content:space-between;margin:12px 0}.fields{display:grid;gap:14px}input{width:100%;box-sizing:border-box;padding:15px;border:1px solid #ccc;border-radius:6px;font-size:15px}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.support{position:fixed;bottom:25px;right:25px;background:#25d366;color:#fff;padding:15px 20px;border-radius:30px;text-decoration:none;font-weight:bold}@media(max-width:600px){.two{grid-template-columns:1fr}header{padding:18px 12px}h1{font-size:20px}.cart{padding:10px;font-size:12px}}`}</style>
		<div className="marquee">✨ EXCLUSIVE JEWELLERY COLLECTION ✨ SECURE CHECKOUT ✨ PREMIUM QUALITY GUARANTEED ✨ NATIONWIDE DELIVERY ✨</div>
		<header><h1 onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><div className="cart" onClick={() => total && setCheckout(true)}>CART ({count}) • ₹{total.toLocaleString("en-IN")}</div></header>
		<a className="support" href="https://wa.me/919279566257" target="_blank" rel="noreferrer">💬 WhatsApp Support</a>
		<div className="wrap">{!checkout ? <><h2 style={{ textAlign: "center", marginBottom: 50 }}>Elegance, <span style={{ color: "#b38728" }}>Redefined.</span></h2><div className="products">{PRODUCTS.map(p => <article className="card" key={p[0]}><img src={p[3]} alt={p[1]} /><h3>{p[1]}</h3><p>{p[4]}</p><div className="price">₹{p[2].toLocaleString("en-IN")}</div><div className="actions">{cart[p[0]] ? <button onClick={() => quantity(p[0], -1)}>− {cart[p[0]]} +</button> : <button onClick={() => quantity(p[0], 1)}>Add to Cart</button>}<button onClick={() => buy(p[0])}>Buy Now</button></div></article>)}</div>{total > 0 && <button className="pay" style={{ display: "block", maxWidth: 300, margin: "50px auto" }} onClick={() => setCheckout(true)}>Proceed to Checkout</button>}</> : <section className="checkout"><button onClick={() => setCheckout(false)}>← Back to Shop</button><h2>Checkout</h2><div className="summary">{Object.entries(cart).map(([id, n]) => { const p = PRODUCTS.find(x => x[0] === id)!; return <div className="row" key={id}><span>{p[1]} × {n}</span><b>₹{(p[2] * n).toLocaleString("en-IN")}</b></div> })}<button onClick={() => setCheckout(false)}>+ Add More Items</button></div><div className="fields">{input("name", "Full Name") }<div className="two">{input("email", "Email Address", "email")}{input("phone", "Primary Mobile", "tel", { maxLength: 10 })}</div>{input("altPhone", "Alternate Mobile (Optional)", "tel", { maxLength: 10 })}{input("address", "Full Shipping Address") }<div className="two">{input("landmark", "Nearby Location / Landmark")}{input("pincode", "Pincode", "text", { maxLength: 6 })}</div></div><div className="totals"><div className="row"><span>Subtotal</span><b>₹{total.toLocaleString("en-IN")}</b></div><div className="row"><span>GST (3%)</span><b>₹{tax.toFixed(2)}</b></div><div className="row" style={{ fontSize: 22 }}><b>Total</b><b>₹{(total + tax).toFixed(2)}</b></div></div><button className="pay" disabled={!complete} onClick={pay}>{status || (complete ? `Securely Pay ₹${(total + tax).toFixed(2)}` : "Complete Form to Pay")}</button></section>}</div>
	</main>;
}
