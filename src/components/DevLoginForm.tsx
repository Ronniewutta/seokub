"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function DevLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("dev", { email, redirect: false, callbackUrl });
    if (res?.error) {
      setError(t("devError"));
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t border-zinc-800 pt-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("devTitle")}
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("devPlaceholder")}
        className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-400"
      />
      <button
        type="submit"
        className="mt-3 w-full rounded-lg border border-brand-500/50 bg-brand-500/10 px-4 py-2.5 text-sm font-semibold text-brand-300 transition-colors hover:bg-brand-500/20 cursor-pointer"
      >
        {t("devButton")}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  );
}
