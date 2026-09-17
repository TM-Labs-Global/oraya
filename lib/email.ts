// lib/email.ts
// Server-side only — sends the post-payment confirmation via Resend.
// Note: this email intentionally does NOT contain login details.
// Account creation is manual right now, so this just confirms payment
// and sets the expectation that a second email with credentials is coming.
import "server-only";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Replace with a verified sending domain in Resend before going live —
// Resend will reject sends from an unverified domain.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Oraya <hello@oraya.example>";

export async function sendPaymentConfirmationEmail(to: string, planName: string, points?: number) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "You're in — welcome to Oraya",
    html: paymentConfirmationTemplate(planName, points),
  });
}

export async function sendTeamNotificationEmail(
  to: string,
  customerEmail: string,
  planName: string,
  points: number,
  reference: string,
  amountPaidNaira: number
) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `🚨 [Action Required] New Oraya Order: ${planName} (${customerEmail})`,
    html: teamNotificationTemplate(customerEmail, planName, points, reference, amountPaidNaira),
  });
}

// Kept deliberately simple and light-background: email clients have
// inconsistent (often nonexistent) dark-mode support, so this doesn't
// try to reuse Oraya's dark UI theme — just one accent color for the
// brand rule, everything else safe, boring, and legible everywhere.
function paymentConfirmationTemplate(planName: string, points?: number) {
  const pointsLine = points
    ? `<p style="font-size:15px; line-height:1.6; color:#4b4b4f; margin:0 0 16px;">
         Your balance: <strong>${points.toLocaleString()} points</strong> (2 points = 1 second of generation).
       </p>`
    : "";
  return `
  <div style="background:#f4f4f5; padding:40px 16px; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 0;">
          <div style="font-size:20px; font-weight:700; letter-spacing:-0.01em; color:#141416;">Oraya</div>
          <div style="height:3px; width:40px; background:#E5502E; margin-top:12px; border-radius:2px;"></div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px;">
          <h1 style="font-size:22px; margin:0 0 16px; color:#141416;">Payment received — welcome to Oraya.</h1>
          <p style="font-size:15px; line-height:1.6; color:#4b4b4f; margin:0 0 16px;">
            You're signed up for the <strong>${planName}</strong> package. We're setting up your
            account by hand right now — your login details will land in this inbox shortly.
          </p>
          ${pointsLine}
          <p style="font-size:15px; line-height:1.6; color:#4b4b4f; margin:0 0 16px;">
            No action needed from you until then. If anything looks off, just reply to this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;">
          <p style="font-size:13px; color:#9c9ba3; margin:0;">— The Oraya team</p>
        </td>
      </tr>
    </table>
  </div>`;
}

function teamNotificationTemplate(
  customerEmail: string,
  planName: string,
  points: number,
  reference: string,
  amountPaidNaira: number
) {
  return `
  <div style="background:#f4f4f5; padding:40px 16px; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding:32px 32px 0;">
          <div style="font-size:20px; font-weight:700; color:#141416;">Oraya Operations</div>
          <div style="height:3px; width:40px; background:#E5502E; margin-top:12px; border-radius:2px;"></div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          <h2 style="font-size:18px; color:#141416; margin:0 0 16px;">New Payment Received — Action Required</h2>
          <p style="font-size:14px; line-height:1.6; color:#4b4b4f; margin:0 0 20px;">
            A customer has paid via Paystack. Please log into the generation platform, provision their account with the points below, and send their login credentials.
          </p>
          <table style="width:100%; font-size:14px; border-collapse:collapse; background:#fafafa; border:1px solid #eaeaec; border-radius:8px; margin-bottom:20px;">
            <tr>
              <td style="padding:10px 14px; border-bottom:1px solid #eaeaec; color:#8C8A92;">Customer Email</td>
              <td style="padding:10px 14px; border-bottom:1px solid #eaeaec; font-weight:600; color:#141416;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px; border-bottom:1px solid #eaeaec; color:#8C8A92;">Package</td>
              <td style="padding:10px 14px; border-bottom:1px solid #eaeaec; font-weight:600; color:#141416;">${planName} (${points.toLocaleString()} points)</td>
            </tr>
            <tr>
              <td style="padding:10px 14px; border-bottom:1px solid #eaeaec; color:#8C8A92;">Amount Paid</td>
              <td style="padding:10px 14px; border-bottom:1px solid #eaeaec; font-weight:600; color:#141416;">₦${amountPaidNaira.toLocaleString()} NGN</td>
            </tr>
            <tr>
              <td style="padding:10px 14px; color:#8C8A92;">Paystack Reference</td>
              <td style="padding:10px 14px; font-family:monospace; color:#141416;">${reference}</td>
            </tr>
          </table>
          <p style="font-size:12px; color:#8C8A92; margin:0;">
            SOP Reminder: Always confirm this reference in your Paystack dashboard before granting access.
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

