import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const audit = await prisma.audit.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!audit) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let result = null;
  try {
    result = JSON.parse(audit.result);
  } catch {
    /* keep null */
  }

  return NextResponse.json({
    id: audit.id,
    url: audit.url,
    score: audit.score,
    status: audit.status,
    createdAt: audit.createdAt,
    result,
  });
}
