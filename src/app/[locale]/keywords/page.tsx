import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import KeywordsClient from "@/components/KeywordsClient";

export default async function KeywordsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("keywords");

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{t("title")}</h1>
      <p className="mt-2 text-zinc-400">{t("subtitle")}</p>
      <div className="mt-8">
        <KeywordsClient />
      </div>
    </div>
  );
}
