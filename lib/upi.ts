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

  return `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${safeBrand}&tr=${encodeURIComponent(orderId)}&tn=${txNote}&am=${safeAmount}&cu=INR`;
}
