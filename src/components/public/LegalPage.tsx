import { Fragment } from 'react';
import type { LegalDocument } from '@/lib/legal-pages';

// Email addresses and https links inside the legal text become links. The
// trailing character class keeps sentence punctuation out of the URL.
const LINK_PATTERN = /(https:\/\/\S+[^\s.,;:)]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

function withLinks(text: string) {
  return text.split(LINK_PATTERN).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith('https://')) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    }
    return (
      <a key={i} href={`mailto:${part}`} className="whitespace-nowrap">
        {part}
      </a>
    );
  });
}

export default function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <section className="bg-cream">
      <div className="container-narrow pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-[760px]">
          <p className="text-[13px] font-body font-medium text-bronze uppercase tracking-[0.18em] mb-5">
            {doc.eyebrow}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[56px] font-normal text-ink tracking-[-0.02em] leading-[1.05]">
            {doc.title}
          </h1>
          {doc.updated && <p className="mt-5 text-[14px] font-body text-ink-mid">{doc.updated}</p>}
          {doc.intro && (
            <p className="mt-8 text-[17px] md:text-[18px] font-body text-ink-mid leading-[1.6]">{doc.intro}</p>
          )}
          <div className="prose-content mt-10 pt-2 border-t border-warm-border text-[16px]">
            {doc.sections.map((section) => (
              <Fragment key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i}>{withLinks(paragraph)}</p>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
