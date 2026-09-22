"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";

const PRODUCTS = [
	{ id: "prod_1", name: "Akruti Collection Oxidised Navratri Damini Maangtikka", price: 599, image: "/item1.jpg", desc: "Stunning Oxidised Plated Finish." },
	{ id: "prod_2", name: "Etnico 18k Gold Plated Kundan Kamarband/Waist Chain", price: 426, image: "/item2.jpg", desc: "White Stone Studded Belly Chain for Women (B003W)." },
	{ id: "prod_3", name: "Palak Art Heritage Austrian Stone Pearl Necklace Set", price: 1176, image: "/item3.jpg", desc: "White Pearl and Beads with Austrian Stone." },
	{ id: "prod_4", name: "Maharani Jewels Oxidised Pota Stone Pearl Jhumki", price: 305, image: "/item4.jpg", desc: "Black Pearl Jhumki Earrings." },
	{ id: "prod_5", name: "Darshana Jewels Oxidised Plated Dangler Earrings (Large)", price: 77, image: "/item5.jpg", desc: "Oxidised Dangler Earrings." },
	{ id: "prod_6", name: "Darshana Jewels Oxidised Plated Dangler Earrings (Small)", price: 52, image: "/item6.jpg", desc: "Oxidised Dangler Earrings." },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Record<string, number>>({});
	const [checkout, setCheckout] = useState(false);
	const [pincode, setPincode] = useState("");
	const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", landmark: "" });
	const [status, setStatus] = useState("");

	const subtotal = useMemo(() => Object.entries(cart).reduce((sum, [id, quantity]) => {
		const product = PRODUCTS.find((item) => item.id === id);
		return sum + (product?.price ?? 0) * quantity;
	}, 0), [cart]);
	const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
	const tax = pincode.length === 6 && subtotal ? subtotal * 0.03 : 0;
	const total = subtotal + tax;

	useEffect(() => { if (!subtotal) setCheckout(false); }, [subtotal]);

	const changeQuantity = (id: string, amount: number) => setCart((current) => {
		const quantity = (current[id] || 0) + amount;
		if (quantity <= 0) { const next = { ...current }; delete next[id]; return next; }
		if (quantity > 20) return current;
		return { ...current, [id]: quantity };
	});

	const buy = (id: string) => { if (!cart[id]) changeQuantity(id, 1); setCheckout(true); };
	const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
	const complete = !!form.name && !!form.email && form.phone.length >= 10 && !!form.address && pincode.length === 6;

	const pay = async () => {
		if (!complete) return;
		setStatus("Connecting to secure server...");
		try {
			const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total }) });
			if (!response.ok) throw new Error("Checkout unavailable");
			const order = await response.json();
			const Razorpay = (window as any).Razorpay;
			if (!Razorpay) throw new Error("Payment unavailable");
			new Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "TRENDY JEWELLERY", order_id: order.orderId, prefill: { name: form.name, email: form.email, contact: form.phone }, theme: { color: "#b38728" }, handler: (result: any) => { alert(`Order confirmed: ${result.razorpay_payment_id}`); setCart({}); setCheckout(false); setStatus(""); } }).open();
		} catch { setStatus(""); alert("Payment gateway is not connected yet. Please try again later."); }
	};

	const input = (key: keyof typeof form, placeholder: string, type = "text") => <input type={type} placeholder={placeholder} value={form[key]} onChange={(event) => update(key, event.target.value.replace(/\D/g, ""))} className="input" />;

	return <main>
		<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
		<style>{`*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111;background:#fcfcfc}.marquee{padding:10px;background:#111;color:#d4af37;text-align:center;font-size:12px;font-weight:800;letter-spacing:1px}.header{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;padding:24px 5%;background:#fff;border-bottom:1px solid #eee}.brand{margin:0;color:#b38728;font-size:28px;letter-spacing:2px;cursor:pointer}.cart{padding:12px 20px;background:#111;color:#fff;border-radius:4px;font-weight:bold;cursor:pointer}.wrap{max-width:1200px;margin:auto;padding:45px 20px}.hero{text-align:center;margin-bottom:50px}.hero h2{font-weight:400;font-size:32px}.gold{color:#b38728;font-weight:900}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:35px}.card{padding:16px;background:#fff;border:1px solid #eee;border-radius:8px;text-align:center}.photo{height:300px;background:#fafafa}.photo img{width:100%;height:100%;object-fit:cover}.card h3{font-size:17px;line-height:1.4}.price{color:#b38728;font-size:20px;font-weight:900}.buttons{display:flex;gap:10px}.button{flex:1;padding:14px;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-weight:bold}.buy{background:#b38728;color:#fff;border:0}.checkout{max-width:650px;margin:auto;padding:35px;background:#fff;border:1px solid #eee;border-radius:10px}.back{border:0;background:none;color:#b38728;font-weight:bold;cursor:pointer;padding:0;margin-bottom:22px}.summary,.billing{padding:20px;margin:20px 0;border:1px solid #eee;border-radius:8px}.row{display:flex;justify-content:space-between;gap:12px;margin:12px 0}.input{width:100%;padding:15px;border:1px solid #dcdcdc;border-radius:4px;font-size:15px}.fields{display:grid;gap:14px;margin:20px 0}.quantity{display:flex;align-items:center;gap:12px}.quantity button{border:0;background:none;font-size:20px;cursor:pointer}.support{position:fixed;right:25px;bottom:25px;padding:15px 18px;border-radius:30px;background:#25d366;color:#fff;text-decoration:none;font-weight:bold;z-index:6}@media(max-width:600px){.header{padding:18px 15px}.brand{font-size:20px}.cart{padding:10px;font-size:12px}.fields .split{display:block}.split>*{margin-bottom:14px}}`}</style>
		<div className="marquee">✨ NATIONWIDE SECURE DELIVERY ✨ AUTHENTIC BRANDED JEWELLERY ✨ FREE SHIPPING ON PREPAID ORDERS ✨</div>
		<header className="header"><h1 className="brand" onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><div className="cart" onClick={() => subtotal && setCheckout(true)}>CART ({count}) • {money(subtotal)}</div></header>
		<a className="support" href="https://wa.me/919279566257" target="_blank" rel="noreferrer">💬 WhatsApp Support</a>
		<div className="wrap">{!checkout ? <><section className="hero"><h2>Elegance, <span className="gold">Redefined.</span></h2></section><div className="grid">{PRODUCTS.map((product) => <article className="card" key={product.id}><div className="photo"><img src={product.image} alt={product.name} /></div><h3>{product.name}</h3><p>{product.desc}</p><div className="price">{money(product.price)}</div><div className="buttons">{cart[product.id] ? <div className="button quantity"><button onClick={() => changeQuantity(product.id, -1)}>−</button><b>{cart[product.id]}</b><button onClick={() => changeQuantity(product.id, 1)}>+</button></div> : <button className="button" onClick={() => changeQuantity(product.id, 1)}>Add to Cart</button>}<button className="button buy" onClick={() => buy(product.id)}>Buy Now</button></div></article>)}</div>{subtotal > 0 && <p style={{ textAlign: "center", marginTop: 45 }}><button className="button buy" onClick={() => setCheckout(true)}>Proceed to Checkout ({money(subtotal)})</button></p>}</> : <section className="checkout"><button className="back" onClick={() => setCheckout(false)}>← Back to Shop</button><h2>Checkout</h2><div className="summary"><b>ORDER SUMMARY</b>{Object.entries(cart).map(([id, quantity]) => { const product = PRODUCTS.find((item) => item.id === id); return product && <div className="row" key={id}><span>{product.name} × {quantity}</span><b>{money(product.price * quantity)}</b></div>; })}</div><div className="fields">{input("name", "Full Name")}{input("email", "Email Address", "email")}{input("phone", "Primary Mobile", "tel")}{input("address", "Full Shipping Address")}{input("landmark", "Nearby Location / Landmark (Optional)")}<input className="input" maxLength={6} placeholder="Pincode" value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))} /></div><div className="billing"><div className="row"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="row"><span>GST (3%)</span><b>{money(tax)}</b></div><hr /><div className="row"><strong>Total</strong><strong>{money(total)}</strong></div></div><button className="button buy" disabled={!complete} onClick={pay}>{status || (complete ? `Securely Pay ${money(total)}` : "Complete Form to Pay")}</button></section>}</div>
	</main>;
}
