"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AuditResult } from "@/lib/audit";
import SearchConsolePanel from "./SearchConsolePanel";

type Tab = "overview" | "issues" | "searchConsole";

export default function AuditReportClient({
  result,
  createdAt,
}: {
  result: AuditResult;
  createdAt: string;
}) {
  const t = useTranslations("report");
  const tChecks = useTranslations("checks");
  const tStatus = useTranslations("status");

  const [tab, setTab] = useState<Tab>("overview");

  const failed = result.checks.filter((c) => c.status === "fail");
  const warned = result.checks.filter((c) => c.status === "warn");
  const passed = result.checks.filter((c) => c.status === "pass");

  const summary = failed.length > 0 ? "fail" : warned.length > 0 ? "warn" : "pass";
  const summaryText =
    summary === "fail"
      ? t("summaryFail")
      : summary === "warn"
        ? t("summaryWarn")
        : t("summaryPass");

  const visibleChecks =
    tab === "overview"
      ? [...failed, ...warned, ...passed]
      : [...failed, ...warned];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <ScoreRing score={result.score} />
        <div className="flex-1">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              summary === "fail"
                ? "bg-red-500/10 text-red-400"
                : summary === "warn"
                  ? "bg-amber-500/10 text-amber-300"
                  : "bg-brand-500/10 text-brand-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                summary === "fail"
                  ? "bg-red-400"
                  : summary === "warn"
                    ? "bg-amber-300"
                    : "bg-brand-400"
              }`}
            />
            {summaryText}
          </span>
          <h2 className="mt-2 break-all text-xl font-semibold text-zinc-50">
            {result.url}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {t("generatedAt")}: {createdAt}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatBox label={t("statWords")} value={String(result.stats.wordCount)} />
        <StatBox
          label={t("statInternalLinks")}
          value={String(result.stats.internalLinks)}
        />
        <StatBox
          label={t("statExternalLinks")}
          value={String(result.stats.externalLinks)}
        />
        <StatBox
          label={t("statResponseTime")}
          value={`${result.stats.responseTimeMs}ms`}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
        {(["overview", "issues", "searchConsole"] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-brand-400 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t(
              key === "overview"
                ? "tabOverview"
                : key === "issues"
                  ? "tabIssues"
                  : "tabSearchConsole"
            )}
            {key === "issues" && (
              <span className="ml-2 rounded-full bg-zinc-950/10 px-2 py-0.5 text-xs">
                {failed.length + warned.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "searchConsole" && (
        <div className="mt-6">
          <SearchConsolePanel url={result.url} />
        </div>
      )}

      <div className={`mt-6 space-y-3 ${tab === "searchConsole" ? "hidden" : ""}`}>
        {visibleChecks.length === 0 && (
          <p className="rounded-xl border border-zinc-800 px-6 py-10 text-center text-sm text-zinc-500">
            {t("summaryPass")}
          </p>
        )}
        {visibleChecks.map((check) => (
          <div
            key={check.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StatusIcon status={check.status} />
                <span className="font-semibold text-zinc-100">
                  {tChecks(check.id)}
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  check.status === "pass"
                    ? "bg-brand-500/10 text-brand-300"
                    : check.status === "warn"
                      ? "bg-amber-500/10 text-amber-300"
                      : check.status === "fail"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-zinc-700/30 text-zinc-400"
                }`}
              >
                {tStatus(check.status)}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-300">{check.finding}</p>
            {check.recommendation && (
              <div className="mt-3 rounded-lg border border-brand-500/20 bg-brand-500/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                  {t("colFix")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                  {check.recommendation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-50">{value}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const cls =
    status === "pass"
      ? "text-brand-400"
      : status === "warn"
        ? "text-amber-300"
        : status === "fail"
          ? "text-red-400"
          : "text-zinc-500";
  return (
    <svg
      className={`h-5 w-5 ${cls}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {status === "pass" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      )}
      {status === "warn" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      )}
      {status === "fail" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      )}
      {status === "info" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12v-.008Z"
        />
      )}
    </svg>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color =
    score >= 80 ? "#a3e635" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-zinc-50">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          / 100
        </span>
      </div>
    </div>
  );
}
