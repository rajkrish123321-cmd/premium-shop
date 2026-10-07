const PRODUCTS: Record<string, { name: string; price: number }> = {
  "1": { name: "Akruti Oxidised Damini Maangtikka", price: 599 },
  "2": { name: "Etnico 18k Kundan Kamarband", price: 426 },
  "3": { name: "Palak Art Austrian Stone Necklace", price: 1176 },
  "4": { name: "Maharani Oxidised Stone Jhumki", price: 305 },
  "5": { name: "Darshana Oxidised Dangler (Type A)", price: 77 },
  "6": { name: "Darshana Oxidised Dangler (Type B)", price: 52 },
};

export function getCartPricing(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const cart: Record<string, number> = {};
  const items: Array<{ id: string; name: string; unitPrice: number; quantity: number; lineTotal: number }> = [];
  let subtotal = 0;

  for (const [id, quantity] of Object.entries(value)) {
    const product = PRODUCTS[id];
    if (!product || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 30) {
      return null;
    }
    cart[id] = quantity;
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    items.push({ id, name: product.name, unitPrice: product.price, quantity, lineTotal });
  }

  if (!Object.keys(cart).length) return null;

  const tax = Math.round(subtotal * 0.03);
  return { cart, items, subtotal, tax, total: subtotal + tax };
}