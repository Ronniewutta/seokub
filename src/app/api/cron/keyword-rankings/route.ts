import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSerpProvider, findPosition } from "@/lib/serp";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_LIMIT = 50;
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const provider = getSerpProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "not_configured", message: "No SERP provider configured" },
      { status: 503 }
    );
  }

  const now = new Date();
  const keywords = await prisma.keyword.findMany({
    take: BATCH_LIMIT,
    include: { rankings: { orderBy: { date: "desc" }, take: 1 } },
  });

  const results = { refreshed: 0, skipped: 0, failed: 0, notRanking: 0 };

  for (const kw of keywords) {
    const latest = kw.rankings[0];
    if (latest && now.getTime() - latest.date.getTime() < REFRESH_INTERVAL_MS) {
      results.skipped += 1;
      continue;
    }

    try {
      const serp = await provider.search(kw.keyword, kw.location, kw.domain);
      const match = findPosition(serp, kw.domain);
      if (!match) {
        results.notRanking += 1;
      }
      await prisma.keywordRanking.create({
        data: {
          keywordId: kw.id,
          position: match?.position ?? null,
          url: match?.url ?? null,
          title: match?.title ?? null,
        },
      });
      results.refreshed += 1;
    } catch {
      results.failed += 1;
    }
  }

  return NextResponse.json({
    ...results,
    provider: provider.name,
    processed: keywords.length,
    timestamp: now.toISOString(),
  });
}

export const dynamic = "force-dynamic";
