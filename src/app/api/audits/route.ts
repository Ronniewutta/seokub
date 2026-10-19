import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const key = `audit:${session.user.id}`;
  const { allowed, retryAfter } = rateLimit(key, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: `Too many audits. Try again in ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "url_required" }, { status: 400 });
  }

  try {
    new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    const result = await runAudit(url);
    const audit = await prisma.audit.create({
      data: {
        url: result.url,
        score: result.score,
        result: JSON.stringify(result),
        status: "completed",
        userId: session.user.id,
      },
    });
    return NextResponse.json({ id: audit.id, score: result.score }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed";
    return NextResponse.json({ error: "audit_failed", message }, { status: 502 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const audits = await prisma.audit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      score: true,
      status: true,
      createdAt: true,
      result: true,
    },
  });

  const summary = audits.map((a) => {
    let issues = 0;
    try {
      const parsed = JSON.parse(a.result);
      issues = parsed.checks.filter((c: { status: string }) => c.status === "fail" || c.status === "warn").length;
    } catch {
      /* keep default */
    }
    return { ...a, result: undefined, issues };
  });

  return NextResponse.json({ audits: summary });
}
