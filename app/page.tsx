"use client";

import { useMemo, useState } from "react";
import Script from "next/script";

const PRODUCTS = [
	["prod_1", "Akruti Collection Oxidised Navratri Damini Maangtikka", 599, "/item1.jpg"],
	["prod_2", "Etnico 18k Gold Plated Kundan Kamarband/Waist Chain", 426, "/item2.jpg"],
	["prod_3", "Palak Art Heritage Austrian Stone Pearl Necklace Set", 1176, "/item3.jpg"],
	["prod_4", "Maharani Jewels Oxidised Pota Stone Pearl Jhumki", 305, "/item4.jpg"],
	["prod_5", "Darshana Jewels Oxidised Plated Dangler Earrings (Large)", 77, "/item5.jpg"],
	["prod_6", "Darshana Jewels Oxidised Plated Dangler Earrings (Small)", 52, "/item6.jpg"],
] as const;

type Cart = Record<string, number>;
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Cart>({});
	const [checkout, setCheckout] = useState(false);
	const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", landmark: "", pincode: "" });
	const [status, setStatus] = useState("");

	const subtotal = useMemo(() => PRODUCTS.reduce((sum, [id, , price]) => sum + price * (cart[id] || 0), 0), [cart]);
	const count = Object.values(cart).reduce((a, b) => a + b, 0);
	const gst = form.pincode.length === 6 && subtotal ? subtotal * .03 : 0;
	const total = subtotal + gst;
	const complete = !!(form.name && form.email && form.phone.length >= 10 && form.address && gst);

	const change = (id: string, amount: number) => setCart(old => {
		const quantity = Math.max(0, (old[id] || 0) + amount);
		const next = { ...old };
		if (quantity) next[id] = Math.min(quantity, 20); else delete next[id];
		return next;
	});
	const setField = (key: keyof typeof form, value: string) => setForm(old => ({ ...old, [key]: value }));

	const pay = async () => {
		if (!complete || !(window as any).Razorpay) return;
		setStatus("Initializing secure checkout...");
		try {
			const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total }) });
			const order = await response.json();
			if (!order.orderId) throw new Error("Unable to create order");
			const razorpay = new (window as any).Razorpay({
				key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
				name: "TRENDY JEWELLERY", prefill: { name: form.name, email: form.email, contact: form.phone }, theme: { color: "#b38728" },
				handler: async (payment: any) => {
					setStatus("Verifying payment...");
					const verified = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
					if ((await verified.json()).success) { alert("Order confirmed! Payment ID: " + payment.razorpay_payment_id); setCart({}); setCheckout(false); setStatus(""); }
				},
			});
			razorpay.open();
		} catch { setStatus("Payment could not be initialized. Please try again."); }
	};

	const input = (key: keyof typeof form, placeholder: string, type = "text") => (
		<input type={type} placeholder={placeholder} value={form[key]} onChange={e => setField(key, e.target.value.replace(key === "phone" || key === "pincode" ? /\D/g : /^$/, ""))} maxLength={key === "phone" ? 10 : key === "pincode" ? 6 : undefined} />
	);

	return <main>
		<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
		<style>{`*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111}.gold{background:linear-gradient(90deg,#aa771c,#fcf6ba,#b38728);background-clip:text;-webkit-background-clip:text;color:transparent}.marquee{padding:10px;text-align:center;background:#fafafa;color:#b38728;font-size:12px;font-weight:bold;letter-spacing:1px}header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:22px 5%;background:#fffffff7;border-bottom:1px solid #eee}h1{font-size:26px;letter-spacing:2px;margin:0;cursor:pointer}button{cursor:pointer}input{width:100%;padding:15px;border:1px solid #e5e5e5;border-radius:7px;font-size:15px}.wrap{max-width:1200px;margin:auto;padding:55px 20px}.hero{text-align:center;margin-bottom:50px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:35px}.card{border:1px solid #eee;padding:16px;transition:.25s}.card:hover{transform:translateY(-4px);box-shadow:0 12px 30px #0000000d}.photo{height:300px;background:#fafafa}.photo img{width:100%;height:100%;object-fit:cover}.card h3{font-size:16px;line-height:1.4}.price{color:#b38728;font-size:20px;font-weight:bold}.actions{display:flex;gap:8px}.actions button,.checkout{flex:1;padding:14px;border:1px solid #111;background:white;font-weight:bold}.actions .dark,.dark{background:#111;color:white}.summary,.totals{border:1px solid #eee;padding:22px;margin:25px 0}.checkoutBox{max-width:650px;margin:auto}.fields{display:grid;gap:14px}.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.line{display:flex;justify-content:space-between;margin:12px 0}.pay{width:100%;padding:18px;border:0;background:#111;color:#fff;font-weight:bold;font-size:15px}@media(max-width:600px){header{padding:18px}.row{grid-template-columns:1fr}h1{font-size:20px}}`}</style>
		<div className="marquee">✨ EXCLUSIVE JEWELLERY COLLECTION ✨ SECURE CHECKOUT ✨ NATIONWIDE DELIVERY ✨</div>
		<header><h1 className="gold" onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><button className="dark" onClick={() => subtotal && setCheckout(true)} style={{padding:"12px 18px",border:0}}>CART ({count}) · {money(subtotal)}</button></header>
		<div className="wrap">{!checkout ? <><div className="hero"><h2>Elegance, <span className="gold">Redefined.</span></h2></div><div className="grid">{PRODUCTS.map(([id,name,price,image]) => <article className="card" key={id}><div className="photo"><img src={image} alt={name}/></div><h3>{name}</h3><div className="price">{money(price)}</div>{cart[id] ? <div className="actions"><button onClick={() => change(id,-1)}>-</button><b>{cart[id]} IN CART</b><button onClick={() => change(id,1)}>+</button></div> : <div className="actions"><button onClick={() => change(id,1)}>ADD TO CART</button><button className="dark" onClick={() => { change(id,1); setCheckout(true); }}>BUY NOW</button></div>}</article>)}</div>{subtotal > 0 && <p style={{textAlign:"center",marginTop:45}}><button className="dark" style={{padding:"18px 45px",border:0,fontWeight:"bold"}} onClick={() => setCheckout(true)}>PROCEED TO CHECKOUT</button></p>}</> : <section className="checkoutBox"><button onClick={() => setCheckout(false)} style={{border:0,background:"none",color:"#b38728",fontWeight:"bold"}}>← BACK TO SHOP</button><h2>CHECKOUT</h2><div className="summary"><b>ORDER SUMMARY</b>{PRODUCTS.filter(([id]) => cart[id]).map(([id,name,price]) => <div className="line" key={id}><span>{name} × {cart[id]}</span><span>{money(price * cart[id])}</span></div>)}</div><div className="fields"><h3>SHIPPING DETAILS</h3>{input("name","Full Name") }<div className="row">{input("email","Email Address","email")}{input("phone","Phone Number","tel")}</div>{input("address","Full Shipping Address")}{<div className="row">{input("landmark","Landmark (Optional)")}{input("pincode","Pincode")}</div>}</div><div className="totals"><div className="line"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="line"><span>GST (3%)</span><span>{gst ? money(gst) : "Enter pincode"}</span></div><div className="line" style={{fontSize:22,fontWeight:"bold",borderTop:"1px solid #eee",paddingTop:14}}><span>Total</span><span>{money(total)}</span></div></div><button className="pay" disabled={!complete} onClick={pay}>{status || (complete ? `PAY ${money(total)}` : "COMPLETE FORM TO PAY")}</button></section>}</div>
	</main>;
}
