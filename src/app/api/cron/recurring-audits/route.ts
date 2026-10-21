import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAudit } from "@/lib/audit";
import { sendAuditEmail } from "@/lib/mail";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREQUENCY_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

const BATCH_LIMIT = 50;

function isDue(lastRunAt: Date | null, frequency: string, now: Date): boolean {
  if (!lastRunAt) return true;
  const interval = FREQUENCY_MS[frequency] ?? FREQUENCY_MS.daily;
  return now.getTime() - lastRunAt.getTime() >= interval;
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const due = await prisma.recurringAudit.findMany({
    where: { active: true },
    take: BATCH_LIMIT,
  });

  const results = { ran: 0, skipped: 0, failed: 0, emailed: 0 };
  const FREQUENCY_LABEL: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };

  for (const schedule of due) {
    if (!isDue(schedule.lastRunAt, schedule.frequency, now)) {
      results.skipped += 1;
      continue;
    }

    try {
      const audit = await runAudit(schedule.url);
      const saved = await prisma.audit.create({
        data: {
          url: audit.url,
          score: audit.score,
          result: JSON.stringify(audit),
          status: "completed",
          userId: schedule.userId,
        },
      });
      await prisma.recurringAudit.update({
        where: { id: schedule.id },
        data: { lastRunAt: now },
      });
      results.ran += 1;

      const user = await prisma.user.findUnique({ where: { id: schedule.userId } });
      if (user?.email && user.emailReports) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://seokub.com";
        const sent = await sendAuditEmail(
          user.email,
          audit,
          `${siteUrl}/audit/${saved.id}`,
          FREQUENCY_LABEL[schedule.frequency] ?? "Scheduled"
        );
        if (sent) results.emailed += 1;
      }
    } catch {
      results.failed += 1;
    }
  }

  return NextResponse.json({
    ...results,
    processed: due.length,
    timestamp: now.toISOString(),
  });
}

export const dynamic = "force-dynamic";
