/**
 * Welcome email HTML template for Early Thunder subscribers.
 * Dark theme, mobile responsive, matches site aesthetic.
 *
 * Split into sub-60-line builder functions per NASA Power of 10.
 */

const BRAND_NAME = "Early Thunder";
const BRAND_COLOR = "#f59e0b";
const BG_DARK = "#0a0a0a";
const BG_CARD = "#141414";
const TEXT_PRIMARY = "#f5f5f5";
const TEXT_SECONDARY = "#a3a3a3";
const BORDER_SUBTLE = "#1f1f1f";
const BORDER_CARD = "#262626";
const SITE_URL = "https://earlythunder.com";

/**
 * Returns the <style> block for the welcome email.
 */
function buildStyles(): string {
  return `<style>
    body {
      margin: 0; padding: 0;
      background-color: ${BG_DARK}; color: ${TEXT_PRIMARY};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card {
      background-color: ${BG_CARD}; border: 1px solid ${BORDER_CARD};
      border-radius: 12px; padding: 40px 32px;
    }
    .logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
    .logo .bolt { color: ${BRAND_COLOR}; }
    .tagline { color: ${TEXT_SECONDARY}; font-size: 14px; margin-bottom: 32px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 16px 0; color: ${TEXT_PRIMARY}; }
    p { font-size: 15px; line-height: 1.6; color: ${TEXT_SECONDARY}; margin: 0 0 16px 0; }
    .benefits { margin: 24px 0; padding: 0; list-style: none; }
    .benefits li {
      font-size: 15px; line-height: 1.6; color: ${TEXT_PRIMARY};
      padding: 8px 0; border-bottom: 1px solid ${BORDER_SUBTLE};
    }
    .benefits li:last-child { border-bottom: none; }
    .benefits li .icon { color: ${BRAND_COLOR}; margin-right: 8px; }
    .cta-btn {
      display: inline-block; background-color: ${BRAND_COLOR}; color: ${BG_DARK};
      font-weight: 700; font-size: 15px; text-decoration: none;
      padding: 14px 32px; border-radius: 8px; margin-top: 24px;
    }
    .footer {
      margin-top: 32px; padding-top: 24px; border-top: 1px solid ${BORDER_SUBTLE};
      font-size: 12px; color: #525252; line-height: 1.5;
    }
    .footer a { color: #737373; text-decoration: underline; }
    @media only screen and (max-width: 480px) {
      .card { padding: 28px 20px; }
      .logo { font-size: 24px; }
      h1 { font-size: 20px; }
    }
  </style>`;
}

/**
 * Returns the email body content HTML (inside the card).
 */
function buildBodyContent(email: string): string {
  if (typeof email !== "string" || email.length === 0) {
    throw new Error("buildBodyContent: email must be a non-empty string");
  }

  return `<div class="logo">
        <span class="bolt">&#9889;</span> ${BRAND_NAME}
      </div>
      <div class="tagline">Signal before the noise</div>

      <h1>Your edge starts now.</h1>

      <p>
        You're in. Early Thunder delivers curated intelligence on emerging
        opportunities, market shifts, and asymmetric bets &mdash; before
        they become consensus.
      </p>

      <p>Here's what you'll receive:</p>

      <ul class="benefits">
        <li><span class="icon">&#9889;</span> <strong>Weekly Brief</strong> &mdash; Concise analysis of the highest-signal opportunities we've identified</li>
        <li><span class="icon">&#9889;</span> <strong>Opportunity Alerts</strong> &mdash; Time-sensitive notifications when we spot asymmetric setups</li>
        <li><span class="icon">&#9889;</span> <strong>Deep Dives</strong> &mdash; Detailed research on sectors and trends before they hit mainstream</li>
      </ul>

      <a href="${SITE_URL}" class="cta-btn">
        Visit Early Thunder
      </a>

      <div class="footer">
        <p>
          You're receiving this because ${email} was subscribed to Early Thunder.<br />
          <a href="${SITE_URL}/unsubscribe">Unsubscribe</a>
        </p>
      </div>`;
}

/**
 * Returns a complete HTML email string for the welcome email.
 * Assembles head, styles, and body content from helper functions.
 */
export function buildWelcomeEmailHtml(email: string): string {
  if (typeof email !== "string" || email.length === 0) {
    throw new Error("buildWelcomeEmailHtml: email must be a non-empty string");
  }

  const styles = buildStyles();
  const content = buildBodyContent(email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>Welcome to ${BRAND_NAME}</title>
  ${styles}
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
    </div>
  </div>
</body>
</html>`;
}
