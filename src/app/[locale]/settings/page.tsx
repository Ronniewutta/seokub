import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import EmailReportsToggle from "@/components/EmailReportsToggle";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t("title")}</h1>
      <p className="mt-2 text-zinc-400">{t("subtitle")}</p>

      <div className="mt-8 space-y-4">
        <EmailReportsToggle />
      </div>

      {session.user.email && (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
          <p className="text-sm text-zinc-500">{t("signedInAs")}</p>
          <p className="mt-1 text-sm font-medium text-zinc-100">{session.user.email}</p>
        </div>
      )}
    </div>
  );
}
