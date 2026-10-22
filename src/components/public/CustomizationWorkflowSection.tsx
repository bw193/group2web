import { getTranslations } from 'next-intl/server';
import { Mail, Box, Factory, Truck, Gift, Tag, Clock, Globe, type LucideProps } from 'lucide-react';

interface Props {
  locale: string;
}

// Lucide has no mirror icon; this one follows its 24px grid and stroke style.
function MirrorIcon({ size = 24, strokeWidth = 2, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="12" height="17" x="6" y="2" rx="2" />
      <path d="M9 22h6" />
      <path d="M12 19v3" />
      <path d="m9.5 8.5 3-3" />
      <path d="m9.5 12 5-5" />
    </svg>
  );
}

export default async function CustomizationWorkflowSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'home.workflow' });

  const steps = [
    { title: t('step1Title'), desc: t('step1Desc'), Icon: Mail },
    { title: t('step2Title'), desc: t('step2Desc'), Icon: Box },
    { title: t('step3Title'), desc: t('step3Desc'), Icon: MirrorIcon },
    { title: t('step4Title'), desc: t('step4Desc'), Icon: Factory },
    { title: t('step5Title'), desc: t('step5Desc'), Icon: Truck },
  ];

  const options = [
    t('option1'),
    t('option2'),
    t('option3'),
    t('option4'),
    t('option5'),
    t('option6'),
    t('option7'),
    t('option8'),
  ];

  const perks = [
    { label: t('perk1'), Icon: Gift },
    { label: t('perk2'), Icon: Tag },
    { label: t('perk3'), Icon: Clock },
    { label: t('perk4'), Icon: Globe },
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
            <span className="text-ink">{t('tagline')}</span> {t('body')}
          </p>
        </div>

        {/* Timeline — icon nodes joined by a bronze hairline: down the start
            edge on phones and tablets, across five centered columns from lg.
            Logical start/end keep it running right-to-left in Hebrew. */}
        <ol
          className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-5 gap-y-10 lg:gap-x-8"
          data-reveal-stagger
        >
          {steps.map((s, i) => {
            const Icon = s.Icon;
            return (
              <li key={i} data-reveal className="group relative ps-[4.5rem] lg:ps-0 lg:text-center">
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute start-6 top-14 -bottom-8 w-px bg-bronze/35 lg:start-[calc(50%+2rem)] lg:top-6 lg:bottom-auto lg:h-px lg:w-[calc(100%-2rem)]"
                  />
                )}
                <span className="absolute start-0 top-0 lg:static lg:mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-bronze/45 bg-cream text-bronze transition-colors duration-500 group-hover:border-bronze group-hover:bg-bronze-subtle">
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                </span>
                <span className="block lg:mt-7 font-display text-[28px] font-normal leading-none tabular-nums tracking-[-0.02em]">
                  <span className="text-bronze/35">0</span>
                  <span className="text-bronze">{i + 1}</span>
                </span>
                {/* lining-nums: the display face's old-style "3" sinks below the
                    "D" in "3D Design". */}
                <h3 className="mt-3 font-display text-[20px] md:text-[22px] font-normal text-ink leading-[1.25] tracking-[-0.01em] lining-nums transition-colors duration-300 group-hover:text-bronze">
                  {s.title}
                </h3>
                <p className="mt-2 text-[14px] md:text-[15px] font-body font-normal text-ink-mid leading-[1.6] max-w-xs lg:mx-auto">
                  {s.desc}
                </p>
              </li>
            );
          })}
        </ol>

        {/* Smart function options as quiet square tags, with the four service
            perks beside them. */}
        <div className="mt-12 md:mt-14 pt-10 border-t border-warm-border grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-7" data-reveal>
            <h3 className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.22em]">
              {t('optionsHeading')}
            </h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {options.map((o) => (
                <li
                  key={o}
                  className="border border-warm-border bg-sand px-3.5 py-2 text-[14px] font-body font-normal text-ink leading-none"
                >
                  {o}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[14px] font-body font-normal text-ink-mid leading-snug">
              {t('optionsMore')}
            </p>
          </div>
          <ul
            className="lg:col-span-5 lg:mt-9 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 content-start"
            data-reveal-stagger
          >
            {perks.map(({ label, Icon }) => (
              <li key={label} data-reveal className="flex items-center gap-3">
                <Icon size={20} strokeWidth={1.5} className="text-bronze shrink-0" aria-hidden />
                <span className="text-[15px] font-body font-normal text-ink leading-snug">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
