import { prisma } from "./prisma";

export interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleSummary {
  siteUrl: string;
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  rows: SearchConsoleQuery[];
}

interface GoogleAccount {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
}

const GSC_QUERY_DAYS = 28;

function toSiteUrl(input: string): string {
  const url = /^https?:\/\//i.test(input) ? new URL(input) : new URL(`https://${input}`);
  return `${url.protocol}//${url.host}/`;
}

function toDomainProperty(input: string): string {
  const url = /^https?:\/\//i.test(input) ? new URL(input) : new URL(`https://${input}`);
  return `sc-domain:${url.hostname}`;
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function refreshAccessToken(
  account: GoogleAccount
): Promise<{ access_token: string; expires_at: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: account.refresh_token ?? "",
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token refresh failed (HTTP ${res.status})`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
  return { access_token: data.access_token, expires_at: expiresAt };
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    orderBy: { expires_at: "desc" },
  });
  if (!account) return null;

  const needsRefresh = !account.access_token || !account.expires_at || account.expires_at * 1000 < Date.now();

  if (needsRefresh) {
    if (!account.refresh_token) return null;
    try {
      const refreshed = await refreshAccessToken(account);
      await prisma.account.update({
        where: { id: account.id },
        data: { access_token: refreshed.access_token, expires_at: refreshed.expires_at },
      });
      return refreshed.access_token;
    } catch {
      return null;
    }
  }

  return account.access_token;
}

async function gscRequest(
  accessToken: string,
  siteUrl: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      (data.error as { message?: string } | undefined)?.message ??
        `Google Search Console error (HTTP ${res.status})`
    );
  }
  return data;
}

export async function getSearchConsoleSummary(
  accessToken: string,
  inputUrl: string
): Promise<SearchConsoleSummary> {
  const siteUrl = toSiteUrl(inputUrl);
  const body = {
    startDate: dateNDaysAgo(GSC_QUERY_DAYS),
    endDate: dateNDaysAgo(0),
    dimensions: ["query"],
    rowLimit: 25,
    startRow: 0,
  };

  let data: Record<string, unknown>;
  try {
    data = await gscRequest(accessToken, siteUrl, body);
  } catch {
    data = await gscRequest(accessToken, toDomainProperty(inputUrl), body);
  }

  const rowsRaw = (data.rows as Array<Record<string, unknown>>) ?? [];
  const rows: SearchConsoleQuery[] = rowsRaw.map((r) => ({
    query: (r.keys as string[])[0] ?? "",
    clicks: (r.clicks as number) ?? 0,
    impressions: (r.impressions as number) ?? 0,
    ctr: (r.ctr as number) ?? 0,
    position: (r.position as number) ?? 0,
  }));

  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const averagePosition = rows.length > 0 ? rows.reduce((s, r) => s + r.position, 0) / rows.length : 0;

  return {
    siteUrl,
    totalClicks,
    totalImpressions,
    averageCtr,
    averagePosition,
    rows,
  };
}
