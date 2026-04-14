import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions governing use of earlythunder.com",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <PageHeader />
      <AcceptanceOfTerms />
      <DescriptionOfService />
      <NotInvestmentAdvice />
      <NoFiduciaryRelationship />
      <AssumptionOfRisk />
      <AccuracyOfInformation />
      <IntellectualProperty />
      <UserAccountsAndSubscriptions />
      <ProhibitedUses />
      <ThirdPartyLinks />
      <LimitationOfLiability />
      <Indemnification />
      <GoverningLaw />
      <RegulatoryNotice />
      <Contact />
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-text-tertiary">
        Last updated: April 14, 2026
      </p>
    </div>
  );
}

function AcceptanceOfTerms() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        1. Acceptance of Terms
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          By accessing or using earlythunder.com (&quot;the Site&quot;,
          &quot;the Service&quot;), operated by AUTOM8 LLC (&quot;we&quot;,
          &quot;us&quot;, &quot;the Company&quot;), you acknowledge that you
          have read, understood, and agree to be bound by these Terms of
          Service and all applicable laws and regulations.
        </p>
        <p>
          If you do not agree to these Terms of Service, you must not access
          or use the Site.
        </p>
        <p>
          We reserve the right to modify these Terms of Service at any time
          without prior notice. Changes become effective immediately upon
          posting. Your continued use of the Site following any modifications
          constitutes your acceptance of the revised terms.
        </p>
      </div>
    </section>
  );
}

function DescriptionOfService() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        2. Description of Service
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          Early Thunder is a research and information platform that tracks
          and scores pre-mainstream opportunities across digital assets,
          public equities, and private markets.
        </p>
        <p>
          We use a proprietary 8-Signal Pattern Filter methodology to
          evaluate opportunities. Our scores are pattern match indicators
          based on historical signal analysis. They are not investment
          ratings, not buy/sell recommendations, and not personalized
          financial advice.
        </p>
        <p>
          The Service includes free publicly accessible information and
          premium subscription content. All information on the Site is
          provided for general informational and educational purposes only.
        </p>
      </div>
    </section>
  );
}

function NotInvestmentAdvice() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        3. Not Investment Advice
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <p className="font-semibold text-text-primary">
            EARLY THUNDER IS NOT A REGISTERED INVESTMENT ADVISOR,
            BROKER-DEALER, FINANCIAL ANALYST, OR FINANCIAL PLANNER.
          </p>
          <p className="mt-4 font-semibold text-text-primary">
            NOTHING ON THIS SITE CONSTITUTES INVESTMENT ADVICE, FINANCIAL
            ADVICE, TRADING ADVICE, OR ANY OTHER SORT OF ADVICE, AND YOU
            SHOULD NOT TREAT ANY OF THE SITE&apos;S CONTENT AS SUCH.
          </p>
        </div>
        <p>
          None of the information provided on this Site constitutes a
          recommendation that any particular investment, security,
          transaction, or investment strategy is suitable for any specific
          person.
        </p>
        <p>
          You understand and acknowledge that no content published on this
          Site is tailored to your specific financial situation, investment
          objectives, or risk tolerance. Any investment decision you make
          based on information found on this Site is made at your sole
          discretion and risk.
        </p>
        <p className="font-medium text-text-primary">
          You should not make any investment decision based solely on
          information found on this Site. You are strongly advised to consult
          with a qualified financial advisor, attorney, or accountant before
          making any investment decisions.
        </p>
        <p>
          We do not endorse, recommend, or vouch for the legitimacy, safety,
          or suitability of any opportunity, project, token, security, or
          asset tracked on this Site. Inclusion on this Site does not
          constitute an endorsement.
        </p>
      </div>
    </section>
  );
}

function NoFiduciaryRelationship() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        4. No Fiduciary Relationship
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          Your use of the Service does not create an advisory, fiduciary, or
          professional services relationship between you and AUTOM8 LLC. We
          owe you no duty of care, duty of loyalty, or any other fiduciary
          duty whatsoever.
        </p>
        <p>
          We are under no obligation to update, correct, or remove any
          information previously published on the Site, nor to notify you of
          any changes to opportunities, scores, or analyses.
        </p>
      </div>
    </section>
  );
}

