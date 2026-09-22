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
  const [checkout, setCheckout] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [details, setDetails] = useState({ name: "", email: "", phone: "", address: "", pincode: "" });
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = useMemo(() => products.reduce((sum, p) => sum + p.price * (selected[p.id] ? cart[p.id] || 0 : 0), 0), [cart, selected]);

  const change = (id: string, delta: number) => setCart(old => {
    const quantity = Math.max(0, (old[id] || 0) + delta);
    const next = { ...old };
    if (quantity) next[id] = quantity; else delete next[id];
    if (quantity && !old[id]) setSelected(s => ({ ...s, [id]: true }));
    return next;
  });
  const update = (key: keyof typeof details, value: string) => setDetails(d => ({ ...d, [key]: value }));
  const valid = details.name.length > 2 && details.email.includes("@") && details.phone.length === 10 && details.address.length > 5 && details.pincode.length === 6 && total > 0;

  return <main className="store">
    <style>{`*{box-sizing:border-box}body{margin:0;background:#fdfbf7;color:#111;font-family:Segoe UI,Arial,sans-serif}.top{background:#111;color:#d4af37;text-align:center;padding:11px;font-weight:700;letter-spacing:1px}.header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:20px 5%;background:#fffffff2;border-bottom:1px solid #eee}.brand{color:#b38728;letter-spacing:2px}.btn{padding:12px 20px;border:0;border-radius:6px;cursor:pointer;font-weight:700}.dark{background:#111;color:#fff}.gold{background:#b38728;color:#fff}.content{max-width:1250px;margin:auto;padding:45px 20px}.hero{text-align:center;margin-bottom:45px}.hero h2{font-size:36px}.hero span,.price{color:#b38728}.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:30px}.card,.panel{background:#fff;border:1px solid #eee;border-radius:16px;padding:18px;box-shadow:0 10px 30px #00000008}.card{transition:.3s}.card:hover{transform:translateY(-8px);box-shadow:0 20px 40px #b3872833}.card img{width:100%;height:300px;object-fit:cover;border-radius:10px}.card h3{height:42px;text-align:center;font-size:16px}.price{text-align:center;font-size:22px;font-weight:900;margin:15px}.actions{display:flex;gap:10px}.actions>*{flex:1}.checkout{max-width:900px;margin:auto;display:grid;grid-template-columns:1fr 1fr;gap:25px}.item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #eee}.item img{width:55px;height:55px;object-fit:cover;border-radius:7px}.item main{flex:1}.qty{display:flex;align-items:center;gap:12px}.qty button{border:0;background:#eee;border-radius:50%;width:28px;height:28px;cursor:pointer}.field{width:100%;padding:14px;margin-bottom:14px;border:1px solid #ddd;border-radius:7px;font-size:15px}.pay{width:100%;padding:16px;border:0;border-radius:8px;font-weight:800;background:#ddd;color:#888}.pay.ready{background:#25a866;color:#fff;cursor:pointer}.back{margin-bottom:20px}@media(max-width:700px){.checkout{grid-template-columns:1fr}.header{padding:15px}.brand{font-size:18px}.hero h2{font-size:28px}}`}</style>
    <div className="top">✨ FREE SHIPPING ON ORDERS ABOVE ₹799 ✨ TRUSTED ALL INDIA DELIVERY ✨ 100% SECURE CHECKOUT ✨</div>
    <header className="header"><h1 className="brand" onClick={() => setCheckout(false)}>TRENDY JEWELLERY</h1><button className="btn dark" onClick={() => count && setCheckout(true)}>🛒 CART ({count})</button></header>
    <div className="content">{!checkout ? <><section className="hero"><h2>Elegance, <span>Redefined.</span></h2><p>Handcrafted premium jewellery for your special moments.</p></section><section className="products">{products.map(p => <article className="card" key={p.id}><img src={p.image} alt={p.name}/><h3>{p.name}</h3><div className="price">₹{p.price.toLocaleString("en-IN")}</div><div className="actions">{cart[p.id] ? <div className="qty"><button onClick={() => change(p.id,-1)}>−</button><b>{cart[p.id]}</b><button onClick={() => change(p.id,1)}>+</button></div> : <button className="btn" onClick={() => change(p.id,1)}>Add to Cart</button>}<button className="btn gold" onClick={() => { change(p.id,1); setCheckout(true); }}>Buy Now</button></div></article>)}</section></> : <><button className="btn back" onClick={() => setCheckout(false)}>← Back to Shopping</button><div className="checkout"><section className="panel"><h2>Your Cart</h2>{products.filter(p => cart[p.id]).map(p => <div className="item" key={p.id}><input type="checkbox" checked={!!selected[p.id]} onChange={() => setSelected(s => ({...s,[p.id]:!s[p.id]}))}/><img src={p.image} alt=""/><main><b>{p.name}</b><div className="price">₹{p.price}</div></main><div className="qty"><button onClick={() => change(p.id,-1)}>−</button>{cart[p.id]}<button onClick={() => change(p.id,1)}>+</button></div></div>)}</section><section className="panel"><h2>🔒 Secure Checkout</h2>{([['name','Full Name'],['email','Email Address'],['phone','Mobile Number'],['address','Shipping Address'],['pincode','Pincode']] as const).map(([key,placeholder]) => <input key={key} className="field" placeholder={placeholder} value={details[key]} onChange={e => update(key,key === 'phone' || key === 'pincode' ? e.target.value.replace(/\D/g,'') : e.target.value)}/>)}<h2>Total: <span className="price">₹{total.toLocaleString('en-IN')}</span></h2><button className={`pay ${valid ? 'ready' : ''}`} disabled={!valid} onClick={() => alert('Payment integration is ready to connect.')}>PAY SECURELY</button></section></div></>}</div>
  </main>;
}