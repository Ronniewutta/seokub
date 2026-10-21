"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface KeywordRow {
  id: string;
  domain: string;
  keyword: string;
  location: string;
  position: number | null;
  url: string | null;
  date: string | null;
  change: number | null;
}

const LOCATIONS = [
  "United States",
  "United Kingdom",
  "Thailand",
  "India",
  "Indonesia",
  "Saudi Arabia",
  "Spain",
  "France",
  "Brazil",
  "Vietnam",
];

export default function KeywordsClient() {
  const t = useTranslations("keywords");
  const [rows, setRows] = useState<KeywordRow[]>([]);
  const [configured, setConfigured] = useState(false);
  const [domain, setDomain] = useState("");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/keywords");
      if (res.ok) {
        const data = await res.json();
        setRows(data.keywords ?? []);
        setConfigured(Boolean(data.configured));
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, keyword, location }),
      });
      if (res.ok) {
        setDomain("");
        setKeyword("");
        await load();
      } else {
        setError(t("addError"));
      }
    } catch {
      setError(t("addError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await fetch(`/api/keywords?id=${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      /* ignore */
    }
  }

  async function handleRefresh() {
    await load();
  }

  const fmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div>
      {!configured && (
        <div className="mb-6 rounded-xl border border-dashed border-brand-500/40 bg-brand-500/5 px-6 py-6">
          <h3 className="font-semibold text-zinc-50">{t("notConfiguredTitle")}</h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{t("notConfiguredDesc")}</p>
          <code className="mt-3 inline-block rounded bg-zinc-900 px-2 py-1 text-xs text-brand-300">
            SERPAPI_KEY
          </code>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          required
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder={t("domainPlaceholder")}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-400 sm:w-56"
        />
        <input
          type="text"
          required
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t("keywordPlaceholder")}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-400"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400"
        >
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-brand-300 disabled:opacity-60"
        >
          {saving ? t("adding") : t("add")}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3 font-medium">{t("keyword")}</th>
              <th className="px-5 py-3 font-medium">{t("domain")}</th>
              <th className="px-5 py-3 font-medium">{t("location")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("position")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("change")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("updated")}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                  {t("loading")}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40"
                >
                  <td className="max-w-[180px] truncate px-5 py-3 text-zinc-200">{row.keyword}</td>
                  <td className="px-5 py-3 text-zinc-400">{row.domain}</td>
                  <td className="px-5 py-3 text-zinc-400">{row.location}</td>
                  <td className="px-5 py-3 text-right">
                    {row.position != null ? (
                      <span
                        className={`font-bold ${
                          row.position <= 10
                            ? "text-brand-300"
                            : row.position <= 30
                              ? "text-amber-300"
                              : "text-zinc-400"
                        }`}
                      >
                        #{row.position}
                      </span>
                    ) : (
                      <span className="text-zinc-600">{t("notRanking")}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ChangeBadge change={row.change} labels={t} />
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-zinc-500">
                    {row.date ? fmt.format(new Date(row.date)) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(row.id)}
                      className="text-xs text-zinc-500 transition-colors hover:text-red-400"
                    >
                      {t("remove")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-brand-400 hover:text-brand-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {t("refresh")}
        </button>
      </div>
    </div>
  );
}

function ChangeBadge({
  change,
  labels,
}: {
  change: number | null;
  labels: (key: string) => string;
}) {
  if (change == null) return <span className="text-zinc-600">—</span>;
  if (change === 0) return <span className="text-zinc-500">±0</span>;
  const positive = change > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${
        positive ? "text-brand-300" : "text-red-400"
      }`}
    >
      <svg
        className={`h-3.5 w-3.5 ${positive ? "" : "rotate-180"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
      </svg>
      {positive ? `+${change}` : change}
      <span className="sr-only">{labels("positions")}</span>
    </span>
  );
}