function AssumptionOfRisk() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        5. Assumption of Risk
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          All investments carry substantial risk, including the possibility
          of total loss of principal. Past pattern matches, signal scores,
          and historical performance do not guarantee or predict future
          results.
        </p>
        <p>
          Opportunities tracked on this Site may include highly speculative
          and illiquid assets. Pre-token, pre-product, and early-stage
          opportunities carry extreme risk including but not limited to
          project failure, regulatory action, smart contract exploits, team
          abandonment, and total loss of capital.
        </p>
        <p className="font-medium text-text-primary">
          YOU ALONE are responsible for determining whether any investment,
          investment strategy, or related transaction is appropriate for you
          based on your personal investment objectives, financial
          circumstances, and risk tolerance. You assume full responsibility
          for all investment decisions you make.
        </p>
      </div>
    </section>
  );
}

function AccuracyOfInformation() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        6. Accuracy of Information
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          While we make reasonable efforts to provide accurate and timely
          information, we make no warranties or representations regarding the
          accuracy, completeness, timeliness, or reliability of any
          information on the Site.
        </p>
        <p>
          Market data, pricing information, and project details sourced from
          third-party providers may be delayed, inaccurate, or incomplete.
          Signal scores represent subjective assessments based on our
          proprietary methodology and should not be interpreted as objective
          facts.
        </p>
        <p>
          Errors, omissions, and inaccuracies may occur. We expressly
          disclaim any liability for losses or damages arising from reliance
          on information published on the Site.
        </p>
      </div>
    </section>
  );
}

function IntellectualProperty() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        7. Intellectual Property
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          All content on this Site, including but not limited to text,
          graphics, logos, data compilations, scoring methodologies,
          analyses, and software, is the property of AUTOM8 LLC or its
          content suppliers and is protected by United States and
          international copyright, trademark, and intellectual property laws.
        </p>
        <p>
          You may not reproduce, distribute, modify, create derivative works
          of, publicly display, or otherwise exploit any content from this
          Site without prior written permission from AUTOM8 LLC.
        </p>
        <p>
          You may share links to pages on the Site and quote brief excerpts
          of published content for non-commercial purposes, provided that
          proper attribution to Early Thunder and a link to the original
          source are included.
        </p>
      </div>
    </section>
  );
}

function UserAccountsAndSubscriptions() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        8. User Accounts and Subscriptions
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          Certain features of the Service require account registration. You
          are responsible for maintaining the confidentiality of your account
          credentials and for all activity that occurs under your account.
          You agree to notify us immediately of any unauthorized use.
        </p>
        <p>
          Subscription fees are billed in advance on a recurring basis. All
          fees are non-refundable except as required by applicable law or as
          explicitly stated in our refund policy.
        </p>
        <p>
          We reserve the right to modify subscription pricing with at least
          30 days prior notice. We may suspend or terminate your account at
          our sole discretion for any violation of these Terms, with or
          without notice.
        </p>
      </div>
    </section>
  );
}

