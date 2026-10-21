"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ReauditButton({
  url,
  locale,
}: {
  url: string;
  locale: string;
}) {
  const t = useTranslations("report");
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setError(false);
    setRunning(true);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        router.push(`/${locale}/audit/${data.id}`);
        return;
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-lg border border-brand-500/50 bg-brand-500/10 px-5 py-2.5 text-sm font-semibold text-brand-300 transition-colors hover:bg-brand-500/20 disabled:opacity-60"
      >
        {running && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300/30 border-t-brand-300" />
        )}
        {running ? t("reauditRunning") : t("reaudit")}
      </button>
      {error && <span className="ml-3 text-sm text-red-400">{t("reauditError")}</span>}
    </div>
  );
}
