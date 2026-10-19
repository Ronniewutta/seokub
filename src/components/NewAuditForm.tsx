"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

type FormState = "idle" | "running" | "error";

export default function NewAuditForm() {
  const t = useTranslations("new");
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [url, setUrl] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey(null);

    const trimmed = url.trim();
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      if (!parsed.hostname.includes(".")) throw new Error();
    } catch {
      setState("error");
      setErrorKey("errorInvalid");
      return;
    }

    setState("running");
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: candidate }),
      });

      if (res.status === 429) {
        setState("error");
        setErrorKey("rateLimited");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.id) {
        router.push(`/${locale}/audit/${data.id}`);
        return;
      }

      setState("error");
      setErrorKey("errorFailed");
    } catch {
      setState("error");
      setErrorKey("errorFailed");
    }
  }

  const running = state === "running";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label
        htmlFor="url"
        className="block text-sm font-medium text-zinc-300"
      >
        {t("labelUrl")}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("placeholder")}
          disabled={running}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-brand-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
          )}
          {running ? t("running") : t("button")}
        </button>
      </div>
      {state === "error" && errorKey && (
        <p className="mt-3 text-sm text-red-400">{t(errorKey)}</p>
      )}
    </form>
  );
}
