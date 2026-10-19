import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import SignInButton from "@/components/SignInButton";
import DevLoginForm from "@/components/DevLoginForm";
import { isDevLoginEnabled } from "@/lib/auth";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-400 text-xl font-bold text-zinc-950">
          S
        </span>
        <h1 className="mt-6 text-center text-2xl font-bold text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          {t("subtitle")}
        </p>
        <div className="mt-8">
          <SignInButton
            label={t("google")}
            callbackUrl="/dashboard"
            className="w-full py-3"
          />
        </div>
        {isDevLoginEnabled && <DevLoginForm callbackUrl="/dashboard" />}
        <p className="mt-6 text-center text-xs leading-relaxed text-zinc-600">
          {t("terms")}
        </p>
      </div>
    </div>
  );
}
