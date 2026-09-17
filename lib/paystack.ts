// lib/paystack.ts
// Server-side only — uses the secret key. Never import this from a
// client component ("use client") or it'll get bundled into the browser.
// The "server-only" import below turns that mistake into a build error
// instead of a silent leak.
import "server-only";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export interface PaystackVerifyResult {
  success: boolean;
  reference: string;
  amountKobo: number;
  currency: string;
  email: string | undefined;
  planName: string | undefined;
  points: number | undefined;
  gatewayStatus: string; // "success" | "failed" | "abandoned" | ...
}

/**
 * Confirms a transaction directly with Paystack's servers using the secret
 * key. Never trust a "success" reported by the client-side popup alone —
 * always re-check here before treating a payment as real.
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResult> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not set in the environment.");
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Paystack verify request failed (${res.status})`);
  }

  const json = await res.json();
  const data = json.data;

  return {
    success: json.status === true && data.status === "success",
    reference: data.reference,
    amountKobo: data.amount,
    currency: data.currency,
    email: data.customer?.email,
    planName: data.metadata?.planName,
    points: data.metadata?.points,
    gatewayStatus: data.status,
  };
}
