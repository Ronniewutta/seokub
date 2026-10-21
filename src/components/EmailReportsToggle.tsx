"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function EmailReportsToggle() {
  const t = useTranslations("settings");
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setEnabled(Boolean(data.emailReports));
        }
      } catch {
        /* ignore */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailReports: next }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
      <div>
        <p className="font-semibold text-zinc-100">{t("emailReportsTitle")}</p>
        <p className="mt-0.5 text-sm text-zinc-500">{t("emailReportsDesc")}</p>
        {saved && <p className="mt-1 text-xs text-brand-300">{t("saved")}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={saving}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-brand-400" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-zinc-950 transition-all ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
