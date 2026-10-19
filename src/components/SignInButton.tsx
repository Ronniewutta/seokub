"use client";

import { signIn } from "next-auth/react";

export default function SignInButton({
  label,
  callbackUrl = "/dashboard",
  variant = "primary",
  className = "",
}: {
  label: string;
  callbackUrl?: string;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer";
  const styles =
    variant === "primary"
      ? "bg-brand-400 text-zinc-950 hover:bg-brand-300"
      : "border border-zinc-700 text-zinc-100 hover:border-brand-400 hover:text-brand-300";
  return (
    <button
      type="button"
      className={`${base} ${styles} ${className}`}
      onClick={() => signIn("google", { callbackUrl })}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z"
        />
      </svg>
      {label}
    </button>
  );
}
