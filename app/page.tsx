"use client";

import { useMemo, useState } from "react";

type Product = { id: string; name: string; price: number; image: string };

const products: Product[] = [
	{ id: "1", name: "Oxidised Navratri Damini Maangtikka", price: 599, image: "/item1.jpg" },
	{ id: "2", name: "18k Gold Plated Kundan Kamarband", price: 426, image: "/item2.jpg" },
	{ id: "3", name: "Austrian Stone Pearl Necklace Set", price: 1176, image: "/item3.jpg" },
	{ id: "4", name: "Oxidised Pota Stone Pearl Jhumki", price: 305, image: "/item4.jpg" },
	{ id: "5", name: "Oxidised Plated Dangler Earrings", price: 77, image: "/item5.jpg" },
	{ id: "6", name: "Oxidised Dangler Earrings Small", price: 52, image: "/item6.jpg" },
];

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Record<string, number>>({});
	const [checkout, setCheckout] = useState(false);
	const total = useMemo(() => products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0), [cart]);
	const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
	const change = (id: string, amount: number) => setCart((current) => {
		const next = { ...current, [id]: Math.max(0, (current[id] || 0) + amount) };
		if (!next[id]) delete next[id];
		return next;
	});

	return <main className="store">
		<style>{`*{box-sizing:border-box}body{margin:0;font-family:Arial;color:#111}.store{min-height:100vh;background:#fcfcfc}.announcement{text-align:center;padding:10px;background:#111;color:#d4af37;font-size:12px;font-weight:bold;letter-spacing:1px}.header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:20px 6%;background:#fffffff5;border-bottom:1px solid #eee}.brand{margin:0;color:#b38728;letter-spacing:2px}.cart{padding:12px 20px;background:#111;color:#fff;border:0;border-radius:4px;cursor:pointer}.content{max-width:1200px;margin:auto;padding:50px 20px}.hero{text-align:center;margin-bottom:45px}.hero h2{font-size:34px;font-weight:400}.gold{color:#b38728}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px}.card{padding:15px;background:#fff;border:1px solid #eee;border-radius:10px;text-align:center}.image{width:100%;height:290px;object-fit:cover;border-radius:6px}.card h3{min-height:45px;font-size:16px}.price{color:#b38728;font-size:20px;font-weight:bold}.actions{display:flex;gap:8px}.button{flex:1;padding:13px;border-radius:4px;border:1px solid #bbb;background:#fafafa;cursor:pointer;font-weight:bold}.buy,.pay{background:#b38728;color:#fff;border-color:#b38728}.cta{display:block;margin:45px auto 0;padding:16px 30px;background:#111;color:#fff;border:0;border-radius:4px;cursor:pointer}.panel{max-width:650px;margin:auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:10px}.back{border:0;background:none;color:#b38728;cursor:pointer;font-weight:bold}.row{display:flex;justify-content:space-between;gap:15px;padding:14px 0;border-bottom:1px solid #eee}.input{width:100%;padding:14px;margin:7px 0;border:1px solid #ddd;border-radius:4px}.pay{width:100%;padding:16px;border-radius:4px;margin-top:20px}.pay:disabled{background:#ddd;color:#888;border:0}.whatsapp{position:fixed;right:20px;bottom:20px;padding:14px 18px;background:#25d366;color:#fff;border-radius:30px;text-decoration:none}@media(max-width:600px){.header{padding:16px}.brand{font-size:18px}.content{padding:30px 15px}}`}</style>
		<div className="announcement">✨ NATIONWIDE SECURE DELIVERY ✨ FREE SHIPPING ON PREPAID ORDERS ✨</div>
		<header className="header"><h1 className="brand">TRENDY JEWELLERY</h1><button className="cart" onClick={() => total && setCheckout(true)}>CART ({count}) • ₹{total.toLocaleString("en-IN")}</button></header>
		<a className="whatsapp" href="https://wa.me/919279566257" target="_blank" rel="noreferrer">💬 WhatsApp</a>
		<div className="content">{!checkout ? <><section className="hero"><h2>Elegance, <span className="gold">Redefined.</span></h2><p>Premium jewellery selected for your special moments.</p></section><section className="products">{products.map((p) => <article className="card" key={p.id}><img className="image" src={p.image} alt={p.name} /><h3>{p.name}</h3><div className="price">₹{p.price.toLocaleString("en-IN")}</div><div className="actions">{cart[p.id] ? <><button className="button" onClick={() => change(p.id, -1)}>−</button><strong>{cart[p.id]}</strong><button className="button" onClick={() => change(p.id, 1)}>+</button></> : <button className="button" onClick={() => change(p.id, 1)}>Add to Cart</button>}<button className="button buy" onClick={() => { change(p.id, 1); setCheckout(true); }}>Buy Now</button></div></article>)}</section>{total > 0 && <button className="cta" onClick={() => setCheckout(true)}>Proceed to Checkout (₹{total.toLocaleString("en-IN")})</button>}</> : <section className="panel"><button className="back" onClick={() => setCheckout(false)}>← Back to Shop</button><h2>Checkout</h2>{products.filter((p) => cart[p.id]).map((p) => <div className="row" key={p.id}><span>{p.name}<br /><b>₹{p.price} × {cart[p.id]}</b></span><span><button onClick={() => change(p.id, -1)}>−</button> {cart[p.id]} <button onClick={() => change(p.id, 1)}>+</button></span></div>)}<input className="input" placeholder="Full Name" /><input className="input" type="email" placeholder="Email Address" /><input className="input" placeholder="Full Shipping Address" /><input className="input" placeholder="Pincode" maxLength={6} /><button className="pay">Securely Pay ₹{total.toLocaleString("en-IN")}</button></section>}</div>
	</main>;
}
