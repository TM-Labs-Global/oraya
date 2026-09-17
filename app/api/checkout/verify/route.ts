// app/api/checkout/verify/route.ts
//
// Called from the browser right after the Paystack popup reports success,
// purely so the page can show an immediate "you're confirmed" state.
//
// This does NOT send the confirmation email — the webhook does that.
// This route can be skipped, fail, or double-fire with zero consequence
// to the customer; it only controls what the page shows them right now.

import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const result = await verifyPaystackTransaction(reference);
    return NextResponse.json({ success: result.success });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
