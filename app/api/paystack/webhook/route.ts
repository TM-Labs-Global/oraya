// app/api/paystack/webhook/route.ts
//
// This is the authoritative source of truth for a successful payment.
// Paystack calls this directly from their own servers, so it fires even
// if the customer closes the tab the second the popup says "success" —
// which is exactly why the confirmation email is sent from HERE and not
// from the client-triggered verify route.
//
// Set this URL in the Paystack dashboard: Settings → API Keys & Webhooks
//   https://yourdomain.com/api/paystack/webhook

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendPaymentConfirmationEmail, sendTeamNotificationEmail } from "@/lib/email";
import { getPlanById } from "@/lib/plans";

// In-memory duplicate guard used as fallback if Upstash Redis is not configured.
const processedReferences = new Set<string>();

async function isDuplicateReference(reference: string): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      // Atomic NX set with 7-day TTL (604800s)
      const res = await fetch(`${upstashUrl}/set/${encodeURIComponent(reference)}/1?nx=true&ex=604800`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
      });
      const data = await res.json();
      return data.result !== "OK";
    } catch (e) {
      console.error("Upstash duplicate check failed, using local fallback:", e);
    }
  }

  if (processedReferences.has(reference)) {
    return true;
  }
  processedReferences.add(reference);
  return false;
}

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("PAYSTACK_SECRET_KEY is not set.");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();

  // Verify this request genuinely came from Paystack before trusting
  // anything in it — this is the same check Paystack's own docs specify.
  const signature = req.headers.get("x-paystack-signature");
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { customer, metadata, reference, amount } = event.data;
    const email: string | undefined = customer?.email;

    // The client chose a plan and sent its id along at checkout — but the
    // client is not a trusted source. `amount` above is the one number in
    // this whole payload that Paystack itself is vouching for, since it's
    // what was actually captured, not what the browser claimed it was for.
    const claimedPlanId: string | undefined = metadata?.planId;
    const plan = getPlanById(claimedPlanId);

    if (!plan) {
      console.error(
        `Webhook for reference ${reference}: unrecognized planId "${claimedPlanId}". Not fulfilling — investigate manually.`
      );
      return NextResponse.json({ received: true });
    }

    const expectedKobo = plan.totalNaira * 100;
    if (amount !== expectedKobo) {
      console.error(
        `Webhook for reference ${reference}: paid ${amount} kobo but "${plan.name}" costs ${expectedKobo} kobo. ` +
          `Possible tampering — not fulfilling, investigate this reference manually before refunding or granting anything.`
      );
      return NextResponse.json({ received: true });
    }

    // Only now — real charge, confirmed amount, matches a real plan — do
    // we check duplicates and dispatch confirmation.
    const isDuplicate = await isDuplicateReference(reference);
    if (isDuplicate) {
      console.warn(`Webhook for reference ${reference} already processed — skipping duplicate.`);
      return NextResponse.json({ received: true });
    }

    if (email) {
      try {
        await sendPaymentConfirmationEmail(email, plan.name, plan.points);
      } catch (err) {
        console.error("Failed to send customer confirmation email:", err);
      }

      // Notify internal team if TEAM_NOTIFICATION_EMAIL is configured
      const teamEmail = process.env.TEAM_NOTIFICATION_EMAIL;
      if (teamEmail) {
        try {
          await sendTeamNotificationEmail(teamEmail, email, plan.name, plan.points, reference, plan.totalNaira);
        } catch (err) {
          console.error("Failed to send internal team notification email:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
