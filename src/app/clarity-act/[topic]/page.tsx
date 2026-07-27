import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllClarityTopics,
  getClarityTopicBySlug,
  getClarityMeta,
} from "@/lib/clarity";
import type { ClarityTopic } from "@/lib/clarity";
import {
  SITE_NAME,
  SITE_URL,
  AUTHOR_NAME,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  TWITTER_HANDLE,
} from "@/lib/constants";
import {
  getBreadcrumbListSchema,
  getFaqPageSchema,
} from "@/lib/structured-data";

interface PageProps {
  readonly params: Promise<{ topic: string }>;
}

export function generateStaticParams(): { topic: string }[] {
  return getAllClarityTopics().map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = getClarityTopicBySlug(slug);
  if (!topic) return { title: "Not Found" };

  const url = `${SITE_URL}/clarity-act/${topic.slug}`;
  const ogImage = `${SITE_URL}${OG_IMAGE_PATH}`;

  return {
    title: topic.title,
    description: topic.description,
    keywords: [...topic.keywords],
    authors: [{ name: AUTHOR_NAME }],
    openGraph: {
      title: `${topic.title} | ${SITE_NAME}`,
      description: topic.description,
      url,
      type: "article",
      images: [
        { url: ogImage, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: topic.h1 },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic.title} | ${SITE_NAME}`,
      description: topic.description,
      images: [ogImage],
      creator: TWITTER_HANDLE,
    },
    alternates: { canonical: url },
  };
}

/** Article schema carrying the topic's primary sources as isBasedOn. */
function buildArticleSchema(topic: ClarityTopic, updatedAt: string): Record<string, unknown> {
  const url = `${SITE_URL}/clarity-act/${topic.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.h1,
    description: topic.description,
    url,
    dateModified: updatedAt,
    about: {
      "@type": "Legislation",
      name: "Digital Asset Market Clarity Act",
      legislationIdentifier: "H.R. 3633",
      legislationJurisdiction: "United States",
    },
    isBasedOn: topic.sources.map((s) => ({
      "@type": "CreativeWork",
      name: s.label,
      url: s.url,
    })),
    author: { "@type": "Organization", name: AUTHOR_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}${OG_IMAGE_PATH}` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: [...topic.keywords].join(", "),
  };
}

export default async function ClarityTopicPage({ params }: PageProps) {
  const { topic: slug } = await params;
  const topic = getClarityTopicBySlug(slug);

  if (!topic) return <NotFoundFallback />;

  const meta = getClarityMeta();
  const articleSchema = buildArticleSchema(topic, meta.updated_at);
  const faqSchema = getFaqPageSchema(topic.faqs);
  const breadcrumbSchema = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "CLARITY Act", path: "/clarity-act" },
    { name: topic.h1, path: `/clarity-act/${topic.slug}` },
  ]);

  const related = topic.related
    .map((s) => getClarityTopicBySlug(s))
    .filter((t): t is ClarityTopic => t !== null);

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Link
        href="/clarity-act"
        className="text-xs font-mono text-text-tertiary hover:text-text-secondary"
      >
        CLARITY Act
      </Link>

      <header className="mt-6">
        <h1 className="text-4xl font-semibold leading-tight tracking-tighter text-text-primary">
          {topic.h1}
        </h1>
        <p className="mt-5 text-[1.0625rem] leading-relaxed text-text-secondary">
          {topic.tldr}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-mono text-text-tertiary">
          <span>{AUTHOR_NAME}</span>
          <span className="text-border">|</span>
          <span>Updated {meta.updated_at.slice(0, 10)}</span>
        </div>
        <div className="divider mt-8" />
      </header>

      <div className="mt-10">
        {topic.sections.map((section) => (
          <section key={section.h2}>
            <h2 className="mt-12 mb-4 text-2xl font-semibold tracking-tight text-text-primary">
              {section.h2}
            </h2>
            {section.body.map((para, i) => (
              <p
                key={i}
                className="my-5 text-[1.0625rem] leading-[1.8] text-text-secondary"
              >
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>

      <FaqBlock faqs={topic.faqs} />
      <SourceList sources={topic.sources} />
      <RelatedTopics topics={related} />

      <div className="mt-16 border-t border-border pt-8 text-center">
        <p className="text-sm text-text-tertiary">
          Research and analysis. Not investment or legal advice.
        </p>
        <Link
          href="/scorecard"
          className="mt-4 inline-block rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:bg-amber-hover hover:-translate-y-0.5"
        >
          See the 251-token scorecard
        </Link>
      </div>
    </article>
  );
}

function FaqBlock({ faqs }: { readonly faqs: readonly { question: string; answer: string }[] }) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        Common questions
      </h2>
      <dl className="mt-6 space-y-7">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="text-base font-semibold text-text-primary">
              {faq.question}
            </dt>
            <dd className="mt-2 text-[1.0625rem] leading-[1.8] text-text-secondary">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SourceList({ sources }: { readonly sources: readonly { label: string; url: string }[] }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border pt-8">
      <h2 className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
        Sources
      </h2>
      <ul className="mt-4 space-y-2">
        {sources.map((s) => (
          <li key={s.url} className="text-sm leading-relaxed">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber underline decoration-amber/40 underline-offset-2 hover:decoration-amber"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RelatedTopics({ topics }: { readonly topics: readonly ClarityTopic[] }) {
  if (!Array.isArray(topics) || topics.length === 0) return null;

  return (
    <nav aria-label="Related CLARITY Act analysis" className="mt-14 border-t border-border pt-8">
      <h2 className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
        Keep reading
      </h2>
      <ul className="mt-5 space-y-5">
        {topics.map((t) => (
          <li key={t.slug}>
            <Link href={`/clarity-act/${t.slug}`} className="group block">
              <span className="text-base font-semibold leading-snug text-text-primary group-hover:text-amber">
                {t.h1}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-text-tertiary">
                {t.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NotFoundFallback() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tighter text-text-primary">
        Page Not Found
      </h1>
      <Link
        href="/clarity-act"
        className="mt-4 inline-block text-sm text-text-secondary hover:text-text-primary"
      >
        Back to the CLARITY Act hub
      </Link>
    </div>
  );
}
