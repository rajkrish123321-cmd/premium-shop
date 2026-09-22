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
	const [showLogin, setShowLogin] = useState(false);
	const [user, setUser] = useState("");
	const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", pincode: "" });
	const count = Object.values(cart).reduce((a, b) => a + b, 0);
	const total = useMemo(() => products.reduce((sum, p) => sum + p.price * (selected[p.id] ? cart[p.id] || 0 : 0), 0), [cart, selected]);
	const update = (id: string, delta: number) => setCart(old => {
		const quantity = Math.max(0, (old[id] || 0) + delta), next = { ...old };
		if (quantity) next[id] = quantity; else delete next[id];
		if (delta > 0 && !old[id]) setSelected(s => ({ ...s, [id]: true }));
		return next;
	});
	const valid = form.name.length > 2 && form.email.includes("@") && form.phone.length === 10 && form.address.length > 5 && form.pincode.length === 6 && total > 0;
	const change = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));

	return <main className="store"><style>{`*{box-sizing:border-box}body{margin:0;background:#fdfbf7;color:#111;font-family:Arial,sans-serif}.top{background:#111;color:#d4af37;padding:9px;text-align:center;font-size:12px;letter-spacing:2px}.header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:20px 5%;background:#fffffff2;border-bottom:1px solid #eee}.brand{color:#b38728;letter-spacing:2px}.content{max-width:1250px;margin:auto;padding:45px 20px}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px}.card,.panel{background:white;border:1px solid #eee;border-radius:12px;padding:16px}.card img{width:100%;height:280px;object-fit:cover;border-radius:8px}.card h3{height:42px;font-size:16px}.price{color:#b38728;font-size:21px;font-weight:bold}.btn{cursor:pointer;border:0;border-radius:6px;padding:12px 18px;font-weight:bold}.dark{background:#111;color:#fff}.outline{background:white;border:2px solid #111}.actions{display:flex;gap:8px}.qty{display:flex;justify-content:center;align-items:center;gap:18px;border:1px solid #ddd;border-radius:30px;padding:5px}.checkout{display:grid;grid-template-columns:1fr 1fr;gap:25px}.item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #eee}.item img{width:60px;height:60px;object-fit:cover;border-radius:6px}.field{width:100%;padding:14px;margin:7px 0;border:1px solid #ddd;border-radius:7px}.pay{width:100%;padding:16px;background:#ddd;border:0;border-radius:7px;font-weight:bold}.ready{background:#25a866;color:#fff;cursor:pointer}.modal{position:fixed;inset:0;background:#0008;display:grid;place-items:center;z-index:5}.modal .panel{width:min(380px,90%)}`}</style>
		<div className="top">✨ FREE SHIPPING ON ORDERS ABOVE ₹799 ✨ SECURE CHECKOUT ✨</div>
		<header className="header"><h1 className="brand" onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><div>{user ? `Hi, ${user}` : <button className="btn outline" onClick={() => setShowLogin(true)}>LOGIN</button>} <button className="btn dark" onClick={() => count && setCheckout(true)}>🛒 CART ({count})</button></div></header>
		<div className="content">{!checkout ? <><section style={{ textAlign: "center", marginBottom: 45 }}><h2>Elegance, <span style={{ color: "#b38728" }}>Redefined.</span></h2><p>Handcrafted premium jewellery for your special moments.</p></section><section className="products">{products.map(p => <article className="card" key={p.id}><img src={p.image} alt={p.name}/><h3>{p.name}</h3><div className="price">₹{p.price.toLocaleString("en-IN")}</div><div className="actions">{cart[p.id] ? <div className="qty"><button onClick={() => update(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => update(p.id, 1)}>+</button></div> : <button className="btn outline" onClick={() => update(p.id, 1)}>ADD TO CART</button>}<button className="btn dark" onClick={() => { update(p.id, 1); setCheckout(true); }}>BUY NOW</button></div></article>)}</section></> : <><button className="btn" onClick={() => setCheckout(false)}>← Back to Shopping</button><div className="checkout"><section className="panel"><h2>Your Cart</h2>{products.filter(p => cart[p.id]).map(p => <div className="item" key={p.id}><input type="checkbox" checked={!!selected[p.id]} onChange={() => setSelected(s => ({ ...s, [p.id]: !s[p.id] }))}/><img src={p.image} alt=""/><span style={{ flex: 1 }}>{p.name}<br/><b>₹{p.price}</b></span><div className="qty"><button onClick={() => update(p.id, -1)}>−</button>{cart[p.id]}<button onClick={() => update(p.id, 1)}>+</button></div></div>)}</section><section className="panel"><h2>🔒 Secure Checkout</h2>{(["name", "email", "phone", "address", "pincode"] as const).map(k => <input key={k} className="field" placeholder={k[0].toUpperCase() + k.slice(1)} value={form[k]} onChange={e => change(k, k === "phone" || k === "pincode" ? e.target.value.replace(/\D/g, "") : e.target.value)}/>)}<h2>Total: ₹{total.toLocaleString("en-IN")}</h2><button className={`pay ${valid ? "ready" : ""}`} disabled={!valid} onClick={() => alert("Payment integration ready")}>PAY SECURELY</button></section></div></>}</div>
		{showLogin && <div className="modal"><div className="panel"><h2>Login</h2><input className="field" placeholder="Your name" onChange={e => setUser(e.target.value)}/><input className="field" placeholder="10-digit phone"/><button className="btn dark" onClick={() => setShowLogin(false)}>CONTINUE</button></div></div>}
	</main>;
}
