"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import SignInButton from "./SignInButton";
import LinkButton from "./LinkButton";

export default function PricingSection() {
  const t = useTranslations("pricing");
  const [yearly, setYearly] = useState(true);

  const plans = ["free", "pro", "agency"] as const;
  const features = (plan: (typeof plans)[number]) =>
    t.raw(`plans.${plan}.features`) as string[];

  return (
    <section id="pricing" className="border-t border-zinc-800/60 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            {t("kicker")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-zinc-400">{t("subtitle")}</p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/60 p-1">
            {(["monthly", "yearly"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setYearly(key === "yearly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  (key === "yearly") === yearly
                    ? "bg-brand-400 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t(key)}
                {key === "yearly" && (
                  <span className="ml-2 rounded-full bg-zinc-950/15 px-2 py-0.5 text-xs">
                    {t("save")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly
              ? (t.raw(`plans.${plan}.yearly`) as number)
              : (t.raw(`plans.${plan}.monthly`) as number);
            const isPro = plan === "pro";
            return (
              <div
                key={plan}
                className={`relative rounded-2xl border p-7 ${
                  isPro
                    ? "border-brand-500/60 bg-gradient-to-b from-brand-500/10 to-transparent"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3 left-7 rounded-full bg-brand-400 px-3 py-1 text-xs font-bold text-zinc-950">
                    {t("mostPopular")}
                  </span>
                )}
                <h3 className="text-xl font-bold text-zinc-50">
                  {t(`plans.${plan}.name`)}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {t(`plans.${plan}.tagline`)}
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-zinc-50">
                    ${price}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-zinc-500">
                      {t("perMonth")}
                    </span>
                  )}
                </div>
                {price > 0 && yearly && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {t("billedAnnually")}
                  </p>
                )}
                <div className="mt-6">
                  {plan === "agency" ? (
                    <LinkButton
                      href="mailto:sales@seokub.com"
                      label={t("plans.agency.cta")}
                      className="w-full justify-center"
                    />
                  ) : (
                    <SignInButton
                      label={t(`plans.${plan}.cta`)}
                      callbackUrl="/audit/new"
                      variant={isPro ? "primary" : "outline"}
                      className="w-full justify-center py-2.5"
                    />
                  )}
                </div>
                <ul className="mt-7 space-y-3">
                  {features(plan).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
