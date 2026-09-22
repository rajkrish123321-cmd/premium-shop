"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

const PRODUCTS = [
	{ id: "prod_1", name: "Akruti Collection Oxidised Navratri Damini Maangtikka", price: 599, stock: 20, image: "/item1.jpg", desc: "Stunning Oxidised Plated Finish." },
	{ id: "prod_2", name: "Etnico 18k Gold Plated Kundan Kamarband/Waist Chain", price: 426, stock: 20, image: "/item2.jpg", desc: "White Stone Studded Belly Chain for Women (B003W)." },
	{ id: "prod_3", name: "Palak Art Heritage Austrian Stone Pearl Necklace Set", price: 1176, stock: 20, image: "/item3.jpg", desc: "White Pearl and Beads with Austrian Stone." },
	{ id: "prod_4", name: "Maharani Jewels Oxidised Pota Stone Pearl Jhumki", price: 305, stock: 20, image: "/item4.jpg", desc: "Black Pearl Jhumki Earrings." },
	{ id: "prod_5", name: "Darshana Jewels Oxidised Plated Dangler Earrings (Large)", price: 77, stock: 20, image: "/item5.jpg", desc: "Oxidised Dangler Earrings." },
	{ id: "prod_6", name: "Darshana Jewels Oxidised Plated Dangler Earrings (Small)", price: 52, stock: 20, image: "/item6.jpg", desc: "Oxidised Dangler Earrings." },
];
type Cart = Record<string, number>;

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Cart>({});
	const [checkout, setCheckout] = useState(false);
	const [form, setForm] = useState({ name: "", email: "", phone: "", alternate: "", address: "", landmark: "", pincode: "" });
	const [paymentStatus, setPaymentStatus] = useState("");
	const subtotal = Object.entries(cart).reduce((sum, [id, quantity]) => sum + (PRODUCTS.find(p => p.id === id)?.price || 0) * quantity, 0);
	const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
	const tax = form.pincode.length === 6 && subtotal ? subtotal * .03 : 0;
	const total = subtotal + tax;
	const setField = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));
	const changeQuantity = (id: string, delta: number) => setCart(c => { const next = (c[id] || 0) + delta; if (next <= 0) { const copy = { ...c }; delete copy[id]; return copy; } const p = PRODUCTS.find(x => x.id === id); return p && next <= p.stock ? { ...c, [id]: next } : c; });
	const pay = async () => {
		if (!form.name || !form.email || form.phone.length < 10 || !form.address || !tax) return;
		if (!(window as any).Razorpay) return alert("Secure payment system loading. Please try again.");
		setPaymentStatus("Initializing secure checkout...");
		try {
			const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total }) });
			const order = await response.json();
			if (!order.orderId) throw new Error("Unable to create order");
			new (window as any).Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency, name: "TRENDY JEWELLERY", order_id: order.orderId, prefill: { name: form.name, email: form.email, contact: form.phone }, theme: { color: "#b38728" }, handler: async (payment: any) => {
				const verified = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
				if ((await verified.json()).success) { alert(`Order confirmed: ${payment.razorpay_payment_id}`); setCart({}); setCheckout(false); }
			}}).open();
		} catch { setPaymentStatus("Payment error. Please try again."); }
	};
	useEffect(() => { if (!subtotal) setCheckout(false); }, [subtotal]);
	const input = (key: keyof typeof form, placeholder: string, type = "text") => <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setField(key, e.target.value.replace(/\D/g, ""))} />;
	return <main><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" /><style>{`main{min-height:100vh;background:#fafafa;color:#111;font-family:Arial;padding:24px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ddd;padding:16px}h1{color:#b38728}button{padding:12px;border:0;border-radius:4px;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1200px;margin:40px auto}.card,.checkout{background:#fff;border:1px solid #eee;padding:16px;border-radius:8px}.card img{width:100%;height:280px;object-fit:cover}.actions{display:flex;gap:8px}.actions button{flex:1}.buy{background:#b38728;color:white}input{box-sizing:border-box;width:100%;padding:14px;border:1px solid #ccc;border-radius:5px;margin:8px 0}.checkout{max-width:620px;margin:40px auto}`}</style><header><h1>TRENDY JEWELLERY</h1><button onClick={() => subtotal && setCheckout(true)}>CART ({count}) • ₹{subtotal.toLocaleString("en-IN")}</button></header>{!checkout ? <section className="grid">{PRODUCTS.map(p => <article className="card" key={p.id}><img src={p.image} alt={p.name} /><h3>{p.name}</h3><p>{p.desc}</p><strong>₹{p.price.toLocaleString("en-IN")}</strong><div className="actions"><button onClick={() => changeQuantity(p.id, 1)}>Add to Cart</button><button className="buy" onClick={() => { changeQuantity(p.id, 1); setCheckout(true); }}>Buy Now</button></div></article>)}</section> : <section className="checkout"><button onClick={() => setCheckout(false)}>← Back to Shop</button><h2>Checkout</h2>{Object.entries(cart).map(([id, quantity]) => { const p = PRODUCTS.find(x => x.id === id)!; return <p key={id}>{p.name} × {quantity} <button onClick={() => changeQuantity(id, -1)}>-</button><button onClick={() => changeQuantity(id, 1)}>+</button></p>; })}<div>{input("name", "Full Name")}{input("email", "Email Address", "email")}{input("phone", "Primary Mobile", "tel")}{input("alternate", "Alternate Mobile (Optional)", "tel")}{input("address", "Full Shipping Address")}{input("landmark", "Landmark (Optional)")}{input("pincode", "Pincode", "tel")}</div><p>Subtotal: ₹{subtotal.toFixed(2)}<br />GST (3%): ₹{tax.toFixed(2)}<br /><b>Total: ₹{total.toFixed(2)}</b></p><button className="buy" disabled={!form.name || !form.email || form.phone.length < 10 || !form.address || !tax} onClick={pay}>{paymentStatus || `Securely Pay ₹${total.toFixed(2)}`}</button></section>}</main>;
}
