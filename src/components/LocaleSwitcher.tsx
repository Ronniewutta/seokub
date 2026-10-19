"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "th", label: "ไทย" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "ID" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "pt", label: "PT" },
  { code: "vi", label: "VI" },
];

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="relative inline-block text-left">
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => router.push(pathname, { locale: e.target.value })}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs font-medium text-zinc-200 outline-none focus:border-brand-400 cursor-pointer"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
