"use client";

import { useMemo, useState } from "react";

type Product = { id: string; name: string; price: number; image: string };

const products: Product[] = [
	{ id: "prod_1", name: "Oxidised Navratri Damini Maangtikka", price: 599, image: "/item1.jpg" },
	{ id: "prod_2", name: "18k Gold Plated Kundan Waist Chain", price: 426, image: "/item2.jpg" },
	{ id: "prod_3", name: "Austrian Stone Pearl Necklace Set", price: 1176, image: "/item3.jpg" },
	{ id: "prod_4", name: "Oxidised Pota Stone Pearl Jhumki", price: 305, image: "/item4.jpg" },
	{ id: "prod_5", name: "Oxidised Plated Dangler Earrings", price: 77, image: "/item5.jpg" },
	{ id: "prod_6", name: "Oxidised Plated Dangler Earrings Small", price: 52, image: "/item6.jpg" },
];

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Record<string, number>>({});
	const [checkout, setCheckout] = useState(false);
	const [showLogin, setShowLogin] = useState(false);
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [pincode, setPincode] = useState("");
	const [userName, setUserName] = useState("");

	const total = useMemo(() => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0), [cart]);
	const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
	const change = (id: string, delta: number) => setCart((old) => {
		const next = Math.max(0, (old[id] || 0) + delta);
		const result = { ...old };
		if (next) result[id] = next; else delete result[id];
		return result;
	});
	const handleLogin = async () => {
		if (phone.length !== 10 || !name) return alert("Enter valid Name and 10-digit Phone.");
		try {
			const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: "+91" + phone, name, age: null, gender: "Not Specified" }) });
			if (!res.ok) return alert("Login failed.");
			alert(`✅ Welcome ${name}! Account secured.`); setUserName(name); setShowLogin(false);
		} catch { alert("Network error."); }
	};
	const loadRazorpay = () => new Promise((resolve) => {
		if (typeof window !== "undefined" && (window as any).Razorpay) return resolve(true);
		const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script);
	});
	const handlePayment = async () => {
		if (!await loadRazorpay()) return alert("Razorpay failed to load.");
		const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total * 100, name, email, phone, address, pincode, cart }) });
		const data = await res.json();
		new (window as any).Razorpay({ key: data.keyId, amount: data.amount, currency: "INR", name: "TRENDY JEWELLERY", order_id: data.orderId, handler: async (response: any) => {
			alert("✅ Payment successful! Generating your DTDC tracking number...");
			const shipRes = await fetch("/api/ship", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: response.razorpay_payment_id, name, phone, address, pincode, cart }) });
			const shipData = await shipRes.json(); setCart({}); setCheckout(false);
			window.location.href = `/success?order_id=${response.razorpay_payment_id}&tracking=${shipData.awb_number || "PENDING"}`;
		}, prefill: { name, email, contact: phone }, theme: { color: "#b38728" } }).open();
	};
	return <main className="store"><style>{`*{box-sizing:border-box}body{margin:0;background:#fafafa;color:#111;font-family:Arial,sans-serif}.top{padding:9px;text-align:center;background:#111;color:#d4af37;font-size:12px;letter-spacing:2px}.header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:20px 6%;background:#fff;border-bottom:1px solid #eee}.brand{margin:0;color:#b38728;letter-spacing:2px}.actions{display:flex;gap:10px;align-items:center}button{cursor:pointer;font-weight:bold;border-radius:4px;padding:11px 18px}.dark{background:#111;color:#fff;border:0}.outline{background:#fff;border:1px solid #ccc}.gold{background:#b38728;color:#fff;border:0}.content{max-width:1200px;margin:auto;padding:50px 20px}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px}.card{padding:15px;background:#fff;border:1px solid #eee;border-radius:10px;text-align:center}.card img{width:100%;height:300px;object-fit:cover;border-radius:6px}.price{color:#b38728;font-size:20px;font-weight:bold}.controls{display:flex;justify-content:center;gap:8px;align-items:center}.checkout{max-width:650px;margin:auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:10px}.field{width:100%;padding:13px;margin:7px 0;border:1px solid #ddd;border-radius:4px}.modal{position:fixed;inset:0;z-index:5;display:grid;place-items:center;background:#0009}.modal>div{position:relative;width:min(430px,90%);padding:35px;background:#fff;border-radius:10px}`}</style>
		<div className="top">✨ NATIONWIDE SECURE DELIVERY ✨ AUTHENTIC BRANDED JEWELLERY ✨</div>
		<header className="header"><h1 className="brand">TRENDY JEWELLERY</h1><div className="actions">{userName ? <span style={{ color: "#b38728", fontWeight: "bold", marginRight: 10 }}>Hi, {userName}</span> : <button className="outline" onClick={() => setShowLogin(true)}>LOGIN</button>}<button className="dark" onClick={() => count && setCheckout(true)}>CART ({count})</button></div></header>
		{showLogin && <div className="modal"><div><button style={{ position: "absolute", right: 10, top: 8, border: 0, background: "none", fontSize: 22 }} onClick={() => setShowLogin(false)}>×</button><h2>Welcome to Trendy</h2><input className="field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} /><input className="field" placeholder="Mobile Number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} /><button className="gold" style={{ width: "100%" }} onClick={handleLogin}>Send Secure OTP</button></div></div>}
		<div className="content">{!checkout ? <><section style={{ textAlign: "center", marginBottom: 40 }}><h2>Elegance, <span style={{ color: "#b38728" }}>Redefined.</span></h2></section><section className="products">{products.map(p => <article className="card" key={p.id}><img src={p.image} alt={p.name} /><h3>{p.name}</h3><div className="price">₹{p.price.toLocaleString("en-IN")}</div><div className="controls">{cart[p.id] ? <><button onClick={() => change(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => change(p.id, 1)}>+</button></> : <button className="outline" onClick={() => change(p.id, 1)}>Add to Cart</button>}<button className="gold" onClick={() => { change(p.id, 1); setCheckout(true); }}>Buy Now</button></div></article>)}</section></> : <section className="checkout"><button className="outline" onClick={() => setCheckout(false)}>← Back</button><h2>Checkout</h2>{products.filter(p => cart[p.id]).map(p => <p key={p.id}>{p.name} × {cart[p.id]} — ₹{(p.price * cart[p.id]).toLocaleString("en-IN")}</p>)}<h2>Total: ₹{total.toLocaleString("en-IN")}</h2><input className="field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} /><input className="field" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><input className="field" placeholder="Mobile" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} /><input className="field" placeholder="Full Address" value={address} onChange={e => setAddress(e.target.value)} /><input className="field" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} /><button className="gold" style={{ width: "100%" }} disabled={!name || !email || phone.length !== 10 || !address || pincode.length !== 6} onClick={handlePayment}>Securely Pay ₹{total.toLocaleString("en-IN")}</button></section>}</div>
	</main>;
}
