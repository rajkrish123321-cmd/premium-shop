"use client";

import { useState } from "react";

type Product = {
	id: string;
	name: string;
	price: number;
	image: string;
	description: string;
};

const PRODUCTS: Product[] = [
	{ id: "prod_1", name: "Oxidised Navratri Damini Maangtikka", price: 599, image: "/item1.jpg", description: "Stunning oxidised plated finish." },
	{ id: "prod_2", name: "18k Gold Plated Kundan Kamarband", price: 426, image: "/item2.jpg", description: "White stone studded waist chain." },
	{ id: "prod_3", name: "Austrian Stone Pearl Necklace Set", price: 1176, image: "/item3.jpg", description: "Pearl and bead necklace with stones." },
	{ id: "prod_4", name: "Oxidised Pota Stone Pearl Jhumki", price: 305, image: "/item4.jpg", description: "Elegant black pearl jhumki earrings." },
	{ id: "prod_5", name: "Oxidised Plated Dangler Earrings", price: 77, image: "/item5.jpg", description: "Statement oxidised dangler earrings." },
	{ id: "prod_6", name: "Oxidised Plated Small Dangler Earrings", price: 52, image: "/item6.jpg", description: "Lightweight everyday earrings." },
];

export default function Page() {
	const [cart, setCart] = useState<Record<string, number>>({});
	const [checkout, setCheckout] = useState(false);

	const total = PRODUCTS.reduce((sum, product) => sum + product.price * (cart[product.id] || 0), 0);
	const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

	const changeQuantity = (id: string, amount: number) => {
		setCart((current) => {
			const quantity = Math.max(0, (current[id] || 0) + amount);
			const next = { ...current };
			if (quantity) next[id] = quantity;
			else delete next[id];
			return next;
		});
	};

	return (
		<main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#fffaf5,#f0edf5)", color: "#171717", fontFamily: "Arial,sans-serif" }}>
			<div style={{ background: "#111", color: "#d4af37", padding: 8, textAlign: "center", fontSize: 12, letterSpacing: 1 }}>FREE SHIPPING • SECURE CHECKOUT • PREMIUM QUALITY</div>
			<header style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 6%", background: "#ffffffdd", backdropFilter: "blur(10px)", borderBottom: "1px solid #eadba9" }}>
				<h1 style={{ margin: 0, color: "#b8860b", letterSpacing: 2, cursor: "pointer" }} onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1>
				<button onClick={() => total && setCheckout(true)} style={{ border: 0, borderRadius: 30, padding: "11px 18px", background: "#111", color: "#d4af37", fontWeight: 700, cursor: total ? "pointer" : "default" }}>🛒 Cart ({count}) · ₹{total.toLocaleString("en-IN")}</button>
			</header>

			<section style={{ maxWidth: 1200, margin: "auto", padding: "55px 20px" }}>
				{!checkout ? <>
					<div style={{ textAlign: "center", marginBottom: 45 }}><h2 style={{ fontSize: 42, fontWeight: 300 }}>Elegance, <strong style={{ color: "#d4af37" }}>Redefined.</strong></h2></div>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 28 }}>
						{PRODUCTS.map((product) => <article key={product.id} style={{ overflow: "hidden", borderRadius: 18, background: "#fff", boxShadow: "0 8px 25px #00000012" }}>
							<div style={{ height: 280, background: "#f7f7f7" }}><img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
							<div style={{ padding: 22 }}><h3>{product.name}</h3><p style={{ color: "#666", minHeight: 38 }}>{product.description}</p><strong style={{ display: "block", color: "#b8860b", fontSize: 23, marginBottom: 18 }}>₹{product.price.toLocaleString("en-IN")}</strong>
								{cart[product.id] ? <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", color: "#fff", borderRadius: 30, padding: 10 }}><button onClick={() => changeQuantity(product.id, -1)} style={buttonStyle}>−</button><span>{cart[product.id]} in cart</span><button onClick={() => changeQuantity(product.id, 1)} style={buttonStyle}>+</button></div> : <div style={{ display: "flex", gap: 10 }}><button onClick={() => changeQuantity(product.id, 1)} style={{ ...buttonStyle, flex: 1, color: "#111", border: "1px solid #111" }}>Add to Cart</button><button onClick={() => { changeQuantity(product.id, 1); setCheckout(true); }} style={{ ...buttonStyle, flex: 1, background: "#111", color: "#fff" }}>Buy Now</button></div>}
							</div>
						</article>)}
					</div>
					{total > 0 && <button onClick={() => setCheckout(true)} style={{ display: "block", margin: "45px auto 0", padding: "17px 35px", border: 0, borderRadius: 30, background: "#d4af37", color: "#fff", fontWeight: 700, fontSize: 16 }}>Proceed to Checkout · ₹{total.toLocaleString("en-IN")}</button>}
				</> : <Checkout total={total} cart={cart} changeQuantity={changeQuantity} back={() => setCheckout(false)} />}
			</section>
		</main>
	);
}

const buttonStyle: React.CSSProperties = { border: 0, background: "transparent", padding: "8px 14px", borderRadius: 25, cursor: "pointer", fontWeight: 700 };

function Checkout({ total, cart, changeQuantity, back }: { total: number; cart: Record<string, number>; changeQuantity: (id: string, amount: number) => void; back: () => void }) {
	return <div style={{ maxWidth: 650, margin: "auto", background: "#ffffffdd", borderRadius: 20, padding: 35, boxShadow: "0 15px 40px #0001" }}>
		<button onClick={back} style={{ border: 0, background: "none", color: "#b8860b", cursor: "pointer" }}>← Return to collection</button><h2>Premium Delivery</h2>
		{Object.entries(cart).map(([id, quantity]) => { const product = PRODUCTS.find((item) => item.id === id); return product && <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee" }}><span>{product.name}<br /><b>₹{product.price}</b></span><span><button onClick={() => changeQuantity(id, -1)} style={buttonStyle}>−</button>{quantity}<button onClick={() => changeQuantity(id, 1)} style={buttonStyle}>+</button></span></div>; })}
		<input placeholder="Full name" style={inputStyle} /><input placeholder="Email address" type="email" style={inputStyle} /><input placeholder="Phone number" style={inputStyle} /><textarea placeholder="Shipping address" style={{ ...inputStyle, minHeight: 90 }} /><input placeholder="Pincode" style={inputStyle} /><h2 style={{ textAlign: "right" }}>Total: ₹{total.toLocaleString("en-IN")}</h2><button style={{ width: "100%", padding: 16, border: 0, borderRadius: 30, background: "#d4af37", color: "white", fontWeight: 700 }}>Secure Payment</button>
	</div>;
}

const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 14, marginTop: 14, border: "1px solid #ddc987", borderRadius: 10, fontSize: 15 };
