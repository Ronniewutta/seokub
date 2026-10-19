import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import SignInButton from "@/components/SignInButton";
import LinkButton from "@/components/LinkButton";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "SEOKUB — SEO Audits Without the Bloat",
    description:
      "Know exactly why your site isn't ranking. 20+ on-page SEO checks, broken-link sampling and prioritized fixes in under 30 seconds.",
  };
}

const FEATURES = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;
const STEPS = ["s1", "s2", "s3"] as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(163,230,53,0.12),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
            {t("badge")}
          </span>
          <h1 className="mx-auto mt-8 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-zinc-50 sm:text-6xl">
            {t("titleA")}{" "}
            <span className="text-brand-400">{t("titleB")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            {t("subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignInButton
              label={t("ctaStart")}
              callbackUrl="/audit/new"
              className="px-8 py-3 text-base"
            />
            <LinkButton href="#how" label={t("ctaDemo")} />
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-zinc-800/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            {t("featuresKicker")}
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {t("featuresTitle")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((key, i) => (
              <div
                key={key}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-brand-500/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-lg font-bold text-brand-300">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-zinc-50">
                  {t(`${key}t`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {t(`${key}d`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-zinc-800/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            {t("howKicker")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {t("howTitle")}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((key, i) => (
              <div key={key} className="relative">
                <span className="text-5xl font-extrabold text-brand-500/30">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-zinc-50">
                  {t(`${key}t`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {t(`${key}d`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="border-t border-zinc-800/60 py-20"
      >
        <div className="mx-auto max-w-4xl rounded-3xl border border-brand-500/30 bg-gradient-to-b from-brand-500/10 to-transparent px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
            {t("ctaKicker")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {t("ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            {t("ctaSubtitle")}
          </p>
          <SignInButton
            label={t("ctaButton")}
            callbackUrl="/audit/new"
            className="mt-8 px-8 py-3 text-base"
          />
        </div>
      </section>
    </div>
  );
}
