"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "./LocaleSwitcher";
import SignInButton from "./SignInButton";
import SignOutButton from "./SignOutButton";
import { useSession } from "next-auth/react";

export default function Header() {
  const t = useTranslations("nav");
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 font-bold text-zinc-950">
            S
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-50">
            SEOKUB
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          <Link href="/#features" className="transition-colors hover:text-brand-300">
            {t("features")}
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-brand-300">
            {t("pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-zinc-200 transition-colors hover:text-brand-300 sm:block"
              >
                {t("dashboard")}
              </Link>
              <Link
                href="/settings"
                className="hidden text-sm font-medium text-zinc-200 transition-colors hover:text-brand-300 sm:block"
              >
                {t("settings")}
              </Link>
              <SignOutButton label={t("logout")} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-zinc-300 transition-colors hover:text-brand-300 sm:block"
              >
                {t("login")}
              </Link>
              <SignInButton label={t("signup")} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
