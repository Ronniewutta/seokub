import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import AuditReportClient from "@/components/AuditReportClient";

export default async function AuditReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("report");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const audit = await prisma.audit.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!audit) {
    notFound();
  }

  let result = null;
  try {
    result = JSON.parse(audit.result);
  } catch {
    notFound();
  }

  const fmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-brand-300"
      >
        <svg
          className="h-4 w-4 rtl:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        {t("back")}
      </Link>

      <div className="mt-6">
        <AuditReportClient
          result={result}
          createdAt={fmt.format(audit.createdAt)}
        />
      </div>
    </div>
  );
}
