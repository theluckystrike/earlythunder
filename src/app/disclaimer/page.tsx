import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer & Risk Disclosure",
  description:
    "Important disclaimers and risk disclosures for earlythunder.com users.",
  robots: { index: true, follow: true, noarchive: true },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <PageHeader />
      <ImportantBanner />
      <GeneralDisclaimer />
      <NoGuaranteeOfAccuracy />
      <InvestmentRiskDisclosure />
      <MethodologyLimitations />
      <ConflictOfInterest />
      <ThirdPartyContent />
      <RegulatoryNotice />
      <IndemnificationAndLiability />
      <ForwardLookingStatements />
      <AcknowledgmentBlock />
      <Contact />
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary">
        Disclaimer &amp; Risk Disclosure
      </h1>
      <p className="mt-2 text-sm text-text-tertiary">
        Last updated: April 14, 2026
      </p>
    </div>
  );
}

function ImportantBanner() {
  return (
    <div className="mt-10 mb-12 rounded-2xl border border-border bg-bg-card p-6">
      <p className="text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">Important:</span>{" "}
        Please read this page carefully before using Early Thunder. By using
        our Site, you acknowledge that you have read and understood these
        disclaimers.
      </p>
    </div>
  );
}

function GeneralDisclaimer() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        1. General Disclaimer
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          Early Thunder is a research and pattern-recognition platform
          operated by AUTOM8 LLC. All content on earlythunder.com is provided
          for informational and educational purposes only.
        </p>
        <p>
          AUTOM8 LLC is NOT a registered investment advisor (RIA),
          broker-dealer, or financial institution. Nothing on this Site
          constitutes investment advice, financial advice, trading advice, or
          any other form of professional advice.
        </p>
        <p>
          Pattern match scores presented on this Site are analytical tools
          derived from our proprietary methodology. They are NOT investment
          ratings, buy/sell recommendations, or endorsements of any kind.
        </p>
        <p>
          The term &quot;OPPORTUNITY&quot; as used throughout this Site refers
          solely to assets we track and analyze. It does NOT constitute a
          recommendation, endorsement, or solicitation to buy, sell, or hold
          any asset.
        </p>
      </div>
    </section>
  );
}

function NoGuaranteeOfAccuracy() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        2. No Guarantee of Accuracy
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          We make no warranties or representations regarding the accuracy,
          completeness, timeliness, or reliability of any information published
          on this Site. All information is provided on an &quot;as is&quot; and
          &quot;as available&quot; basis without warranties of any kind, either
          express or implied.
        </p>
        <p>
          Market data, pricing information, and project details are sourced
          from third-party providers and may be delayed, inaccurate, or
          incomplete at any time.
        </p>
        <p>
          Signal scores represent subjective assessments based on our
          proprietary methodology. Reasonable analysts applying similar
          frameworks may arrive at materially different conclusions.
        </p>
        <p>
          We are not responsible for any errors, omissions, or inaccuracies in
          the information provided, regardless of the cause.
        </p>
      </div>
    </section>
  );
}

function InvestmentRiskDisclosure() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        3. Investment Risk Disclosure
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <GeneralRisk />
        <DigitalAssetRisk />
        <PublicEquitiesRisk />
        <PrivateMarketsRisk />
        <PredictionMarketsRisk />
      </div>
    </section>
  );
}

function GeneralRisk() {
  return (
    <>
      <h3 className="mt-4 mb-3 text-base font-medium text-text-primary">
        3a. General Investment Risk
      </h3>
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <p className="font-semibold text-text-primary">
          ALL INVESTMENTS CARRY RISK, INCLUDING THE RISK OF TOTAL LOSS OF
          CAPITAL. PAST PERFORMANCE DOES NOT GUARANTEE OR PREDICT FUTURE
          RESULTS.
        </p>
        <p className="mt-4 font-semibold text-text-primary">
          NEVER INVEST MORE THAN YOU CAN AFFORD TO LOSE ENTIRELY.
        </p>
      </div>
    </>
  );
}

function DigitalAssetRisk() {
  return (
    <>
      <h3 className="mt-8 mb-3 text-base font-medium text-text-primary">
        3b. Digital Assets
      </h3>
      <p>
        Digital assets (cryptocurrencies, tokens, NFTs) are highly volatile
        and may be partially or entirely unregulated in your jurisdiction.
        Risks specific to digital assets include but are not limited to:
      </p>
      <ul className="list-none space-y-2 pl-0">
        {DIGITAL_ASSET_RISKS.map((risk) => (
          <li key={risk} className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>{risk}</span>
          </li>
        ))}
      </ul>
      <p className="font-medium text-text-primary">
        Drawdowns of 80-99% are common in digital asset markets. Pre-token
        and pre-launch projects carry MAXIMUM risk and may result in complete
        loss of all capital invested.
      </p>
    </>
  );
}

