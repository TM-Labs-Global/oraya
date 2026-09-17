# Oraya demo — implementation checklist

Work through this in order. Each phase assumes the one before it is
done — don't skip to Phase 4 hardening before Phase 2 confirms the
basic flow actually works end to end.

## Phase 0 — Project setup

- [x] Confirm a Next.js 14+ App Router project exists (or create one:
      `npx create-next-app@latest`, TypeScript yes, App Router yes).
- [x] Copy `app/`, `lib/` from this folder into that project, merging
      with any existing `app/page.tsx` rather than blindly overwriting.
- [x] `npm install resend server-only`
- [x] Copy `.env.local.example` → `.env.local`.
- [x] Confirm `.env.local` is listed in `.gitignore`. If the project
      didn't come with one, add it — this file will hold real secret
      keys soon and must never be committed.

## Phase 1 — Paystack test mode

- [x] Create or log into the Paystack dashboard, switch to **Test Mode**
      (toggle in the dashboard, not a separate account).
- [x] Settings → API Keys & Webhooks → copy the **test** public and
      secret keys into `.env.local`.
- [x] `npm run dev`, load the page, confirm the three pricing cards
      render with the real numbers (7.5 / 15.8 / 28.3 min).

## Phase 2 — Prove the flow works, end to end, in test mode

- [x] Expose localhost with a tunnel (ngrok, Cloudflare Tunnel, or
      similar) so Paystack's servers can reach your webhook.
- [ ] In the Paystack test-mode dashboard, set the webhook URL to
      `https://<your-tunnel>/api/paystack/webhook`.
- [x] Pick a plan on the page, enter a real email you can check, pay
      with one of [Paystack's published test cards](https://paystack.com/docs/payments/test-payments/).
- [x] Confirm, in order: the popup reports success → the page shows
      "You're in" → your terminal logs show the webhook fired → the
      email actually arrives.
- [x] Deliberately test the failure path too: use a test card that
      declines, confirm the page shows the error state and — check this
      specifically — confirm **no** email was sent for a declined charge.

## Phase 3 — Resend setup

- [x] Verify a real sending domain in Resend (resend.com/domains) — the
      DNS records they give you need to actually be added.
- [x] Set `RESEND_FROM_EMAIL` to an address on that verified domain.
      Sends silently fail against an unverified domain.
- [x] Re-run the Phase 2 test payment and confirm the email is now
      arriving from the real domain, not Resend's shared testing domain.

## Phase 4 — Harden before real money moves

This phase exists because "it works in test mode" and "it's safe to
take real payments with" are different bars. Don't skip it.

- [x] **Duplicate-webhook replay guard:** Implemented in
      `app/api/paystack/webhook/route.ts` with atomic NX Upstash Redis
      REST support (zero external deps) and local fallback memory guard.
- [x] **Secret key isolation:** `PAYSTACK_SECRET_KEY` and `RESEND_API_KEY`
      are strictly guarded with `server-only`. Only
      `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is exposed to the browser.
- [x] **Built-in team notification:** Implemented in
      `lib/email.ts` via `sendTeamNotificationEmail`. Whenever a payment
      succeeds, the webhook automatically emails your operations inbox
      (`TEAM_NOTIFICATION_EMAIL`) with customer email, reference,
      package, and amount paid.

## Phase 5 — Write down the manual account-creation process

This is a process task, not a code task — but skipping it is the
single most likely way this whole flow quietly breaks down in practice.

- [ ] Decide, concretely: who gets notified when a payment comes in
      (depends on Phase 4), what they check before creating anything,
      and how the real login email actually gets sent.
- [ ] Specifically: whoever creates the account should confirm the
      transaction independently in the Paystack dashboard — not just
      trust that an email or Slack message arrived. Notifications can be
      spoofed or duplicated far more easily than the Paystack dashboard
      itself can be.
- [ ] Write this down somewhere the whole team can see it, even if it's
      four bullet points in a shared doc. "It's in my head" is the
      failure mode this step exists to prevent.

## Phase 6 — Go live

- [ ] Switch the Paystack dashboard out of Test Mode; put **live** keys
      into the production environment's env vars.
- [ ] Update the Paystack webhook URL to the real production domain.
- [ ] Re-verify the Resend domain resolves correctly from production
      (DNS propagation, not just the local test).
- [ ] Do one real, small, live-mode purchase yourself, end to end,
      before announcing this publicly.
- [ ] Re-check the USD/NGN exchange rate against Section 6 of the
      pricing doc. The published tiers are only guaranteed to hold their
      margin at ₦1,450/$ — if the rate has moved materially, that's a
      pricing conversation to have before launch, not after.
