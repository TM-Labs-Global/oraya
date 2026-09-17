"use client";

import { useState, useEffect, Suspense } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { plans, getPlanById, type Plan } from "@/lib/plans";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number; // in kobo
        currency?: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

type CheckoutState = "idle" | "processing" | "success" | "error";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planQuery = searchParams.get("plan");

  const [selectedPlan, setSelectedPlan] = useState<Plan>(() => {
    return getPlanById(planQuery) || plans.find((p) => p.recommended) || plans[0];
  });
  const [email, setEmail] = useState("");
  const [state, setState] = useState<CheckoutState>("idle");
  const [verifiedReference, setVerifiedReference] = useState<string | null>(null);

  useEffect(() => {
    const found = getPlanById(planQuery);
    if (found && found.id !== selectedPlan.id) {
      setSelectedPlan(found);
    }
  }, [planQuery]);

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const plan = getPlanById(e.target.value);
    if (plan) {
      setSelectedPlan(plan);
      router.replace(`/checkout?plan=${plan.id}`, { scroll: false });
    }
  }

  function startCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!publicKey) {
      alert("Paystack public key is not configured.");
      return;
    }
    if (!window.PaystackPop) {
      alert("Paystack payment engine is initializing. Please try again in a few seconds.");
      return;
    }

    setState("processing");

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount: selectedPlan.totalNaira * 100, // VAT-inclusive total in kobo
      currency: "NGN",
      metadata: {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        points: selectedPlan.points,
      },
      callback: (response) => {
        setVerifiedReference(response.reference);
        fetch(`/api/checkout/verify?reference=${encodeURIComponent(response.reference)}`)
          .then((r) => r.json())
          .then((data) => setState(data.success ? "success" : "error"))
          .catch(() => setState("error"));
      },
      onClose: () => {
        if (state === "processing") {
          setState("idle");
        }
      },
    });

    handler.openIframe();
  }

  const vatAmount = selectedPlan.totalNaira - selectedPlan.listedNaira;

  return (
    <div className="checkout-container">
      <header className="checkout-header">
        <Link href="/" className="back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Plans
        </Link>
        <Link href="/" className="brand-link">
          <svg viewBox="0 0 120 120" width="32" height="32">
            <defs>
              <radialGradient id="g" cx="35%" cy="35%" r="75%">
                <stop offset="0%" stopColor="#F2871E" />
                <stop offset="45%" stopColor="#E5502E" />
                <stop offset="100%" stopColor="#D6407A" />
              </radialGradient>
            </defs>
            <circle cx="52" cy="62" r="36" fill="none" stroke="#F1F1F2" strokeWidth="6" />
            <circle cx="82" cy="34" r="18" fill="url(#g)" />
          </svg>
          <span className="brand-name">Oraya</span>
        </Link>
      </header>

      {state === "success" ? (
        <section className="checkout-card receipt-card">
          <div className="success-icon-badge">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E5502E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1>Payment Confirmed!</h1>
          <p className="receipt-card-subtitle">
            You are enrolled in the <strong>{selectedPlan.name}</strong> package ({selectedPlan.points.toLocaleString()} points).
          </p>
          <div className="receipt-summary-box">
            <div className="receipt-data-row">
              <span>Account Email</span>
              <strong>{email}</strong>
            </div>
            {verifiedReference && (
              <div className="receipt-data-row">
                <span>Transaction Reference</span>
                <strong className="monospace">{verifiedReference}</strong>
              </div>
            )}
            <div className="receipt-data-row">
              <span>Amount Paid</span>
              <strong>₦{selectedPlan.totalNaira.toLocaleString()} NGN</strong>
            </div>
          </div>
          <p className="receipt-closing-message">
            A confirmation receipt has been sent to your inbox. We are provisioning your generation account manually—your platform credentials will land shortly.
          </p>
          <Link href="/" className="home-return-button">
            Return to Homepage
          </Link>
        </section>
      ) : (
        <div className="checkout-grid">
          {/* Order Summary Column */}
          <section className="checkout-card">
            <div className="card-header-row">
              <h2>Order Summary</h2>
              <div className="plan-select-box">
                <label htmlFor="plan-select">Package</label>
                <select id="plan-select" value={selectedPlan.id} onChange={handlePlanChange}>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.minutes} min) — ₦{p.totalNaira.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="package-hero-box">
              <div className="package-title-row">
                <span className="package-title">{selectedPlan.name}</span>
                {selectedPlan.recommended && <span className="tag-recommended">Recommended</span>}
              </div>
              <div className="package-minutes-row">
                <span className="minutes-num">{selectedPlan.minutes}</span>
                <span className="minutes-text">minutes of AI video generation</span>
              </div>
              <div className="pills-row">
                <span className="pill-item">{selectedPlan.points.toLocaleString()} points</span>
                <span className="pill-item">₦{selectedPlan.perSecondNaira} / sec</span>
                <span className="pill-item">2 points = 1 sec</span>
              </div>
            </div>

            <div className="pricing-table">
              <div className="pricing-row">
                <span>Base Package</span>
                <span>₦{selectedPlan.listedNaira.toLocaleString()}</span>
              </div>
              <div className="pricing-row">
                <span>VAT (7.5%)</span>
                <span>₦{vatAmount.toLocaleString()}</span>
              </div>
              <div className="pricing-row total-line">
                <span>Total Due</span>
                <span className="total-amount">₦{selectedPlan.totalNaira.toLocaleString()}</span>
              </div>
            </div>

            <div className="terms-box">
              <p>• Retries are billed at the standard rate (2 points = 1s). Buys generation time, not finished clips.</p>
              <p>• Points never expire. Purchases are final and non-refundable.</p>
            </div>
          </section>

          {/* Payment & Email Column */}
          <section className="checkout-card">
            <h2>Customer Details</h2>
            <p className="card-instruction">
              Enter the email where you want your generation account confirmation and access delivered.
            </p>

            <form onSubmit={startCheckout}>
              <div className="input-field-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === "processing"}
                  autoFocus
                />
              </div>

              {state === "error" && (
                <div className="error-banner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Payment was not completed or verification failed. Please try again.
                </div>
              )}

              <button type="submit" className="submit-cta" disabled={state === "processing"}>
                {state === "processing" ? "Opening Secure Checkout…" : `Pay ₦${selectedPlan.totalNaira.toLocaleString()} Now`}
              </button>
            </form>

            <div className="security-footer">
              <div className="security-point">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Secured by Paystack</span>
              </div>
              <div className="security-point">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Bank-grade 256-bit encryption</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <main className="checkout-page-wrapper">
        <Suspense fallback={<div className="loading">Loading checkout…</div>}>
          <CheckoutContent />
        </Suspense>
      </main>
    </>
  );
}