const DIGITAL_ASSET_RISKS = [
  "Smart contract exploits, bugs, and vulnerabilities",
  "Rug pulls, exit scams, and fraudulent projects",
  "Regulatory crackdowns, enforcement actions, and outright bans",
  "Exchange failures, hacks, and insolvency events",
  "Loss of private keys or wallet access resulting in permanent loss of funds",
] as const;

function PublicEquitiesRisk() {
  return (
    <>
      <h3 className="mt-8 mb-3 text-base font-medium text-text-primary">
        3c. Public Equities
      </h3>
      <p>
        Publicly traded stocks can decline in value to zero. Additional risks
        include:
      </p>
      <ul className="list-none space-y-2 pl-0">
        {PUBLIC_EQUITY_RISKS.map((risk) => (
          <li key={risk} className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>{risk}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

const PUBLIC_EQUITY_RISKS = [
  "SPAC-specific risks including deal failure, dilution, and redemption dynamics",
  "Small-cap and micro-cap illiquidity leading to wide spreads and difficulty exiting positions",
  "Sector-specific risks including regulatory changes, technological disruption, and competitive pressures",
] as const;

function PrivateMarketsRisk() {
  return (
    <>
      <h3 className="mt-8 mb-3 text-base font-medium text-text-primary">
        3d. Private Markets
      </h3>
      <p>
        Private market investments carry unique and significant risks:
      </p>
      <ul className="list-none space-y-2 pl-0">
        {PRIVATE_MARKET_RISKS.map((risk) => (
          <li key={risk} className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>{risk}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

const PRIVATE_MARKET_RISKS = [
  "Investments may be illiquid for years with no secondary market or exit opportunity",
  "The majority of startups fail, resulting in total loss of invested capital",
  "Valuations are subjective and may not reflect realizable value",
  "Limited information and transparency compared to public markets",
  "Accredited investor requirements may apply under applicable securities laws",
] as const;

function PredictionMarketsRisk() {
  return (
    <>
      <h3 className="mt-8 mb-3 text-base font-medium text-text-primary">
        3e. Prediction Markets
      </h3>
      <p>
        Prediction markets involve unique risks including:
      </p>
      <ul className="list-none space-y-2 pl-0">
        {PREDICTION_MARKET_RISKS.map((risk) => (
          <li key={risk} className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>{risk}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

const PREDICTION_MARKET_RISKS = [
  "Binary outcomes resulting in total loss of position value",
  "Evolving regulatory landscape and potential enforcement actions",
  "Liquidity risk and wide bid-ask spreads, particularly in less active markets",
  "Platform risk including smart contract vulnerabilities, operational failures, and insolvency",
] as const;

function MethodologyLimitations() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        4. Methodology Limitations
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          The Early Thunder 8-Signal Pattern Filter is a proprietary
          analytical framework. It has not been scientifically validated,
          independently audited, or subjected to peer review.
        </p>
        <p>
          Survivorship bias may affect the analysis. Historical patterns are
          derived from assets that succeeded, which may create a misleading
          representation of probability.
        </p>
        <p className="font-medium text-text-primary">
          A high pattern match score does NOT mean an opportunity will succeed.
          It means the opportunity matches historical patterns observed in
          OTHER assets at OTHER times under OTHER market conditions. Past
          pattern matches are not predictive of future outcomes.
        </p>
      </div>
    </section>
  );
}

function ConflictOfInterest() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        5. Conflict of Interest Disclosure
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          AUTOM8 LLC, its principals, employees, and affiliates may hold
          positions in assets tracked, analyzed, or discussed on this Site.
          These positions may be acquired before, during, or after publication
          of analyses.
        </p>
        <p>
          Analysis and scoring may be influenced, whether consciously or
          unconsciously, by positions held by AUTOM8 LLC or its affiliates.
        </p>
        <p>
          AUTOM8 LLC makes no commitment to disclose all positions held, nor
          to update you when positions are opened, modified, or closed.
        </p>
      </div>
    </section>
  );
}

function ThirdPartyContent() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        6. Third-Party Content and Links
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          The Site may contain links to third-party websites, exchanges,
          platforms, and resources. These links are provided for convenience
          only. AUTOM8 LLC does not endorse, approve, or assume
          responsibility for any third-party content, products, or services.
        </p>
        <p>
          We have not audited the security, compliance, or operational
          integrity of any linked platform, exchange, or service.
        </p>
        <p className="font-medium text-text-primary">
          If a linked exchange is hacked, a linked project is compromised or
          &quot;rugs,&quot; or a third-party platform fails, AUTOM8 LLC bears
          NO liability for any resulting losses.
        </p>
      </div>
    </section>
  );
}

function RegulatoryNotice() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        7. Regulatory Notice
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          Nothing on this Site constitutes an offer to sell or a solicitation
          of an offer to buy any securities, tokens, or other financial
          instruments in any jurisdiction.
        </p>
        <p>
          It is your sole responsibility to determine whether your use of this
          Site and any investment activities are legal in your jurisdiction.
          Laws and regulations regarding digital assets and securities vary
          significantly across jurisdictions.
        </p>
        <p>
          Many digital assets discussed on this Site may be deemed unregistered
          securities under applicable law, including under the Securities and
          Exchange Commission (SEC) framework. Participation in such assets may
          violate securities laws in your jurisdiction.
        </p>
      </div>
    </section>
  );
}

function IndemnificationAndLiability() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        8. Indemnification and Limitation of Liability
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <p className="font-semibold text-text-primary">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUTOM8 LLC SHALL NOT BE
            LIABLE FOR ANY LOSSES, DAMAGES, OR CLAIMS ARISING FROM:
          </p>
          <ul className="mt-4 list-none space-y-2 pl-0">
            {LIABILITY_EXCLUSIONS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-text-primary">-</span>
                <span className="font-semibold text-text-primary">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-medium text-text-primary">
          In no event shall the total aggregate liability of AUTOM8 LLC exceed
          the greater of (a) the total fees paid by you to AUTOM8 LLC in the
          twelve (12) months preceding the claim, or (b) one hundred United
          States dollars (US $100.00).
        </p>
      </div>
    </section>
  );
}

const LIABILITY_EXCLUSIONS = [
  "Acting on any analysis, score, or information published on this Site",
  "Relying on pattern match scores or signal assessments for investment decisions",
  "Following links to third-party platforms, exchanges, or projects",
  "Any errors, omissions, or inaccuracies in published content",
] as const;

function ForwardLookingStatements() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        9. Forward-Looking Statements
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          Content on this Site may contain forward-looking statements. Words
          and phrases such as &quot;potential,&quot; &quot;catalyst,&quot;
          &quot;upcoming,&quot; &quot;expected,&quot; &quot;projected,&quot;
          and similar expressions indicate forward-looking statements.
        </p>
        <p>
          Forward-looking statements are based on current expectations and
          assumptions that are inherently uncertain. Actual results may differ
          materially from those expressed or implied. You should not place
          undue reliance on any forward-looking statement.
        </p>
      </div>
    </section>
  );
}

function AcknowledgmentBlock() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        10. Acknowledgment
      </h2>
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <p className="mb-4 text-sm font-bold text-text-primary">
          BY USING EARLYTHUNDER.COM, YOU ACKNOWLEDGE AND AGREE THAT:
        </p>
        <ul className="list-none space-y-3 pl-0">
          {ACKNOWLEDGMENTS.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-sm font-semibold text-text-primary">
                -
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const ACKNOWLEDGMENTS = [
  "You have read and understood this Disclaimer and Risk Disclosure in its entirety",
  "Early Thunder is a research and pattern-recognition platform, NOT an advisory service",
  "You are solely responsible for your own investment decisions and their consequences",
  "You will not hold AUTOM8 LLC, its principals, employees, or affiliates liable for any investment losses",
  "Investing in any asset may result in total and permanent loss of capital",
  "You will consult with qualified financial, legal, and tax advisors before making investment decisions",
] as const;

function Contact() {
  return (
    <section className="mb-12">
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        11. Contact
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          For questions regarding this Disclaimer and Risk Disclosure, please
          contact us:
        </p>
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <p className="text-text-primary">AUTOM8 LLC</p>
          <p className="mt-2">
            Email:{" "}
            <a
              href="mailto:legal@earlythunder.com"
              className="text-text-primary underline underline-offset-4 transition-colors hover:text-text-secondary"
            >
              legal@earlythunder.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
