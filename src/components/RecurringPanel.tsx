"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Schedule {
  id: string;
  url: string;
  frequency: string;
  active: boolean;
  lastRunAt: string | null;
  createdAt: string;
}

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;

export default function RecurringPanel({ url }: { url: string }) {
  const t = useTranslations("recurring");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>("weekly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/recurring");
      if (res.ok) {
        const data = await res.json();
        setSchedules((data.schedules ?? []).filter((s: Schedule) => s.url === url));
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function handleAdd() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, frequency }),
      });
      if (res.ok) {
        setMessage(t("created"));
        await load();
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await fetch(`/api/recurring?id=${id}`, { method: "DELETE" });
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      setMessage(t("removed"));
    } catch {
      /* ignore */
    }
  }

  const fmt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-zinc-300">
            {t("frequency")}
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as (typeof FREQUENCIES)[number])}
            className="mt-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-400"
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {t(f)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading}
          className="rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-brand-300 disabled:opacity-60"
        >
          {loading ? t("adding") : t("add")}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-brand-300">{message}</p>}

      <div className="mt-6 space-y-3">
        {schedules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-6 py-8 text-center text-sm text-zinc-500">
            {t("empty")}
          </p>
        ) : (
          schedules.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4"
            >
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold capitalize text-brand-300">
                  {t(s.frequency)}
                </span>
                <p className="mt-2 text-xs text-zinc-500">
                  {t("lastRun")}: {s.lastRunAt ? fmt.format(new Date(s.lastRunAt)) : t("never")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(s.id)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
              >
                {t("remove")}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
