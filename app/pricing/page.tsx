"use client";

import { useState } from "react";
import Link from "next/link";
import { plans } from "@/lib/plans";

const pricingFaqs = [
  {
    q: "How do generation points work?",
    a: "2 points equals exactly 1 second of AI video generation. For example, the Growth package gives you 1,900 points, which translates to 15.8 minutes of raw generation time. Your balance and exact job cost are always displayed in points before you start any generation.",
  },
  {
    q: "Do my purchased points expire?",
    a: "No. Points never expire. Once purchased, your balance remains in your account indefinitely until you choose to use it.",
  },
  {
    q: "Why are retries billed at the standard rate?",
    a: "Every video generation consumes the same dedicated GPU compute cluster time whether you decide to keep the clip for your final cut or re-roll the prompt. We believe in complete transparency: you are buying generation compute time, not a pre-determined count of finished clips.",
  },
  {
    q: "Can I upgrade to a bigger package later?",
    a: "Yes. Every package is a one-time, top-up purchase — buy Starter today and add a Growth or Enterprise package whenever you need more credits. Nothing expires and nothing is lost in between.",
  },
  {
    q: "Who owns the rights to the generated films?",
    a: "You retain 100% full commercial ownership of all clips, storyboards, and audio generated through your Oraya account. You are free to distribute, monetize, and screen your films anywhere without royalty fees.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function toggleFaq(index: number) {
    setOpenFaq(openFaq === index ? null : index);
  }

  return (
    <div className="landing-wrapper">
      {/* Global Sticky Navigation */}
      <nav className="site-nav section-light">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <svg className="nav-mark" viewBox="0 0 120 120">
              <defs>
                <radialGradient id="g-nav-pricing" cx="35%" cy="35%" r="75%">
                  <stop offset="0%" stopColor="#F2871E" />
                  <stop offset="45%" stopColor="#E5502E" />
                  <stop offset="100%" stopColor="#D6407A" />
                </radialGradient>
              </defs>
              <circle cx="52" cy="62" r="36" fill="none" stroke="currentColor" strokeWidth="6" />
              <circle cx="82" cy="34" r="18" fill="url(#g-nav-pricing)" />
            </svg>
            <span className="brand-text">Oraya</span>
          </Link>

          <div className="nav-links">
            <Link href="/#workflow" className="nav-link">Workflow</Link>
            <Link href="/#capabilities" className="nav-link">Capabilities</Link>
            <Link href="/#models" className="nav-link">Models</Link>
            <Link href="/#showcase" className="nav-link">Showcase</Link>
            <Link href="/pricing" className="nav-link">Pricing</Link>
            <Link href="/#faq" className="nav-link">FAQ</Link>
          </div>

          <Link href="#packages" className="nav-cta">
            Get Started
          </Link>
        </div>
      </nav>

      <main>
        {/* Page Header */}
        <section className="hero section-light">
          <div className="wrap">
            <div className="pricing-page-header">
              <div className="kicker">Access</div>
              <h1>Simple pricing.<br />Buy generation time.</h1>
              <p className="lede" style={{ marginTop: 20, marginBottom: 0 }}>
                One-time purchase in Naira via Paystack. No subscriptions, no recurring commitments — buy credits, use them whenever you&rsquo;re ready to direct.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Grid (shared source: lib/plans.ts) */}
        <section id="packages">
          <div className="wrap">
            <div className="swatch-pricing-grid">
              {plans.map((plan) => (
                <div key={plan.id} className={`pricing-box ${plan.recommended ? "popular" : ""}`}>
                  {plan.recommended && <div className="badge-rec">Recommended</div>}
                  <h3>{plan.name}</h3>
                  <div className="pricing-credits">
                    <span className="amt">{plan.points.toLocaleString()}</span>
                    <span className="lbl">credits</span>
                  </div>
                  <div className="pricing-rate">≈{plan.minutes} min of generation · ₦{plan.perSecondNaira} / second</div>
                  <div className="pricing-row">
                    <span className="listed">₦{plan.listedNaira.toLocaleString()}</span>
                    <span className="vat">+ VAT</span>
                  </div>
                  <div className="pricing-sub">
                    ₦{plan.totalNaira.toLocaleString()} total
                  </div>
                  <Link href={`/checkout?plan=${plan.id}`} className="btn">
                    Choose {plan.name}
                  </Link>
                </div>
              ))}
            </div>

            <div className="disclosures-wrap">
              <p>2 points = 1 second of generation. Balance and job cost are always shown in points before you confirm.</p>
              <p>Every generation is billed at the same rate whether you keep it or discard it — retries aren&apos;t free. This buys generation time, not a promised number of finished videos.</p>
              <p>Points don&apos;t expire. Purchases are final and non-refundable.</p>
            </div>
          </div>
        </section>

        {/* Pricing FAQ */}
        <section id="pricing-faq" className="section-light">
          <div className="wrap">
            <div className="kicker">Reference</div>
            <h2>Billing questions</h2>
            <p className="lede">
              Clear rules and compute economics before you buy.
            </p>

            <div className="faq-group">
              {pricingFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className="faq-row">
                    <button
                      className="faq-btn"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <span style={{ transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>
                        +
                      </span>
                    </button>
                    {isOpen && <div className="faq-body">{faq.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer>
        <div className="wrap footer-inner">
          <div>
            <div className="nav-brand">
              <svg className="nav-mark" viewBox="0 0 120 120">
                <defs>
                  <radialGradient id="g-foot-pricing" cx="35%" cy="35%" r="75%">
                    <stop offset="0%" stopColor="#F2871E" />
                    <stop offset="45%" stopColor="#E5502E" />
                    <stop offset="100%" stopColor="#D6407A" />
                  </radialGradient>
                </defs>
                <circle cx="52" cy="62" r="36" fill="none" stroke="currentColor" strokeWidth="6" />
                <circle cx="82" cy="34" r="18" fill="url(#g-foot-pricing)" />
              </svg>
              <span className="brand-text">Oraya</span>
            </div>
            <p className="footer-note">
              The first AI studio engineered for directors, visual storytellers, and independent film creators.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h5>Platform</h5>
              <ul>
                <li><Link href="/#workflow">Pipeline</Link></li>
                <li><Link href="/#capabilities">Capabilities</Link></li>
                <li><Link href="/#models">Models</Link></li>
                <li><Link href="/#showcase">Showcase</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Direct</h5>
              <ul>
                <li><Link href="/#faq">FAQ</Link></li>
                <li><a href="mailto:hello@technologymedia.global">Contact</a></li>
                <li><Link href="/checkout">Checkout Portal</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="wrap footer-bottom">
          <span>&copy; {new Date().getFullYear()} Oraya. All rights reserved.</span>
          <span>Secured by Paystack &amp; Resend</span>
        </div>
      </footer>
    </div>
  );
}
