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
      <div className="container-wide pt-14 pb-14 md:pt-20 md:pb-20">
        <div className={centered ? 'mx-auto max-w-4xl text-center' : 'max-w-4xl'}>
          {eyebrow && (
            <p
              className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5"
              data-reveal
            >
              {eyebrow}
            </p>
          )}

          <h1
            className="font-display text-4xl md:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]"
            data-reveal
          >
            {title}
          </h1>

          {description && (
            <p
              className={`mt-6 text-[17px] font-body font-normal leading-[1.6] text-ink md:text-[18px] max-w-2xl ${
                centered ? 'mx-auto' : ''
              }`}
              data-reveal
            >
              {description}
            </p>
          )}
        </div>

        {children && <div className="mt-10 md:mt-12">{children}</div>}
      </div>
    </section>
  );
}
