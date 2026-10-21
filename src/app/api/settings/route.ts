import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailReports: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { emailReports?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.emailReports !== "boolean") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { emailReports: body.emailReports },
    select: { emailReports: true },
  });

  return NextResponse.json(user);
}
