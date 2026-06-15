import { getTranslations } from 'next-intl/server';

interface Props {
  locale: string;
}

export default async function CustomizationWorkflowSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'home.workflow' });

  const steps = [
    { title: t('step1Title'), desc: t('step1Desc') },
    { title: t('step2Title'), desc: t('step2Desc') },
    { title: t('step3Title'), desc: t('step3Desc') },
  ];

  return (
    <section className="bg-cream border-b border-warm-border">
      <div className="container-wide py-16 md:py-20">
        {/* Compact header — eyebrow + heading on one editorial line, intro to
            the side so the block stays short. */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-12">
          <div data-reveal>
            <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.22em] mb-4">
              {t('eyebrow')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-normal text-ink leading-[1.05] tracking-[-0.02em]">
              {t('heading')}
            </h2>
          </div>
          <p className="lg:max-w-sm lg:text-end text-[15px] md:text-[16px] font-body font-normal text-ink-mid leading-[1.65] lg:pb-1.5" data-reveal>
            {t('body')}
          </p>
        </div>

        {/* Steps — outlined serif numerals that fill on hover; a hairline opens
            the row and thin connectors imply the forward flow. */}
        <ol
          className="mt-12 md:mt-14 grid grid-cols-1 md:grid-cols-3 border-t border-warm-border"
          data-reveal-stagger
        >
          {steps.map((s, i) => (
            <li
              key={i}
              data-reveal
              className={[
                'group pt-8 md:pt-10 pb-1 md:px-9 lg:px-12',
                i !== steps.length - 1 ? 'md:border-e md:border-warm-border' : '',
                i !== 0 ? 'border-t border-warm-border md:border-t-0' : '',
              ].join(' ')}
            >
              <span
                className="block font-display text-[56px] md:text-[68px] font-normal leading-none tracking-[-0.03em] tabular-nums text-transparent [-webkit-text-stroke:1.5px_#A88E6F] transition-all duration-500 ease-out group-hover:text-bronze group-hover:[-webkit-text-stroke:0px]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 font-display text-[20px] md:text-[22px] font-normal text-ink leading-[1.25] tracking-[-0.01em] transition-colors duration-300 group-hover:text-bronze">
                {s.title}
              </h3>
              <p className="mt-3 text-[14px] md:text-[15px] font-body font-normal text-ink-mid leading-[1.6] max-w-sm">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