function ProhibitedUses() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        9. Prohibited Uses
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>You agree not to use the Site to:</p>
        <ul className="list-none space-y-2 pl-0">
          {PROHIBITED_USES.map((use) => (
            <li key={use} className="flex items-start gap-2">
              <span className="mt-0.5 text-text-tertiary">-</span>
              <span>{use}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const PROHIBITED_USES = [
  "Engage in market manipulation, front-running, or any form of trading abuse based on information obtained from the Site",
  "Scrape, crawl, or use automated means to extract data from the Site without prior written consent",
  "Redistribute, resell, or republish premium or subscription-only content",
  "Create competing products or services using data, methodologies, or analyses derived from the Site",
  "Use the Site for any purpose that violates applicable local, state, national, or international law",
  "Impersonate any person or entity or misrepresent your affiliation with any person or entity",
  "Interfere with or disrupt the integrity or performance of the Site or its underlying infrastructure",
] as const;

function ThirdPartyLinks() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        10. Third-Party Links and Content
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          The Site may contain links to third-party websites, applications,
          or resources. These links are provided for your convenience only.
          We have no control over the content, privacy policies, or
          practices of any third-party sites or services.
        </p>
        <p>
          Inclusion of any third-party link does not imply endorsement,
          approval, or recommendation by AUTOM8 LLC. You access third-party
          sites entirely at your own risk and subject to the terms and
          conditions of those sites.
        </p>
      </div>
    </section>
  );
}

function LimitationOfLiability() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        11. Limitation of Liability
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <p className="font-semibold text-text-primary">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AUTOM8 LLC,
            ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES
            SHALL NOT BE LIABLE FOR ANY INVESTMENT LOSSES, DIRECT, INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING
            FROM OR RELATED TO YOUR USE OF THE SITE OR RELIANCE ON ANY
            INFORMATION PROVIDED HEREIN.
          </p>
        </div>
        <p>
          This includes, without limitation, damages for loss of profits,
          goodwill, data, or other intangible losses, even if we have been
          advised of the possibility of such damages.
        </p>
        <p>
          This limitation applies to damages arising from errors, omissions,
          interruptions, defects, delays in operation, computer viruses,
          unauthorized access, or any other cause.
        </p>
        <p className="font-medium text-text-primary">
          In no event shall our total aggregate liability to you for all
          claims arising out of or relating to the use of the Site exceed
          the greater of (a) the total fees paid by you to AUTOM8 LLC in the
          twelve (12) months preceding the claim, or (b) one hundred United
          States dollars (US $100.00).
        </p>
      </div>
    </section>
  );
}

function Indemnification() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        12. Indemnification
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          You agree to indemnify, defend, and hold harmless AUTOM8 LLC, its
          officers, directors, employees, agents, and affiliates from and
          against any and all claims, liabilities, damages, losses, costs,
          and expenses (including reasonable attorneys&apos; fees) arising
          out of or in any way connected with:
        </p>
        <ul className="list-none space-y-2 pl-0">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>Your access to or use of the Site</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>
              Any investment decisions you make based on information found on
              the Site
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>Your violation of these Terms of Service</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>
              Your violation of any applicable law or the rights of any
              third party
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function GoverningLaw() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        13. Governing Law and Dispute Resolution
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          These Terms shall be governed by and construed in accordance with
          the laws of the State of Delaware, United States, without regard
          to its conflict of law provisions.
        </p>
        <h3 className="mt-8 mb-3 text-base font-medium text-text-primary">
          Binding Arbitration
        </h3>
        <p>
          Any dispute, claim, or controversy arising out of or relating to
          these Terms or the breach, termination, enforcement, or
          interpretation thereof shall be determined by binding arbitration
          administered by the American Arbitration Association in accordance
          with its Commercial Arbitration Rules.
        </p>
        <h3 className="mt-8 mb-3 text-base font-medium text-text-primary">
          Class Action Waiver
        </h3>
        <p>
          You agree that any arbitration or proceeding shall be limited to
          the dispute between us and you individually. To the fullest extent
          permitted by law, you waive the right to participate in a class
          action lawsuit or class-wide arbitration against AUTOM8 LLC.
        </p>
      </div>
    </section>
  );
}

function RegulatoryNotice() {
  return (
    <section>
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        14. Regulatory Notice
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          Digital assets, cryptocurrencies, and tokens discussed on this
          Site may not be regulated in your jurisdiction. The regulatory
          landscape for digital assets is evolving and varies significantly
          across jurisdictions. It is your sole responsibility to understand
          and comply with all applicable laws and regulations in your
          jurisdiction.
        </p>
        <p>
          Nothing on this Site constitutes an offer to sell or a
          solicitation of an offer to buy any securities, tokens, or other
          financial instruments. No content should be construed as a
          recommendation to engage in any transaction involving securities.
        </p>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="mb-12">
      <h2 className="mt-12 mb-4 text-lg font-semibold text-text-primary">
        15. Contact
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>
          If you have any questions about these Terms of Service, please
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
