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
	const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
	const [checkout, setCheckout] = useState(false);
	const [showLogin, setShowLogin] = useState(false);
	const [userName, setUserName] = useState("");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [pincode, setPincode] = useState("");
	const [altPhone, setAltPhone] = useState("");
	const [landmark, setLandmark] = useState("");

	const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
	const filteredCart = useMemo(() => Object.fromEntries(Object.entries(cart).filter(([id]) => selectedItems[id])), [cart, selectedItems]);
	const total = useMemo(() => products.reduce((sum, p) => sum + p.price * (filteredCart[p.id] || 0), 0), [filteredCart]);
	const isFormValid = name.length > 2 && email.includes("@") && phone.length === 10 && address.length > 5 && pincode.length === 6 && total > 0;

	const change = (id: string, delta: number) => setCart(old => {
		const next = Math.max(0, (old[id] || 0) + delta), result = { ...old };
		if (next) { result[id] = next; if (!old[id]) setSelectedItems(prev => ({ ...prev, [id]: true })); } else delete result[id];
		return result;
	});
	const toggleSelection = (id: string) => setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
	const toggleAll = (select: boolean) => setSelectedItems(Object.fromEntries(Object.keys(cart).map(id => [id, select])));

	const handleLogin = async () => {
		if (phone.length !== 10 || !name) return alert("Enter valid Name and 10-digit Phone.");
		try {
			const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: "+91" + phone, name, age: null, gender: "Not Specified" }) });
			if (res.ok) { alert(`✅ Welcome ${name}! Account secured.`); setUserName(name); setShowLogin(false); } else alert("Login failed.");
		} catch { alert("Network error."); }
	};

	const loadRazorpay = () => new Promise(resolve => {
		if (typeof window !== "undefined" && (window as any).Razorpay) return resolve(true);
		const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script);
	});

	const handlePayment = async () => {
		if (!isFormValid || !(await loadRazorpay())) return;
		const fullAddress = `${address} ${landmark ? `(Landmark: ${landmark})` : ""} ${altPhone ? `| Alt Phone: ${altPhone}` : ""}`;
		const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total * 100, name, email, phone, address: fullAddress, pincode, cart: filteredCart }) });
		const data = await res.json();
		new (window as any).Razorpay({ key: data.keyId, amount: data.amount, currency: "INR", name: "TRENDY JEWELLERY", order_id: data.orderId, handler: async (response: any) => {
			const shipRes = await fetch("/api/ship", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: response.razorpay_payment_id, name, email, phone, address: fullAddress, pincode, cart: filteredCart }) });
			const shipData = await shipRes.json(); setCart(prev => { const next = { ...prev }; Object.keys(filteredCart).forEach(id => delete next[id]); return next; }); setCheckout(false); window.location.href = `/success?order_id=${response.razorpay_payment_id}&tracking=${shipData.awb_number || "PENDING"}`;
		}, prefill: { name, email, contact: phone }, theme: { color: "#b38728" } }).open();
	};

	const input = (value: string, set: (v: string) => void, placeholder: string, type = "text") => <input className="field" type={type} placeholder={placeholder} value={value} onChange={e => set(e.target.value)} />;
	return <main className="store"><style dangerouslySetInnerHTML={{ __html: `*{box-sizing:border-box;font-family:Arial;margin:0;padding:0}body{background:#fdfbf7;color:#111}.store{min-height:100vh}.header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:20px 5%;background:#fff;border-bottom:1px solid #eee}.brand{color:#b38728;letter-spacing:2px}.btn,.field{padding:12px;border-radius:6px;border:1px solid #ddd}.btn{cursor:pointer;font-weight:bold}.btn-dark{background:#111;color:#fff}.content{max-width:1250px;margin:auto;padding:50px 20px}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:35px}.card,.panel{background:#fff;border:1px solid #eee;border-radius:12px;padding:15px}.card img{width:100%;height:320px;object-fit:cover;border-radius:8px}.price{color:#b38728;font-size:22px;font-weight:900}.checkout-container{max-width:900px;margin:auto;display:grid;gap:30px}@media(min-width:768px){.checkout-container{grid-template-columns:1.2fr 1fr}}.field{width:100%;margin-bottom:15px}.cart-item{display:flex;align-items:center;gap:15px;padding:15px 0;border-bottom:1px solid #eee}.qty-controls{display:flex;align-items:center;gap:12px}.qty-controls button{border:0;padding:8px;cursor:pointer}.btn-pay{width:100%;padding:18px;background:#25d366;color:#fff;border:0;border-radius:8px;font-weight:bold}.modal-overlay{position:fixed;inset:0;background:#0009;z-index:5;display:flex;align-items:center;justify-content:center}.modal-content{background:#fff;padding:40px;border-radius:16px;width:90%;max-width:400px}.close-btn{float:right;border:0;background:none;font-size:28px}` }} /><div style={{ background: "#111", color: "#d4af37", padding: 10, textAlign: "center" }}>✨ FREE SHIPPING ON ORDERS ABOVE ₹799 ✨ TRUSTED ALL INDIA DELIVERY ✨</div><header className="header"><h1 className="brand" onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><div>{userName ? `Hi, ${userName}` : <button className="btn" onClick={() => setShowLogin(true)}>LOGIN</button>} <button className="btn btn-dark" onClick={() => count && setCheckout(true)}>🛒 CART ({count})</button></div></header>
		{showLogin && <div className="modal-overlay"><div className="modal-content"><button className="close-btn" onClick={() => setShowLogin(false)}>×</button><h2>Welcome</h2>{input(name, setName, "Full Name")}{input(phone, v => setPhone(v.replace(/\D/g, "").slice(0, 10)), "Mobile Number", "tel")}<button className="btn-pay" onClick={handleLogin}>Verify & Login</button></div></div>}
		<div className="content">{!checkout ? <><section style={{ textAlign: "center", marginBottom: 50 }}><h2>Elegance, <span style={{ color: "#b38728" }}>Redefined.</span></h2><p>Handcrafted premium jewellery for your special moments.</p></section><section className="products">{products.map(p => <article className="card" key={p.id}><img src={p.image} alt={p.name} /><h3>{p.name}</h3><div className="price">₹{p.price.toLocaleString("en-IN")}</div>{cart[p.id] ? <div className="qty-controls"><button onClick={() => change(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => change(p.id, 1)}>+</button></div> : <button className="btn" onClick={() => change(p.id, 1)}>Add to Cart</button>} <button className="btn btn-dark" onClick={() => { change(p.id, 1); setCheckout(true); }}>Buy Now</button></article>)}</section></> : <><button className="btn" onClick={() => setCheckout(false)}>← Back to Shopping</button><div className="checkout-container"><div className="panel"><h2>Your Cart</h2>{products.filter(p => cart[p.id]).map(p => <div className="cart-item" key={p.id}><input type="checkbox" checked={!!selectedItems[p.id]} onChange={() => toggleSelection(p.id)} /> <span style={{ flex: 1 }}>{p.name}<br />₹{p.price}</span><button onClick={() => change(p.id, -1)}>−</button>{cart[p.id]}<button onClick={() => change(p.id, 1)}>+</button></div>)}</div><div className="panel"><h2>🔒 Secure Checkout</h2>{input(name, setName, "Full Name")}{input(email, setEmail, "Email Address", "email")}{input(phone, v => setPhone(v.replace(/\D/g, "").slice(0, 10)), "Mobile Number")}{input(address, setAddress, "Complete Shipping Address")}{input(pincode, v => setPincode(v.replace(/\D/g, "").slice(0, 6)), "Pincode")}<h2>Total: ₹{total.toLocaleString("en-IN")}</h2><button className="btn-pay" disabled={!isFormValid} onClick={handlePayment}>PAY SECURELY</button></div></div></>}</div></main>;
}
