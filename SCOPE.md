# Oraya demo — scope

## What this is

A working Next.js page where a visitor picks a points package, pays via
Paystack, and automatically receives a confirmation email — while the
actual Oraya platform account behind it is still created by hand. This
is the first real, money-moving piece of Oraya, built ahead of the
platform itself.

## In scope for this phase

- Landing/pricing page in Oraya's brand system (dark theme, aura accent,
  Familjen Grotesk / IBM Plex fonts), sourced from the published brand
  guidelines.
- Three pricing tiers — Starter, Growth, Enterprise — with numbers taken
  directly from `Oraya_Points-Pricing-Model.pdf`. Not placeholders.
- Paystack Inline JS checkout, triggered client-side with the public key.
- Server-side payment verification against Paystack's own API — the
  client's claim of success is never trusted on its own.
- A webhook that is the *only* trigger for the confirmation email, and
  that independently re-checks the paid amount against the claimed plan
  before doing anything (see "Security model" below).
- A confirmation email via Resend that tells the customer their payment
  went through and login details are coming — not the login details
  themselves.
- A basic, explicitly-labeled-as-temporary duplicate-webhook guard.

## Explicitly out of scope for this phase

Don't build these unless the plan changes — they're deferred on purpose,
not forgotten:

- **Automated account creation** on the video platform. A human creates
  the account and sends real login details, by design, for now.
- **A database.** Nothing here persists anything. The in-memory
  duplicate-webhook guard is a stopgap, not a schema — see the
  implementation checklist for what replaces it before launch.
- **Login/auth on this landing page itself.** There's no concept of a
  logged-in visitor here — just an email address collected at checkout.
- **Refunds, disputes, or subscription/recurring billing.** These are
  one-time package purchases.
- **Multi-currency.** NGN only, matching Paystack's primary market.
- **An admin dashboard** for viewing purchases. Purchases are currently
  only visible in the Paystack dashboard and Resend's send log.
- **Automated team notification** on a new sale (Slack, email-to-team,
  etc.). This is flagged with a `TODO` in the webhook but not built —
  see the implementation checklist, Phase 4.

If any of the above turns out to be needed sooner than expected, treat
it as a scope change worth a real conversation, not something to quietly
add — several of these (a database, account automation) change the
security model this was built around.

## Architecture

```
app/
  page.tsx                          → landing + pricing UI, opens Paystack popup
  api/
    checkout/verify/route.ts        → client-triggered, UI feedback ONLY
    paystack/webhook/route.ts       → server-triggered, the real source of truth
lib/
  plans.ts                          → the ONE trusted source for prices/points
  paystack.ts                       → server-side Paystack verification
  email.ts                          → Resend client + confirmation email template
```

**Flow:** visitor picks a plan → enters email → Paystack popup opens with
the public key → on success, the browser pings `/api/checkout/verify`
purely to update the on-screen message → independently, Paystack's own
servers call `/api/paystack/webhook` → that webhook checks the request
is genuinely from Paystack (signature), checks the amount actually paid
against `lib/plans.ts` (not against anything the browser claimed), and
only then sends the confirmation email.

## Security model — decisions already made, don't relitigate

- **The browser is never trusted to state a price.** Every plan/price
  fact the webhook acts on is re-derived from `lib/plans.ts` and checked
  against what Paystack itself reports was captured.
- **Fulfillment happens from the webhook, never from the client-facing
  verify route.** The verify route only controls what the page displays;
  it has no side effects.
- **The secret key never reaches the browser.** `lib/paystack.ts` and
  `lib/email.ts` both import `server-only` specifically so this fails at
  build time if that's ever violated by accident.
- **The confirmation email never contains login credentials.** Account
  creation is manual, so the email only sets expectations correctly.

## Decisions already made (so these don't get relitigated)

- Payment gateway: **Paystack**.
- Email service: **Resend**.
- Backend: **Next.js API routes** — not a separate Express/Node server.
- Pricing: locked to `Oraya_Points-Pricing-Model.pdf`; customers are
  charged the VAT-inclusive total, and the page sells generation minutes,
  never a finished-clip count (the source doc is explicit about why).
