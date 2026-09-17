# Oraya landing + pricing page

**Start with `SCOPE.md` and `IMPLEMENTATION_CHECKLIST.md`** — they define
what's actually in scope for this phase and the order to build it in.
This file is setup detail; those two are the plan.

Drop `app/page.tsx`, `app/api/**`, and `lib/**` into an existing Next.js
(App Router) project. Install the dependencies this uses:

```
npm install resend server-only
```

(`next/font/google` and `next/script` are already part of Next.js —
nothing else to add.)

## Before this can take a real payment

1. **Copy `.env.local.example` to `.env.local`** and fill in real keys —
   Paystack test keys to start, live keys only once you've tested a real
   test-mode payment end to end.

2. **Point Paystack's webhook at this app.** In the Paystack dashboard →
   Settings → API Keys & Webhooks, set the webhook URL to:
   `https://yourdomain.com/api/paystack/webhook`
   This is what actually triggers the confirmation email — see the
   comment at the top of that file for why.

3. **Verify a sending domain in Resend** (resend.com/domains) and put a
   real address on it into `RESEND_FROM_EMAIL`. Resend will silently
   reject sends from an unverified domain otherwise.

4. **Pricing is live, not placeholder** — the three tiers in `app/page.tsx` (Starter/Growth/Enterprise) are pulled directly from `Oraya_Points-Pricing-Model.pdf`. Two things from that doc are enforced in the code and shouldn't be casually "simplified" later:
   - Paystack charges `totalNaira` (the VAT-inclusive total), never `listedNaira`.
   - The page shows generation minutes, never a finished-clip count — the source doc is explicit that retries are billed at full rate, so a clip count would be a promise the business can't keep.
   - If the batch cost or exchange rate changes, re-derive the per-tier numbers from the pricing doc's method (Sections 1–4) rather than guessing new round numbers.

## What's NOT built yet, on purpose

- **Account creation.** The confirmation email deliberately does not
  contain login details — it tells the customer credentials are coming.
  Right now that means: after a payment comes in, a real person needs to
  go create the account and send a second email with the actual login.
  The `TODO` comments in `app/api/paystack/webhook/route.ts` mark where
  to hook in a team notification (Slack, a spreadsheet row, whatever)
  so that doesn't get missed.
- **Idempotency on the webhook.** There's an in-memory guard now, so a
  quick duplicate won't double-send — but it resets on every deploy and
  doesn't work across multiple server instances. See `SCOPE.md`'s
  security model and Phase 4 of `IMPLEMENTATION_CHECKLIST.md` for the
  persistent-store replacement this needs before real launch.
- **Currency.** Hardcoded to NGN, matching Paystack's primary market —
  change this if that's wrong.

## A security note on the client → server split

Only the *public* Paystack key is ever visible in the browser — that's
by design, it can open a checkout and nothing else. Card details never
touch this codebase at all; they're entered inside Paystack's own popup,
which is also why this app isn't in PCI-DSS scope.

The one thing that **is** set in the browser is which plan the customer
claims to be paying for (`metadata.planId`, sent when the popup opens).
That's not trustworthy on its own — someone could tamper with it via dev
tools. So the webhook in `app/api/paystack/webhook/route.ts` re-derives
the real price from `lib/plans.ts` (the one file both the page and the
server read from) and checks it against the amount Paystack itself
reports was actually captured. If those don't match, it logs the
reference for manual review and does **not** send the confirmation email
— it never fulfills based on what the client claimed, only on what
Paystack confirms was paid, cross-checked against a price the client
can't touch.

