'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';

export interface AccordionItem {
  title: string;
  body: string;
}

/**
 * Numbered expand-one-at-a-time list used for the About page Q&A: rows animate
 * open with a CSS grid-rows transition (animatable to auto height without
 * measuring). The first row starts open so the section never reads as an empty
 * list of labels.
 */
export default function AboutAccordion({ items }: { items: AccordionItem[] }) {
  const [openIdx, setOpenIdx] = useState(0);
  const baseId = useId();

  return (
    <div className="border-t border-warm-border">
      {items.map((item, i) => {
        const open = openIdx === i;
        const headerId = `${baseId}-header-${i}`;
        const panelId = `${baseId}-panel-${i}`;
        return (
          <div key={i} className="border-b border-warm-border">
            <h3 className="m-0">
              <button
                type="button"
                id={headerId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIdx(open ? -1 : i)}
                className="group flex w-full cursor-pointer items-baseline gap-5 py-6 text-start transition-colors duration-300 md:gap-8 md:py-7"
              >
                <span
                  className={`shrink-0 self-center font-body text-[12px] font-semibold tracking-[0.14em] transition-colors duration-300 ${
                    open ? 'text-bronze' : 'text-ink-light group-hover:text-bronze'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`flex-1 self-center font-display text-xl font-normal leading-tight tracking-[-0.01em] transition-all duration-300 md:text-2xl lg:text-[26px] ${
                    open ? 'text-ink' : 'text-ink-mid group-hover:text-ink group-hover:translate-x-1 rtl:group-hover:-translate-x-1'
                  }`}
                >
                  {item.title}
                </span>
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center self-center border transition-all duration-500 ease-out-expo ${
                    open
                      ? 'rotate-45 border-bronze bg-bronze text-cream'
                      : 'border-warm-border text-ink-mid group-hover:border-bronze group-hover:text-bronze'
                  }`}
                  aria-hidden
                >
                  <Plus size={15} strokeWidth={1.75} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className="grid transition-[grid-template-rows] duration-500 ease-out-expo motion-reduce:transition-none"
              style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-7 pe-6 ps-[calc(1.25rem+20px)] font-body text-[15.5px] font-normal leading-[1.7] text-ink-mid md:ps-[calc(2rem+22px)] md:text-[16.5px]">
                  {item.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
