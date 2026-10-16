"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId") || "";

  useEffect(() => {
    router.replace(orderId ? `/success?order_id=${encodeURIComponent(orderId)}` : "/success");
  }, [orderId, router]);

  return <main className="success-page"><section className="success-card" aria-live="polite"><p className="success-eyebrow">Returning from PhonePe</p><h1>Checking your payment...</h1></section></main>;
}

export default function PhonePeReturn() {
  return (
    <Suspense fallback={<main className="success-page"><section className="success-card"><h1>Returning from PhonePe...</h1></section></main>}>
      <CallbackContent />
    </Suspense>
  );
}
