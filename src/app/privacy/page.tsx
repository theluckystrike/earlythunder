import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How earlythunder.com collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <PageHeader />
      <OverviewSection />
      <InformationCollectedSection />
      <HowWeUseSection />
      <CookiesSection />
      <DataRetentionSection />
      <DataSecuritySection />
      <YourRightsSection />
      <InternationalSection />
      <ChildrenSection />
      <ThirdPartySection />
      <ChangesSection />
      <DoNotTrackSection />
      <CaliforniaSection />
      <ContactSection />
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm text-text-tertiary">
        Last updated April 14, 2026
      </p>
    </div>
  );
}

function OverviewSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="01" title="Overview" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        AUTOM8 LLC (&ldquo;Early Thunder&rdquo;, &ldquo;the
        Company&rdquo;) operates earlythunder.com (the
        &ldquo;Service&rdquo;). This Privacy Policy describes how Early
        Thunder collects, uses, and shares information when you access or
        use the Service.
      </p>
      <p className="mt-3 leading-relaxed text-text-secondary">
        By using the Service, you agree to the collection and use of
        information in accordance with this policy.
      </p>
    </section>
  );
}

function InformationCollectedSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="02" title="Information Collected" />
      <InformationYouProvide />
      <AutomaticallyCollected />
      <ThirdPartyCollected />
    </section>
  );
}

function InformationYouProvide() {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-text-primary">
        Information You Provide
      </h3>
      <ul className="mt-3 space-y-2">
        <ListItem>
          Email address when you sign up or subscribe
        </ListItem>
        <ListItem>
          Payment information processed via Stripe. Early Thunder does not
          store credit card numbers on its servers
        </ListItem>
        <ListItem>Account credentials used to access the Service</ListItem>
      </ul>
    </div>
  );
}

function AutomaticallyCollected() {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-text-primary">
        Automatically Collected
      </h3>
      <ul className="mt-3 space-y-2">
        <ListItem>IP address</ListItem>
        <ListItem>Browser type and version</ListItem>
        <ListItem>Device type and operating system</ListItem>
        <ListItem>Pages visited and time spent on each page</ListItem>
        <ListItem>Referral source</ListItem>
        <ListItem>Cookies and similar technologies</ListItem>
      </ul>
    </div>
  );
}

function ThirdPartyCollected() {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-text-primary">
        From Third Parties
      </h3>
      <ul className="mt-3 space-y-2">
        <ListItem>
          Payment confirmation and transaction status from Stripe
        </ListItem>
        <ListItem>
          Aggregated analytics data from Plausible Analytics
        </ListItem>
      </ul>
    </div>
  );
}

function HowWeUseSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="03" title="How Your Information Is Used" />
      <ul className="mt-4 space-y-2">
        <ListItem>Provide and maintain the Service</ListItem>
        <ListItem>Send the Weekly Brief and service communications</ListItem>
        <ListItem>Process payments and manage subscriptions</ListItem>
        <ListItem>Analyze usage patterns to improve the Service</ListItem>
        <ListItem>Detect and prevent fraud or abuse</ListItem>
        <ListItem>Comply with legal obligations</ListItem>
      </ul>
      <div className="mt-6 rounded-xl border border-border bg-bg-card p-5">
        <p className="text-sm font-medium text-text-primary">
          Early Thunder does NOT sell your personal information.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Early Thunder does not share your email address with third
          parties for marketing purposes.
        </p>
      </div>
    </section>
  );
}

function CookiesSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="04" title="Cookies and Tracking" />
      <ul className="mt-4 space-y-2">
        <ListItem>
          <strong className="text-text-primary">Essential cookies.</strong>{" "}
          Required for core functionality such as authentication and session
          management
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Analytics cookies.</strong>{" "}
          Plausible Analytics, a privacy-friendly analytics platform that does
          not use personal identifiers
        </ListItem>
      </ul>
      <p className="mt-4 leading-relaxed text-text-secondary">
        Early Thunder does not use advertising cookies, retargeting pixels,
        or third-party tracking scripts for marketing purposes.
      </p>
    </section>
  );
}

function DataRetentionSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="05" title="Data Retention" />
      <ul className="mt-4 space-y-2">
        <ListItem>
          Your email address is retained while your subscription or account
          remains active
        </ListItem>
        <ListItem>
          You may request deletion of your data at any time
        </ListItem>
        <ListItem>
          Payment records are retained as required by applicable law and
          financial regulations
        </ListItem>
        <ListItem>
          Analytics data is aggregated and anonymized. It cannot be traced
          back to individual users
        </ListItem>
      </ul>
    </section>
  );
}

function DataSecuritySection() {
  return (
    <section className="mt-12">
      <SectionHeading number="06" title="Data Security" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        Early Thunder implements reasonable administrative, technical, and
        physical security measures to protect your information. All data
        transmitted between your browser and the servers is encrypted
        using TLS/SSL.
      </p>
      <p className="mt-3 leading-relaxed text-text-secondary">
        No method of electronic transmission or storage is 100% secure.
        While Early Thunder strives to protect your personal information,
        absolute security cannot be guaranteed.
      </p>
    </section>
  );
}

function YourRightsSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="07" title="Your Rights" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        Depending on your jurisdiction, you may have the following rights
        regarding your personal information:
      </p>
      <ul className="mt-4 space-y-2">
        <ListItem>
          <strong className="text-text-primary">Access.</strong> Request a
          copy of the data Early Thunder holds about you
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Correction.</strong> Request
          correction of inaccurate information
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Deletion.</strong> Request
          that Early Thunder delete your personal data
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Portability.</strong> Receive
          your data in a structured, machine-readable format
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Opt-out.</strong> Unsubscribe
          from marketing communications at any time
        </ListItem>
      </ul>
      <p className="mt-4 leading-relaxed text-text-secondary">
        To exercise any of these rights, contact Early Thunder at{" "}
        <a
          href="mailto:privacy@earlythunder.com"
          className="text-text-primary underline underline-offset-4"
        >
          privacy@earlythunder.com
        </a>
        .
      </p>
    </section>
  );
}

function InternationalSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="08" title="International Users" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        The Service is operated globally. If you are accessing the Service
        from outside the United States, your information may be transferred
        to, stored, and processed in the United States or other jurisdictions.
      </p>
      <p className="mt-3 leading-relaxed text-text-secondary">
        For users in the EU/EEA, the legal basis for processing your
        personal information includes legitimate interest in operating and
        improving the Service, and your consent where required by
        applicable law.
      </p>
    </section>
  );
}

function ChildrenSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="09" title="Children" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        The Service is not directed to individuals under 18 years of age.
        Early Thunder does not knowingly collect personal information from
        children. If the Company becomes aware that it has collected data
        from a child, steps will be taken to delete that information
        promptly.
      </p>
    </section>
  );
}

function ThirdPartySection() {
  return (
    <section className="mt-12">
      <SectionHeading number="10" title="Third-Party Services" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        The following third-party services are used to operate the Service.
        Each has its own privacy policy governing use of your data.
      </p>
      <ul className="mt-4 space-y-2">
        <ListItem>
          <strong className="text-text-primary">Cloudflare.</strong> Hosting,
          CDN, and DDoS protection
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Stripe.</strong> Payment
          processing
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Resend.</strong> Transactional
          email delivery
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">GitHub.</strong> Continuous
          integration and deployment
        </ListItem>
      </ul>
    </section>
  );
}

function ChangesSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="11" title="Changes to This Policy" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        Early Thunder may update this Privacy Policy from time to time.
        Material changes will be posted on this page with an updated
        &ldquo;Last updated&rdquo; date. Your continued use of the Service
        after changes are posted constitutes acceptance of the revised
        policy.
      </p>
    </section>
  );
}

function DoNotTrackSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="12" title="Do Not Track" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        The Service does not respond to Do Not Track (DNT) browser signals.
        However, Early Thunder uses Plausible Analytics, which is
        privacy-friendly by design and does not track individual users
        across websites.
      </p>
    </section>
  );
}

function CaliforniaSection() {
  return (
    <section className="mt-12">
      <SectionHeading number="13" title="California Residents (CCPA)" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        If you are a California resident, the California Consumer Privacy Act
        (CCPA) provides you with additional rights:
      </p>
      <ul className="mt-4 space-y-2">
        <ListItem>
          <strong className="text-text-primary">Right to know.</strong> What
          personal information Early Thunder collects, uses, and discloses
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Right to delete.</strong>{" "}
          Request deletion of your personal information
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Right to opt out.</strong> Of
          the sale of personal information (Early Thunder does not sell
          your data)
        </ListItem>
        <ListItem>
          <strong className="text-text-primary">Non-discrimination.</strong>{" "}
          Early Thunder will not discriminate against you for exercising
          your CCPA rights
        </ListItem>
      </ul>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="mt-12 pb-12">
      <SectionHeading number="14" title="Contact" />
      <p className="mt-4 leading-relaxed text-text-secondary">
        For questions about this Privacy Policy or to exercise your rights,
        please reach out.
      </p>
      <div className="mt-4 rounded-xl border border-border bg-bg-card p-5">
        <p className="text-sm text-text-secondary">
          <a
            href="mailto:privacy@earlythunder.com"
            className="text-text-primary underline underline-offset-4"
          >
            privacy@earlythunder.com
          </a>
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          AUTOM8 LLC
        </p>
      </div>
    </section>
  );
}

function SectionHeading({
  number,
  title,
}: {
  readonly number: string;
  readonly title: string;
}) {
  return (
    <div>
      <span className="font-mono text-sm text-text-tertiary">{number}</span>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
        {title}
      </h2>
    </div>
  );
}

function ListItem({ children }: { readonly children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
      <span className="mt-0.5 text-text-tertiary">-</span>
      <span>{children}</span>
    </li>
  );
}
