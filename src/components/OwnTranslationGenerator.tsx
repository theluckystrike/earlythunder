"use client";

import { useMemo, useState } from "react";

interface Fields {
  author: string;
  title: string;
  originalTitle: string;
  translator: string;
  publisher: string;
  year: string;
  originalYear: string;
  page: string;
  lang: string;
}

const EMPTY: Fields = {
  author: "",
  title: "",
  originalTitle: "",
  translator: "",
  publisher: "",
  year: "",
  originalYear: "",
  page: "",
  lang: "",
};

const NON_LATIN = /[\u0400-\u04FF\u0370-\u03FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0600-\u06FF\u0590-\u05FF\u0900-\u097F\u10A0-\u10FF]/;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .map((c) => `${c}.`)
    .join(" ");
}

function fmtName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1);
  return `${last}, ${rest.join(" ")}`;
}

export interface Output {
  apaReference: string;
  apaInText: string;
  mlaWorksCited: string;
  mlaInText: string;
  notes: string[];
}

function build(f: Fields, selfTranslated: boolean): Output {
  const notes: string[] = [];
  const author = f.author.trim() || "Author";
  const title = f.title.trim() || "Title";
  const publisher = f.publisher.trim() || "Publisher";
  const year = f.year.trim() || "n.d.";
  const page = f.page.trim();
  const lang = f.lang.trim();
  const hasOriginal = NON_LATIN.test(f.originalTitle);
  const showOriginal = f.originalTitle.trim() !== "" && hasOriginal;
  if (f.originalTitle.trim() !== "" && !hasOriginal) {
    notes.push("The original-title field looks like Latin script, so it is not shown in brackets. Bracketed original titles are for non-Latin scripts (Cyrillic, CJK, Arabic, etc.).");
  }
  if (selfTranslated) {
    notes.push("Self-translation: you are the translator, so APA treats your rendering as a paraphrase (cite the original author, no translator credit) and MLA uses “my trans.” in place of a page-range source marker when quoting.");
  }

  const apaRef = showOriginal
    ? `${fmtName(author)} (${year}). ${f.originalTitle.trim()} [${title}]. ${publisher}.`
    : `${fmtName(author)} (${year}). ${title}. ${publisher}.`;
  const apaInText = page
    ? `(${fmtName(author).split(",")[0]}, ${year}, p. ${page})`
    : `(${fmtName(author).split(",")[0]}, ${year})`;

  const mlaRef = showOriginal
    ? `${fmtName(author)}. ${f.originalTitle.trim()} [${title}]. ${publisher}, ${year}.`
    : `${fmtName(author)}. ${title}. ${publisher}, ${year}.`;
  const mlaInText = page
    ? `(${fmtName(author).split(",")[0]} ${page}${selfTranslated ? "; my trans." : ""})`
    : `(${fmtName(author).split(",")[0]}${selfTranslated ? "; my trans." : ""})`;

  return { apaReference: apaRef, apaInText, mlaWorksCited: mlaRef, mlaInText, notes };
}

const SAMPLE: Fields = {
  author: "Mikhail Bulgakov",
  title: "The Master and Margarita",
  originalTitle: "Мастер и Маргарита",
  translator: "",
  publisher: "Vintage",
  year: "1996",
  originalYear: "",
  page: "112",
  lang: "Russian",
};

export default function OwnTranslationGenerator() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [selfTranslated, setSelfTranslated] = useState(true);

  const output = useMemo(() => build(fields, selfTranslated), [fields, selfTranslated]);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Self-translation citation generator</h2>
      <p className="mt-1 text-sm text-gray-600">
        You translated the material yourself. Fill in what you know; the generator formats both styles.
      </p>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={selfTranslated}
          onChange={(e) => setSelfTranslated(e.target.checked)}
          className="h-4 w-4"
        />
        I made the translation myself (adds MLA &ldquo;my trans.&rdquo;)
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input aria-label="Author" className={inputCls} placeholder="Author (e.g. Mikhail Bulgakov)" value={fields.author} onChange={set("author")} />
        <input aria-label="Translated title" className={inputCls} placeholder="Translated title" value={fields.title} onChange={set("title")} />
        <input aria-label="Original title" className={inputCls} placeholder="Original title (non-Latin script)" value={fields.originalTitle} onChange={set("originalTitle")} />
        <input aria-label="Publisher" className={inputCls} placeholder="Publisher" value={fields.publisher} onChange={set("publisher")} />
        <input aria-label="Year" className={inputCls} placeholder="Year of publication" value={fields.year} onChange={set("year")} />
        <input aria-label="Page" className={inputCls} placeholder="Page number (for in-text)" value={fields.page} onChange={set("page")} />
        <input aria-label="Language" className={inputCls} placeholder="Source language" value={fields.lang} onChange={set("lang")} />
      </div>

      <button
        type="button"
        onClick={() => setFields(SAMPLE)}
        className="mt-3 text-sm text-blue-600 underline"
      >
        Load worked example (Bulgakov, Russian)
      </button>

      <div className="mt-6 space-y-4">
        <OutputBlock label="MLA works cited" text={output.mlaWorksCited} onCopy={copy} />
        <OutputBlock label="MLA in-text" text={output.mlaInText} onCopy={copy} />
        <OutputBlock label="APA reference" text={output.apaReference} onCopy={copy} />
        <OutputBlock label="APA in-text" text={output.apaInText} onCopy={copy} />
        {output.notes.length > 0 && (
          <ul className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            {output.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OutputBlock({ label, text, onCopy }: { label: string; text: string; onCopy: (t: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <button type="button" onClick={() => onCopy(text)} className="text-xs text-blue-600 underline">
          Copy
        </button>
      </div>
      <p className="mt-1 rounded-md bg-gray-50 p-3 text-sm italic">{text}</p>
    </div>
  );
}
