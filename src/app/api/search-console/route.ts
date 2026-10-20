import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getValidAccessToken, getSearchConsoleSummary } from "@/lib/searchConsole";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const key = `gsc:${session.user.id}`;
  const { allowed } = rateLimit(key, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url_required" }, { status: 400 });
  }

  const accessToken = await getValidAccessToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "not_connected" },
      { status: 403 }
    );
  }

  try {
    const summary = await getSearchConsoleSummary(accessToken, url);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "GSC request failed";
    return NextResponse.json({ error: "gsc_error", message }, { status: 502 });
  }
}
