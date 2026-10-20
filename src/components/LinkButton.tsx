"use client";

import { Link } from "@/i18n/navigation";

export default function LinkButton({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-brand-400 hover:text-brand-300 ${className}`}
    >
      {label}
    </Link>
  );
}
