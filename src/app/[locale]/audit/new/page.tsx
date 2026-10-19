import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import NewAuditForm from "@/components/NewAuditForm";

export default async function NewAuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("new");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
        {t("title")}
      </h1>
      <p className="mt-2 text-zinc-400">{t("subtitle")}</p>
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <NewAuditForm />
      </div>
    </div>
  );
}
