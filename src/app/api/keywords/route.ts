import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serpConfigured } from "@/lib/serp";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const keywords = await prisma.keyword.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      rankings: {
        orderBy: { date: "desc" },
        take: 2,
      },
    },
  });

  const data = keywords.map((k) => {
    const latest = k.rankings[0] ?? null;
    const previous = k.rankings[1] ?? null;
    const change =
      latest?.position != null && previous?.position != null
        ? previous.position - latest.position
        : null;
    return {
      id: k.id,
      domain: k.domain,
      keyword: k.keyword,
      location: k.location,
      position: latest?.position ?? null,
      url: latest?.url ?? null,
      date: latest?.date ?? null,
      change,
    };
  });

  return NextResponse.json({ keywords: data, configured: serpConfigured });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { domain?: string; keyword?: string; location?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const domain = body.domain?.trim();
  const keyword = body.keyword?.trim();
  const location = body.location?.trim() || "United States";

  if (!domain || !keyword) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    new URL(/^https?:\/\//i.test(domain) ? domain : `https://${domain}`);
  } catch {
    return NextResponse.json({ error: "invalid_domain" }, { status: 400 });
  }

  const created = await prisma.keyword.upsert({
    where: {
      userId_domain_keyword_location: {
        userId: session.user.id,
        domain,
        keyword,
        location,
      },
    },
    update: {},
    create: { userId: session.user.id, domain, keyword, location },
  });

  return NextResponse.json({ keyword: created }, { status: 201 });
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

  await prisma.keyword.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
