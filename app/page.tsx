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
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [pincode, setPincode] = useState("");
	const count = Object.values(cart).reduce((a, b) => a + b, 0);
	const items = useMemo(() => products.filter(p => cart[p.id] && selected[p.id]), [cart, selected]);
	const total = items.reduce((sum, p) => sum + p.price * cart[p.id], 0);
	const change = (id: string, amount: number) => setCart(old => {
		const next = { ...old, [id]: Math.max(0, (old[id] || 0) + amount) };
		if (!next[id]) delete next[id];
		if (amount > 0 && !old[id]) setSelected(s => ({ ...s, [id]: true }));
		return next;
	});
	const valid = name.trim().length > 2 && email.includes("@") && phone.length === 10 && address.length > 5 && pincode.length === 6 && total > 0;
	return <main className="store">
		<style>{`*{box-sizing:border-box}body{margin:0;background:#fdfbf7;color:#111;font-family:Arial,sans-serif}.bar{background:#111;color:#d4af37;text-align:center;padding:12px;font-weight:bold;letter-spacing:1px}.header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:20px 5%;background:#fffffff2;border-bottom:1px solid #eee}.brand{color:#b38728;letter-spacing:2px;cursor:pointer}.btn{border:0;border-radius:6px;padding:12px 20px;cursor:pointer;font-weight:bold}.dark{background:#111;color:#fff}.gold{background:#b38728;color:#fff}.content{max-width:1250px;margin:auto;padding:45px 20px}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px}.card,.panel{background:#fff;border:1px solid #eee;border-radius:12px;padding:15px}.card img{width:100%;height:300px;object-fit:cover;border-radius:8px}.card h3{min-height:40px;text-align:center}.price{text-align:center;color:#b38728;font-size:22px;font-weight:bold;margin:15px}.actions{display:flex;gap:8px}.actions>*{flex:1}.qty{display:flex;align-items:center;justify-content:center;gap:18px;background:#fafafa;padding:8px;border-radius:30px}.qty button{border:0;background:none;font-size:18px;cursor:pointer}.checkout{display:grid;grid-template-columns:1fr 1fr;gap:25px;max-width:900px;margin:auto}.item{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #eee}.item img{width:60px;height:60px;object-fit:cover;border-radius:6px}.field{width:100%;padding:14px;margin:7px 0;border:1px solid #ddd;border-radius:7px;font-size:15px}.pay{width:100%;padding:16px;border:0;border-radius:8px;background:#ddd;color:#888;font-weight:bold}.pay.ready{background:#159447;color:#fff;cursor:pointer}@media(max-width:700px){.checkout{grid-template-columns:1fr}.header{padding:15px}.brand{font-size:18px}}`}</style>
		<div className="bar">✨ FREE SHIPPING ON ORDERS ABOVE ₹799 ✨ SECURE CHECKOUT ✨</div>
		<header className="header"><h1 className="brand" onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><button className="btn dark" onClick={() => count && setCheckout(true)}>🛒 CART ({count})</button></header>
		<div className="content">{!checkout ? <>
			<section style={{ textAlign: "center", marginBottom: 45 }}><h2>Elegance, <span style={{ color: "#b38728" }}>Redefined.</span></h2><p>Handcrafted premium jewellery for your special moments.</p></section>
			<section className="products">{products.map(p => <article className="card" key={p.id}><img src={p.image} alt={p.name}/><h3>{p.name}</h3><div className="price">₹{p.price.toLocaleString("en-IN")}</div><div className="actions">{cart[p.id] ? <div className="qty"><button onClick={() => change(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => change(p.id, 1)}>+</button></div> : <button className="btn" onClick={() => change(p.id, 1)}>Add to Cart</button>}<button className="btn gold" onClick={() => { change(p.id, 1); setCheckout(true); }}>Buy Now</button></div></article>)}</section>
		</> : <><button className="btn" onClick={() => setCheckout(false)}>← Back to Shopping</button><div className="checkout" style={{ marginTop: 20 }}><section className="panel"><h2>Your Cart</h2>{products.filter(p => cart[p.id]).map(p => <div className="item" key={p.id}><input type="checkbox" checked={!!selected[p.id]} onChange={() => setSelected(s => ({ ...s, [p.id]: !s[p.id] }))}/><img src={p.image} alt={p.name}/><span style={{ flex: 1 }}>{p.name}<br/><b>₹{p.price}</b></span><div className="qty"><button onClick={() => change(p.id, -1)}>−</button>{cart[p.id]}<button onClick={() => change(p.id, 1)}>+</button></div></div>)}</section><section className="panel"><h2>🔒 Secure Checkout</h2><input className="field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}/><input className="field" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}/><input className="field" placeholder="Mobile Number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0,10))}/><input className="field" placeholder="Complete Shipping Address" value={address} onChange={e => setAddress(e.target.value)}/><input className="field" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0,6))}/><h2>Total: ₹{total.toLocaleString("en-IN")}</h2><button className={`pay ${valid ? "ready" : ""}`} disabled={!valid} onClick={() => alert("Payment integration ready")}>PAY SECURELY</button></section></div></>}</div>
	</main>;
}
