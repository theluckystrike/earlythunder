import type { Metadata } from "next";
import OwnTranslationGenerator from "@/components/OwnTranslationGenerator";

export const metadata: Metadata = {
  title: "How to Cite My Own Translation in MLA (and APA) — Generator + Rules",
  description:
    "You translated the source yourself. Here is exactly how MLA and APA want a self-translation credited, with a free generator that formats works-cited entries, in-text citations, and non-Latin original titles.",
  alternates: { canonical: "/cite-my-own-translation-mla/" },
};

const H2 = "mt-10 text-2xl font-bold tracking-tight";
const P = "mt-4 text-gray-700 leading-relaxed";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        How to Cite My Own Translation in MLA (and APA)
      </h1>
      <p className="mt-4 text-lg text-gray-700">
        You read a source in another language, translated it yourself, and now your professor wants
        it cited. Most citation guides assume a published translator exists. When you are the
        translator, the rules change in small but grade-relevant ways. This page gives you both
        styles, a generator that handles non-Latin original titles, and the exact handbook rules
        behind each choice.
      </p>

      <section className="mt-8">
        <OwnTranslationGenerator />
      </section>

      <h2 className={H2}>The short answer</h2>
      <p className={P}>
        In MLA, cite the original work as usual and mark your own rendering with{" "}
        <em>my trans.</em> where a translator&rsquo;s name would indicate someone else&rsquo;s.
        In APA, cite the original author and year; APA does not credit an unpublished translator,
        so your translation is treated like a paraphrase you must make honest in prose.
      </p>

      <h2 className={H2}>MLA, step by step</h2>
      <p className={P}>
        The MLA Handbook (9th ed., section 6.35 and the style.mla.org guidance on translated
        sources) keeps it simple: a works-cited entry describes the source you used, not your
        workflow. So the entry is the original work&rsquo;s author, title, publisher, and year.
        When you quote, add <em>my trans.</em> after the page number to signal the wording is
        yours.
      </p>
      <p className="mt-4 rounded-md bg-gray-50 p-4 text-sm italic">
        (Bulgakov 112; my trans.)
      </p>
      <p className={P}>
        If the original title is in a non-Latin script, MLA says give your translation of the
        title and may include the original in brackets. The generator above does this
        automatically when it detects Cyrillic, Greek, CJK, Arabic, Hebrew, Devanagari, Georgian,
        or Korean characters.
      </p>
      <p className={P}>
        One nuance people miss: MLA&rsquo;s <em>translator-same-as-author</em> guidance applies
        when a published author translated their own book. That case uses &ldquo;Trans. by the
        author&rdquo; style handling, not <em>my trans.</em> Use <em>my trans.</em> only for your
        own unpublished translation inside your paper.
      </p>

      <h2 className={H2}>APA, step by step</h2>
      <p className={P}>
        APA 7 does not have a &ldquo;my trans.&rdquo; tag. The Publication Manual treats your
        translation as a paraphrase of the original, so the in-text citation is the original
        author and year, with a page number when you quote. The honesty requirement is handled in
        prose: tell the reader the translation is yours.
      </p>
      <p className="mt-4 rounded-md bg-gray-50 p-4 text-sm italic">
        (Bulgakov, 1996, p. 112)
      </p>
      <p className={P}>
        In the reference list, APA wants the title in the language of the work you read, with an
        English translation in square brackets for non-English titles. If you read a Russian
        novel in your own English rendering, the bracket holds your title. Include the original
        publication year in text when it matters, in the classic two-date form the APA Style
        blog documents for translated works.
      </p>

      <h2 className={H2}>Common mistakes</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
        <li>
          Citing a published translation you did not use. If you worked from the original, cite
          the original edition.
        </li>
        <li>
          Inventing a translator credit for yourself in the reference list. APA gives
          unpublished translators no entry; MLA keeps you out of the works-cited page entirely.
        </li>
        <li>
          Leaving out <em>my trans.</em> in MLA. Without it, a reader assumes quoted wording
          comes from a published translation, which is a source-integrity problem.
        </li>
        <li>
          Transliterating a non-Latin title when the style guide asks for the original script in
          brackets. Pick one convention and keep it consistent across your paper.
        </li>
      </ul>

      <h2 className={H2}>Sources for the rules on this page</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
        <li>MLA Handbook, 9th edition, sections 6.35 and 6.75 (translations, in-text markers)</li>
        <li>style.mla.org, &ldquo;How do I cite a translated source?&rdquo; and the translator-same-as-author Q&amp;A</li>
        <li>APA Style blog guidance on citing translated works and republished/translated editions</li>
        <li>APA Publication Manual, 7th edition, section 9.38 (works in another language) and 8.x on paraphrase attribution</li>
      </ul>

      <h2 className={H2}>About the author</h2>
      <p className={P}>
        Michael Lip is the founder of Zovo and has shipped more than twenty Chrome extensions,
        including language tools used daily to rewrite and translate text across 80+ languages.
        He builds calculators and generators that solve the citation edge cases the big tools
        skip.
      </p>
    </main>
  );
}
