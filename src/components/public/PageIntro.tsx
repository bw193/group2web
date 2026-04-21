import { ReactNode } from 'react';

interface PageIntroProps {
  title: string;
  eyebrow?: string;
  description?: string;
  children?: ReactNode;
  align?: 'center' | 'left';
}

export default function PageIntro({
  title,
  eyebrow,
  description,
  children,
  align = 'left',
}: PageIntroProps) {
  const centered = align === 'center';

  return (
    <section className="bg-cream border-b border-warm-border">
      <div className="container-wide pt-16 pb-16 md:pt-20 md:pb-24">
        <div className={centered ? 'mx-auto max-w-4xl text-center' : 'max-w-4xl'}>
          {eyebrow && (
            <p
              className={`kicker-plain mb-6 ${centered ? 'justify-center' : ''}`}
              data-reveal
            >
              <span className="text-bronze mr-3">—</span>
              {eyebrow}
            </p>
          )}

          <h1
            className="font-display text-5xl md:text-6xl lg:text-[80px] font-light text-ink leading-[0.98] tracking-[-0.02em]"
            data-reveal
          >
            {title}
          </h1>

          {description && (
            <p
              className={`mt-8 text-[16px] font-body font-light leading-[1.85] text-ink-mid md:text-[17px] max-w-2xl ${
                centered ? 'mx-auto' : ''
              }`}
              data-reveal
            >
              {description}
            </p>
          )}
        </div>

        {children && <div className="mt-12 md:mt-14">{children}</div>}
      </div>
    </section>
  );
}
