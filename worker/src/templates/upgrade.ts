/**
 * 7-day upgrade email HTML template for Early Thunder free subscribers.
 * Inline CSS only — no <style> blocks (Gmail strips them).
 * Font-family set on body/wrapper/td; other elements inherit.
 * Each function stays under 60 lines per NASA Power of 10.
 */

const BRAND = "Early Thunder";
const CLR = "#f59e0b";
const BG = "#0a0a0a";
const BG2 = "#141414";
const BG3 = "#1a1708";
const T1 = "#f5f5f5";
const T2 = "#a3a3a3";
const T3 = "#525252";
const B1 = "#1f1f1f";
const B2 = "#262626";
const B3 = "#3d3200";
const URL = "https://earlythunder.com";
const PRICE_URL = `${URL}/pricing`;
const UNSUB_URL = `${URL}/unsubscribe`;
const F = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const TD = `font-family:${F};`;

// ---------------------------------------------------------------------------
// Builder: locked intelligence preview
// ---------------------------------------------------------------------------

function buildLockedPreview(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr><td style="${TD}background:${BG3};border:1px solid ${B3};border-radius:8px;padding:20px 24px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;color:${CLR};">
      ANALYST-ONLY REPORT (PREVIEW)</p>
    <p style="margin:0 0 12px;font-size:16px;font-weight:700;line-height:1.4;color:${T1};">
      Protocol Y: The Liquidity Flywheel No One Is Watching</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${T2};">
      TVL compounding at 18% MoM with zero incentive spend. Fee revenue just
      surpassed the top 5 L2s combined. Our model prices fair value at
      3.8x current market cap&hellip;</p>
    <p style="margin:0;font-size:13px;font-weight:600;color:${T3};">
      &#128274; Full thesis, radar chart, and entry framework locked to Analyst tier.</p>
  </td></tr></table>`;
}

// ---------------------------------------------------------------------------
// Builder: what you're missing list
// ---------------------------------------------------------------------------

function buildRow(label: string, desc: string, last: boolean): string {
  const b = last ? "" : `border-bottom:1px solid ${B1};`;
  return `<tr><td style="${TD}padding:10px 0;${b}font-size:14px;line-height:1.6;color:${T1};">
    <span style="color:${CLR};margin-right:6px;">&#9889;</span>
    <strong>${label}</strong>
    <span style="color:${T2};"> &mdash; ${desc}</span></td></tr>`;
}

function buildMissingList(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    ${buildRow("Full Thesis Documents", "Complete research with conviction scores and catalysts", false)}
    ${buildRow("Radar Charts", "Visual scoring across 8 dimensions for every opportunity", false)}
    ${buildRow("Risk Matrices", "Downside scenarios, liquidation levels, and hedge strategies", false)}
    ${buildRow("Model Portfolio", "Our live allocations, updated weekly with performance tracking", false)}
    ${buildRow("Weekly Analyst Report", "Comprehensive market review with forward-looking signals", true)}
  </table>`;
}

// ---------------------------------------------------------------------------
// Builder: social proof
// ---------------------------------------------------------------------------

function buildSocialProof(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr><td style="${TD}border-left:3px solid ${B1};padding:12px 0 12px 16px;">
    <p style="margin:0 0 4px;font-size:14px;line-height:1.5;font-style:italic;color:${T2};">
      "Paid for itself in the first week. The radar charts alone save me
      hours of research."</p>
    <p style="margin:0;font-size:12px;color:${T3};">&mdash; Analyst-tier member</p>
  </td></tr></table>`;
}

// ---------------------------------------------------------------------------
// Builder: footer
// ---------------------------------------------------------------------------

function buildFooter(email: string): string {
  const a = "color:#737373;text-decoration:underline;";
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin-top:32px;border-top:1px solid ${B1};padding-top:24px;">
  <tr><td style="${TD}font-size:12px;color:${T3};line-height:1.5;">
    You're receiving this because <span style="color:#737373;">${email}</span> is subscribed to ${BRAND}.<br/>
    <a href="${UNSUB_URL}?email=${encodeURIComponent(email)}" style="${a}">Unsubscribe</a>
    &nbsp;&middot;&nbsp;
    <a href="${URL}" style="${a}">earlythunder.com</a>
  </td></tr></table>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a complete HTML upgrade email for 7-day free subscribers.
 * Inline styles and table layout for maximum email client compatibility.
 */
export function buildUpgradeEmailHtml(email: string): string {
  if (typeof email !== "string" || email.length === 0) {
    throw new Error("buildUpgradeEmailHtml: email must be a non-empty string");
  }
  if (email.length > 254) {
    throw new Error("buildUpgradeEmailHtml: email exceeds maximum length");
  }

  const wrap = `max-width:600px;margin:0 auto;padding:40px 20px;font-family:${F};`;
  const card = `background:${BG2};border:1px solid ${B2};border-radius:12px;padding:40px 32px;`;
  const cta = `display:inline-block;background:${CLR};color:${BG};font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:8px;`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark"/>
  <title>You're missing the full picture</title>
</head>
<body style="margin:0;padding:0;background:${BG};color:${T1};font-family:${F};-webkit-font-smoothing:antialiased;">
  <div style="${wrap}">
    <div style="${card}">
      <p style="font-size:28px;font-weight:800;letter-spacing:-0.5px;margin:0 0 4px;color:${T1};">
        <span style="color:${CLR};">&#9889;</span> ${BRAND}</p>
      <p style="color:${T2};font-size:14px;margin:0 0 32px;">Signal before the noise</p>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;color:${T1};">Your first week in review</h1>
      <p style="font-size:15px;line-height:1.6;color:${T2};margin:0 0 8px;">
        Over the past 7 days, our analysts flagged 4 high-conviction opportunities.
        You saw the headlines. Here is what Analyst-tier members received:</p>
      ${buildLockedPreview()}
      <p style="font-size:15px;line-height:1.6;color:${T2};margin:0 0 4px;">
        What Analyst members get that free subscribers don't:</p>
      ${buildMissingList()}
      ${buildSocialProof()}
      <p style="font-size:15px;line-height:1.6;color:${T2};margin:0 0 20px;">
        The Analyst tier is <strong style="color:${T1};">$49/month</strong>.
        No contracts, cancel anytime. If it doesn't pay for itself, you shouldn't keep it.</p>
      <a href="${PRICE_URL}" style="${cta}" target="_blank">Upgrade to Analyst &rarr;</a>
      ${buildFooter(email)}
    </div>
  </div>
</body>
</html>`;
}
