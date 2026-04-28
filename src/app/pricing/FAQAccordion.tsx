"use client";

import { useState, useCallback } from "react";

interface FAQItem {
  readonly q: string;
  readonly a: string;
}

interface FAQAccordionProps {
  readonly items: readonly FAQItem[];
}

/** Accordion that reveals one FAQ answer at a time. */
export default function FAQAccordion({ items }: FAQAccordionProps) {
  console.assert(items.length > 0, "FAQAccordion: items must not be empty");
  console.assert(items.every((i) => i.q.length > 0), "FAQAccordion: all items need a question");

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback(
    (idx: number) => {
      setOpenIndex((prev) => (prev === idx ? null : idx));
    },
    [],
  );

  return (
    <div className="divide-y divide-line-2">
      {items.map((item, idx) => (
        <AccordionRow
          key={item.q}
          item={item}
          isOpen={openIndex === idx}
          onToggle={() => toggle(idx)}
        />
      ))}
    </div>
  );
}

interface AccordionRowProps {
  readonly item: FAQItem;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

/** Single collapsible FAQ row. */
function AccordionRow({ item, isOpen, onToggle }: AccordionRowProps) {
  return (
    <div className="py-5">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-text-primary pr-4">
          {item.q}
        </span>
        <span
          className="text-text-tertiary flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      {isOpen && (
        <p className="mt-3 text-sm text-text-secondary leading-relaxed pr-8">
          {item.a}
        </p>
      )}
    </div>
  );
}
