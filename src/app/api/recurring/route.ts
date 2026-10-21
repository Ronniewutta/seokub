import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
type Frequency = (typeof FREQUENCIES)[number];

function isFrequency(value: unknown): value is Frequency {
  return typeof value === "string" && (FREQUENCIES as readonly string[]).includes(value);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const schedules = await prisma.recurringAudit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ schedules });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { url?: string; frequency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const url = body.url?.trim();
  const frequency = body.frequency;
  if (!url || !isFrequency(frequency)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const schedule = await prisma.recurringAudit.upsert({
    where: {
      userId_url_frequency: { userId: session.user.id, url, frequency },
    },
    update: { active: true },
    create: { userId: session.user.id, url, frequency },
  });

  return NextResponse.json({ schedule }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  await prisma.recurringAudit.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
