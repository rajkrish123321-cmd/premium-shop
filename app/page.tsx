/* eslint-disable @next/next/no-img-element */
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
	const [selected, setSelected] = useState<Record<string, boolean>>({});
	const [checkout, setCheckout] = useState(false);
	const [login, setLogin] = useState(false);
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [pincode, setPincode] = useState("");
	const [user, setUser] = useState("");
	const picked = useMemo(() => Object.fromEntries(Object.entries(cart).filter(([id]) => selected[id])), [cart, selected]);
	const total = products.reduce((sum, p) => sum + p.price * (picked[p.id] || 0), 0);
	const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
	const valid = name.length > 2 && phone.length === 10 && email.includes("@") && address.length > 5 && pincode.length === 6 && total > 0;

	const change = (id: string, delta: number) => setCart(old => {
		const quantity = Math.max(0, (old[id] || 0) + delta), next = { ...old };
		if (quantity) { next[id] = quantity; if (!old[id]) setSelected(s => ({ ...s, [id]: true })); }
		else { delete next[id]; setSelected(s => { const n = { ...s }; delete n[id]; return n; }); }
		return next;
	});
	const pay = async () => {
		if (!valid) return;
		const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js";
		await new Promise(resolve => { script.onload = resolve; script.onerror = resolve; document.body.appendChild(script); });
		const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total * 100, name, email, phone, address, pincode, cart: picked }) });
		if (!response.ok) return alert("Unable to create checkout order.");
		const data = await response.json();
		new (window as any).Razorpay({ key: data.keyId, amount: data.amount, currency: "INR", order_id: data.orderId, name: "TRENDY JEWELLERY", prefill: { name, email, contact: phone }, theme: { color: "#b38728" }, handler: () => { alert("Payment successful!"); setCart({}); setCheckout(false); } }).open();
	};

	return <main className="store"><style dangerouslySetInnerHTML={{ __html: `
		*{box-sizing:border-box}body{margin:0;background:#fdfbf7;color:#111;font-family:Arial,sans-serif}.bar{background:#111;color:#d4af37;padding:11px;text-align:center;font-size:12px;letter-spacing:2px}.header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:20px 5%;background:#fffffff2;border-bottom:1px solid #eee}.brand{color:#b38728;letter-spacing:2px;cursor:pointer}.btn{border:0;border-radius:6px;padding:11px 18px;cursor:pointer;font-weight:bold}.dark{background:#111;color:#fff}.gold{background:#b38728;color:#fff}.outline{background:transparent;border:1px solid #111}.content{max-width:1200px;margin:auto;padding:45px 20px}.hero{text-align:center;margin-bottom:45px}.hero span,.price{color:#b38728}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:28px}.card,.panel{background:#fff;border:1px solid #eee;border-radius:12px;padding:15px}.card img{width:100%;height:290px;object-fit:cover;border-radius:8px}.card h3{height:42px;font-size:15px;text-align:center}.price{text-align:center;font-size:21px;font-weight:bold;margin:18px}.actions{display:flex;gap:8px}.actions>*{flex:1}.checkout{display:grid;grid-template-columns:1fr 1fr;gap:25px}.item{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #eee}.item img{width:55px;height:55px;object-fit:cover;border-radius:6px}.item .grow{flex:1}.qty{display:flex;align-items:center;gap:12px}.field{width:100%;padding:13px;margin-bottom:14px;border:1px solid #ddd;border-radius:7px}.pay{width:100%;padding:16px;border:0;border-radius:7px}.pay.ready{background:#25a866;color:#fff;cursor:pointer;font-weight:bold}.modal{position:fixed;inset:0;background:#0009;display:grid;place-items:center;z-index:5}.modal>div{background:#fff;padding:30px;border-radius:12px;width:min(90%,390px)}@media(max-width:700px){.checkout{grid-template-columns:1fr}.header{padding:15px}.brand{font-size:18px}}
	`}} />
		<div className="bar">✨ FREE SHIPPING ON ORDERS ABOVE ₹799 ✨ TRUSTED ALL INDIA DELIVERY ✨ SECURE CHECKOUT ✨</div>
		<header className="header"><h1 className="brand" onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><div>{user ? <b style={{ color: "#b38728", marginRight: 12 }}>Hi, {user}</b> : <button className="btn outline" onClick={() => setLogin(true)}>LOGIN</button>} <button className="btn dark" onClick={() => count && setCheckout(true)}>🛒 CART ({count})</button></div></header>
		{login && <div className="modal"><div><button className="btn" onClick={() => setLogin(false)}>×</button><h2>Welcome</h2><input className="field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} /><input className="field" placeholder="Mobile Number" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} /><button className="pay ready" onClick={() => { if (phone.length !== 10 || !name) return alert("Enter valid details."); setUser(name); setLogin(false); }}>Verify & Login</button></div></div>}
		<div className="content">{!checkout ? <><section className="hero"><h2>Elegance, <span>Redefined.</span></h2><p>Handcrafted premium jewellery for your special moments.</p></section><section className="products">{products.map(p => <article className="card" key={p.id}><img src={p.image} alt={p.name} /><h3>{p.name}</h3><div className="price">₹{p.price.toLocaleString("en-IN")}</div><div className="actions">{cart[p.id] ? <div className="qty"><button onClick={() => change(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => change(p.id, 1)}>+</button></div> : <button className="btn outline" onClick={() => change(p.id, 1)}>Add to Cart</button>}<button className="btn gold" onClick={() => { change(p.id, 1); setCheckout(true); }}>Buy Now</button></div></article>)}</section></> : <><button className="btn" onClick={() => setCheckout(false)}>← Back to Shopping</button><div className="checkout"><section className="panel"><h2>Your Cart</h2>{products.filter(p => cart[p.id]).map(p => <div className="item" key={p.id}><input type="checkbox" checked={!!selected[p.id]} onChange={() => setSelected(s => ({ ...s, [p.id]: !s[p.id] }))} /><img src={p.image} alt={p.name} /><div className="grow">{p.name}<br /><b>₹{p.price}</b></div><div className="qty"><button onClick={() => change(p.id, -1)}>−</button>{cart[p.id]}<button onClick={() => change(p.id, 1)}>+</button></div></div>)}</section><section className="panel"><h2>🔒 Secure Checkout</h2><input className="field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} /><input className="field" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} /><input className="field" placeholder="Mobile Number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} /><input className="field" placeholder="Complete Shipping Address" value={address} onChange={e => setAddress(e.target.value)} /><input className="field" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} /><h2>Total: ₹{total.toLocaleString("en-IN")}</h2><button className={`pay ${valid ? "ready" : ""}`} disabled={!valid} onClick={pay}>PAY SECURELY</button></section></div></>}</div>
	</main>;
}
