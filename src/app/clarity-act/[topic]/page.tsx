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
import { PageHeader, EyebrowLabel, CardLink, Section } from "@/components/PageChrome";

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
  const related = topic.related
    .map((s) => getClarityTopicBySlug(s))
    .filter((t): t is ClarityTopic => t !== null);

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <TopicSchemas topic={topic} updatedAt={meta.updated_at} />
      <Link
        href="/clarity-act"
        className="text-xs font-mono text-text-tertiary hover:text-text-secondary"
      >
        CLARITY Act
      </Link>
      <PageHeader
        title={topic.h1}
        lead={topic.tldr}
        meta={`${AUTHOR_NAME}. Updated ${meta.updated_at.slice(0, 10)}.`}
      />
      <TopicBody sections={topic.sections} />
      <FaqBlock faqs={topic.faqs} />
      <SourceList sources={topic.sources} />
      <RelatedTopics topics={related} />
      <TopicFooter />
    </article>
  );
}

/** Article, FAQ and breadcrumb JSON-LD for a topic page. */
function TopicSchemas({
  topic,
  updatedAt,
}: {
  readonly topic: ClarityTopic;
  readonly updatedAt: string;
}) {
  console.assert(topic && typeof topic.slug === "string", "TopicSchemas: topic required");
  if (!topic || typeof topic.slug !== "string") return null;

  const articleSchema = buildArticleSchema(topic, updatedAt);
  const faqSchema = getFaqPageSchema(topic.faqs);
  const breadcrumbSchema = getBreadcrumbListSchema([
    { name: "Home", path: "/" },
    { name: "CLARITY Act", path: "/clarity-act" },
    { name: topic.h1, path: `/clarity-act/${topic.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}

function TopicBody({ sections }: { readonly sections: ClarityTopic["sections"] }) {
  console.assert(Array.isArray(sections), "TopicBody: sections array required");
  if (!Array.isArray(sections) || sections.length === 0) return null;

  return (
    <div className="mt-16">
      {sections.map((section) => (
        <section key={section.h2} className="mt-14 first:mt-0">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            {section.h2}
          </h2>
          {section.body.map((para: string, i: number) => (
            <Block key={i} text={para} />
          ))}
        </section>
      ))}
    </div>
  );
}

/** Bounded so a malformed data entry can never render an unbounded list. */
const MAX_LIST_ITEMS = 12;

/**
 * Renders a body block. A block whose lines all start with "- " becomes a
 * list, which reads far better than the same content packed into one
 * long paragraph.
 */
function Block({ text }: { readonly text: string }) {
  console.assert(typeof text === "string", "Block: text must be a string");
  if (typeof text !== "string" || text.length === 0) return null;

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const isList = lines.length > 1 && lines.every((l) => l.startsWith("- "));

  if (!isList) {
    return (
      <p className="mt-5 text-[1.0625rem] leading-[1.75] text-text-secondary">
        {text}
      </p>
    );
  }

  return (
    <ul className="mt-5 space-y-3 border-l border-border pl-5">
      {lines.slice(0, MAX_LIST_ITEMS).map((l, i) => (
        <li key={i} className="text-[1.0625rem] leading-[1.75] text-text-secondary">
          {l.slice(2)}
        </li>
      ))}
    </ul>
  );
}

function TopicFooter() {
  return (
    <div className="mt-16 border-t border-border pt-10 text-center">
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-text-tertiary">
        Research and analysis, not investment or legal advice.
      </p>
      <Link
        href="/scorecard"
        className="mt-5 inline-block rounded-full bg-amber px-6 py-3 text-sm font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:bg-amber-hover hover:shadow-[0_4px_14px_rgba(245,166,35,0.28)]"
      >
        See the 251-token scorecard
      </Link>
    </div>
  );
}

function FaqBlock({ faqs }: { readonly faqs: readonly { question: string; answer: string }[] }) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return (
    <Section divider>
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        Common questions
      </h2>
      <dl className="mt-8 space-y-8">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="text-base font-semibold text-text-primary">
              {faq.question}
            </dt>
            <dd className="mt-3 text-[1.0625rem] leading-[1.75] text-text-secondary">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function SourceList({ sources }: { readonly sources: readonly { label: string; url: string }[] }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return (
    <Section divider>
      <EyebrowLabel>Sources</EyebrowLabel>
      <ul className="space-y-2.5">
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
    </Section>
  );
}

function RelatedTopics({ topics }: { readonly topics: readonly ClarityTopic[] }) {
  if (!Array.isArray(topics) || topics.length === 0) return null;

  return (
    <nav aria-label="Related CLARITY Act analysis" className="mt-16 border-t border-border pt-10">
      <EyebrowLabel>Keep reading</EyebrowLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {topics.map((t) => (
          <CardLink
            key={t.slug}
            href={`/clarity-act/${t.slug}`}
            title={t.h1}
            description={t.description}
          />
        ))}
      </div>
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
