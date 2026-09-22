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
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [pincode, setPincode] = useState("");

	const count = Object.values(cart).reduce((sum, value) => sum + value, 0);
	const total = useMemo(() => products.reduce((sum, product) =>
		sum + (selected[product.id] ? product.price * (cart[product.id] || 0) : 0), 0), [cart, selected]);
	const valid = name.trim().length > 2 && phone.length === 10 && email.includes("@") &&
		address.trim().length > 5 && pincode.length === 6 && total > 0;

	const change = (id: string, delta: number) => setCart(old => {
		const quantity = Math.max(0, (old[id] || 0) + delta);
		const next = { ...old };
		if (quantity) next[id] = quantity;
		else delete next[id];
		if (quantity && !old[id]) setSelected(items => ({ ...items, [id]: true }));
		return next;
	});

	const login = async () => {
		if (!name || phone.length !== 10) return alert("Enter a valid name and 10-digit phone number.");
		try {
			const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: "+91" + phone, name, age: null, gender: "Not Specified" }) });
			if (!response.ok) throw new Error();
			setShowLogin(false); alert(`Welcome ${name}!`);
		} catch { alert("Login failed."); }
	};

	const pay = async () => {
		if (!valid) return;
		try {
			const script = document.createElement("script");
			script.src = "https://checkout.razorpay.com/v1/checkout.js";
			await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.body.appendChild(script); });
			const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total * 100, name, email, phone, address, pincode, cart }) });
			const data = await response.json();
			new (window as any).Razorpay({ key: data.keyId, amount: data.amount, currency: "INR", name: "TRENDY JEWELLERY", order_id: data.orderId, prefill: { name, email, contact: phone }, theme: { color: "#b38728" }, handler: (result: any) => { window.location.href = `/success?order_id=${result.razorpay_payment_id}`; } }).open();
		} catch { alert("Payment could not be started."); }
	};

	return <main className="store"><style>{`*{box-sizing:border-box}body{margin:0;background:#fdfbf7;color:#111;font-family:Arial,sans-serif}.top{background:#111;color:#d4af37;padding:10px;text-align:center;font-size:12px;letter-spacing:2px}.header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:20px 5%;background:#fff;border-bottom:1px solid #eee}.brand{color:#b38728;letter-spacing:2px;cursor:pointer}.buttons{display:flex;gap:10px;align-items:center}.btn{border:0;border-radius:6px;padding:12px 18px;cursor:pointer;font-weight:bold}.outline{background:white;border:2px solid #111}.dark{background:#111;color:#fff}.content{max-width:1200px;margin:auto;padding:45px 20px}.hero{text-align:center;margin-bottom:45px}.hero h2{font-size:36px}.gold{color:#b38728}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px}.card,.panel{background:#fff;border:1px solid #eee;border-radius:12px;padding:15px}.card img{width:100%;height:290px;object-fit:cover;border-radius:8px}.card h3{height:40px;font-size:16px}.price{text-align:center;color:#b38728;font-size:22px;font-weight:bold;margin:15px}.actions{display:flex;gap:8px}.actions>*{flex:1}.qty{display:flex;justify-content:center;align-items:center;gap:18px;padding:10px;background:#fafafa;border-radius:30px}.checkout{display:grid;grid-template-columns:1fr 1fr;gap:25px}.item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #eee}.item img{width:60px;height:60px;object-fit:cover;border-radius:8px}.field{width:100%;padding:14px;margin:7px 0;border:1px solid #ddd;border-radius:7px;font-size:15px}.pay{width:100%;padding:16px;background:#25a865;color:#fff;border:0;border-radius:7px;font-weight:bold;cursor:pointer}.pay:disabled{background:#ddd;color:#888;cursor:not-allowed}.modal{position:fixed;inset:0;background:#0009;display:grid;place-items:center;z-index:5}.modal .panel{width:min(90%,380px)}@media(max-width:700px){.checkout{grid-template-columns:1fr}.header{padding:15px}.brand{font-size:18px}.hero h2{font-size:28px}}`}</style>
		<div className="top">✨ FREE SHIPPING ON ORDERS ABOVE ₹799 ✨ TRUSTED ALL INDIA DELIVERY ✨</div>
		<header className="header"><h1 className="brand" onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><div className="buttons"><button className="btn outline" onClick={() => setShowLogin(true)}>LOGIN</button><button className="btn dark" onClick={() => count && setCheckout(true)}>🛒 CART ({count})</button></div></header>
		{showLogin && <div className="modal"><div className="panel"><button className="btn" onClick={() => setShowLogin(false)}>×</button><h2>Welcome</h2><input className="field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} /><input className="field" placeholder="Mobile Number" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} /><button className="pay" onClick={login}>Verify & Login</button></div></div>}
		<div className="content">{!checkout ? <><section className="hero"><h2>Elegance, <span className="gold">Redefined.</span></h2><p>Handcrafted premium jewellery for your special moments.</p></section><section className="products">{products.map(product => <article className="card" key={product.id}><img src={product.image} alt={product.name} /><h3>{product.name}</h3><div className="price">₹{product.price.toLocaleString("en-IN")}</div><div className="actions">{cart[product.id] ? <div className="qty"><button onClick={() => change(product.id, -1)}>−</button><b>{cart[product.id]}</b><button onClick={() => change(product.id, 1)}>+</button></div> : <button className="btn outline" onClick={() => change(product.id, 1)}>Add to Cart</button>}<button className="btn dark" onClick={() => { change(product.id, 1); setCheckout(true); }}>Buy Now</button></div></article>)}</section></> : <><button className="btn outline" onClick={() => setCheckout(false)}>← Back to Shopping</button><div className="checkout"><div className="panel"><h2>Your Cart</h2>{products.filter(p => cart[p.id]).map(p => <div className="item" key={p.id}><input type="checkbox" checked={!!selected[p.id]} onChange={() => setSelected(s => ({ ...s, [p.id]: !s[p.id] }))} /><img src={p.image} alt="" /><span>{p.name}<br /><b>₹{p.price}</b></span><div className="qty"><button onClick={() => change(p.id, -1)}>−</button>{cart[p.id]}<button onClick={() => change(p.id, 1)}>+</button></div></div>)}<h2>Total: ₹{total.toLocaleString("en-IN")}</h2></div><div className="panel"><h2>🔒 Secure Checkout</h2><input className="field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} /><input className="field" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} /><input className="field" placeholder="Mobile Number" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} /><input className="field" placeholder="Complete Shipping Address" value={address} onChange={e => setAddress(e.target.value)} /><input className="field" placeholder="Pincode" maxLength={6} value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ""))} /><button className="pay" disabled={!valid} onClick={pay}>PAY SECURELY ₹{total.toLocaleString("en-IN")}</button></div></div></>}</div>
	</main>;
}
