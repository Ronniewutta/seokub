import { getTranslations } from "next-intl/server";

interface FaqItem {
  q: string;
  a: string;
}

export default async function FaqSection() {
  const t = await getTranslations("pricing.faq");
  const items = t.raw("items") as FaqItem[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <section id="faq" className="border-t border-zinc-800/60 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            {t("kicker")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {t("title")}
          </h2>
        </div>
        <div className="mt-10 space-y-4">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-5 open:border-brand-500/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-zinc-50">
                {item.q}
                <svg
                  className="h-5 w-5 shrink-0 text-brand-400 transition-transform group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
