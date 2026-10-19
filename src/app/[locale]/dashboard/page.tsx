import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import ScoreBadge from "@/components/ScoreBadge";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const audits = await prisma.audit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rows = audits.map((a) => {
    let issues = 0;
    try {
      const parsed = JSON.parse(a.result);
      issues = parsed.checks.filter(
        (c: { status: string }) => c.status === "fail" || c.status === "warn"
      ).length;
    } catch {
      /* keep default */
    }
    return { id: a.id, url: a.url, score: a.score, issues, createdAt: a.createdAt };
  });

  const avgScore =
    rows.length > 0
      ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / rows.length)
      : 0;
  const openIssues = rows.reduce((sum, r) => sum + r.issues, 0);
  const fmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            {t("hi")}
          </h1>
          <p className="mt-1 text-zinc-400">{t("subtitle")}</p>
        </div>
        <Link
          href="/audit/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-brand-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {tNav("newAudit")}
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("statAudits")} value={String(rows.length)} />
        <StatCard label={t("statAvgScore")} value={rows.length ? String(avgScore) : "—"} />
        <StatCard label={t("statIssues")} value={String(openIssues)} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100">{t("tableTitle")}</h2>

        {rows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
            <p className="text-zinc-400">{t("empty")}</p>
            <Link
              href="/audit/new"
              className="mt-4 inline-block rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-brand-300"
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3.5 font-medium">{t("colUrl")}</th>
                  <th className="px-5 py-3.5 font-medium">{t("colScore")}</th>
                  <th className="px-5 py-3.5 font-medium">{t("colIssues")}</th>
                  <th className="px-5 py-3.5 font-medium">{t("colDate")}</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40"
                  >
                    <td className="max-w-md truncate px-5 py-3.5 text-zinc-300">
                      {row.url}
                    </td>
                    <td className="px-5 py-3.5">
                      <ScoreBadge score={row.score} />
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">{row.issues}</td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {fmt.format(row.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/audit/${row.id}`}
                        className="font-medium text-brand-400 transition-colors hover:text-brand-300"
                      >
                        {t("view")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-50">{value}</p>
    </div>
  );
}
