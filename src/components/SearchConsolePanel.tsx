"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { SearchConsoleSummary } from "@/lib/searchConsole";

export default function SearchConsolePanel({ url }: { url: string }) {
  const t = useTranslations("gsc");
  const [data, setData] = useState<SearchConsoleSummary | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "not_connected" | "error" | "rate_limited">("loading");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/search-console?url=${encodeURIComponent(url)}`);
        if (res.status === 403) {
          if (!cancelled) setState("not_connected");
          return;
        }
        if (res.status === 429) {
          if (!cancelled) setState("rate_limited");
          return;
        }
        const json = await res.json();
        if (res.ok) {
          if (!cancelled) {
            setData(json);
            setState("ready");
          }
          return;
        }
        if (!cancelled) setState("error");
      } catch {
        if (!cancelled) setState("error");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state === "loading") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-sm text-zinc-500">
        {t("loading")}
      </div>
    );
  }

  if (state === "not_connected") {
    return (
      <div className="rounded-xl border border-dashed border-brand-500/40 bg-brand-500/5 px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5 10.5 6l4.5 4.5L21 3.5M3 13.5v4.5A2.25 2.25 0 0 0 5.25 20.25h13.5A2.25 2.25 0 0 0 21 18v-4.5" />
          </svg>
        </span>
        <h3 className="mt-4 font-semibold text-zinc-50">{t("notConnectedTitle")}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
          {t("notConnectedDesc")}
        </p>
        <a
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-brand-300"
        >
          {t("notConnectedCta")}
        </a>
      </div>
    );
  }

  if (state === "error" || state === "rate_limited" || !data) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-10 text-center text-sm text-zinc-500">
        {state === "rate_limited" ? t("rateLimited") : t("error")}
      </div>
    );
  }

  const fmtNumber = new Intl.NumberFormat();
  const fmtPercent = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 });
  const fmtPosition = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard label={t("clicks")} value={fmtNumber.format(data.totalClicks)} />
        <SummaryCard label={t("impressions")} value={fmtNumber.format(data.totalImpressions)} />
        <SummaryCard label={t("avgCtr")} value={fmtPercent.format(data.averageCtr)} />
        <SummaryCard label={t("avgPosition")} value={fmtPosition.format(data.averagePosition)} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3 font-medium">{t("query")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("clicks")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("impressions")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("avgCtr")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("avgPosition")}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                  {t("noData")}
                </td>
              </tr>
            ) : (
              data.rows.map((row) => (
                <tr key={row.query} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                  <td className="max-w-sm truncate px-5 py-3 text-zinc-200">{row.query}</td>
                  <td className="px-5 py-3 text-right text-zinc-300">{fmtNumber.format(row.clicks)}</td>
                  <td className="px-5 py-3 text-right text-zinc-300">{fmtNumber.format(row.impressions)}</td>
                  <td className="px-5 py-3 text-right text-zinc-300">{fmtPercent.format(row.ctr)}</td>
                  <td className="px-5 py-3 text-right text-zinc-300">{fmtPosition.format(row.position)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-50">{value}</p>
    </div>
  );
}
