export const DEFAULT_PAYEE_VPA = "9507004532@ibl";

export function buildUpiPaymentLink({
  amount,
  orderId,
  payeeVpa = DEFAULT_PAYEE_VPA,
  brandName = "TrendyJewellery",
}: {
  amount: number;
  orderId: string;
  payeeVpa?: string;
  brandName?: string;
}) {
  const safeAmount = Number(amount).toFixed(2);
  const safeBrand = encodeURIComponent(brandName);
  const txNote = encodeURIComponent(`Store Order #${orderId}`);
  const baseStoreUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://your-shop.vercel.app";
  const callbackUrl = encodeURIComponent(`${baseStoreUrl}/checkout/callback?orderId=${orderId}`);

  return `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${safeBrand}&tn=${txNote}&am=${safeAmount}&cu=INR&url=${callbackUrl}&ru=${callbackUrl}`;
}
