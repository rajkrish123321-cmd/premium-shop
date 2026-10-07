const PRODUCT_PRICES: Record<string, number> = {
  "1": 599,
  "2": 426,
  "3": 1176,
  "4": 305,
  "5": 77,
  "6": 52,
};

export function getCartPricing(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const cart: Record<string, number> = {};
  let subtotal = 0;

  for (const [id, quantity] of Object.entries(value)) {
    if (!PRODUCT_PRICES[id] || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 30) {
      return null;
    }
    cart[id] = quantity;
    subtotal += PRODUCT_PRICES[id] * quantity;
  }

  if (!Object.keys(cart).length) return null;

  const tax = Math.round(subtotal * 0.03);
  return { cart, subtotal, tax, total: subtotal + tax };
}