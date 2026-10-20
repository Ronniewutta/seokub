# SEOKUB

SEO audit & suggestion SaaS — a lighter alternative to Ahrefs, Semrush, SE Ranking, Ubersuggest and Moz Pro.

## Features

- **20+ on-page SEO checks** — title, meta description, H1, heading hierarchy, image alt text, canonical, robots, Open Graph, Twitter Cards, JSON-LD structured data, viewport, HTTPS, HTML lang, content depth, internal linking, favicon, sitemap, broken-link sampling, URL length, URL params, server speed (TTFB)
- **0–100 health score** with prioritized, plain-English recommendations
- **Google sign-in** (NextAuth, database sessions)
- **8 markets**: English, Thai, Hindi, Indonesian, Arabic (RTL), Spanish, French, Portuguese, Vietnamese
- **Security**: CSP + security headers, CSRF protection (NextAuth), per-user rate limiting, dependency audit in CI

## Stack

- Next.js 14 (App Router) + TypeScript
- NextAuth v4 (Google provider) + Prisma (SQLite for dev, switch to PostgreSQL for prod)
- next-intl for i18n
- Tailwind CSS (lime green theme)
- cheerio for server-side HTML analysis

## Getting started

```bash
cp .env.example .env.local
```

Fill in:

- `NEXTAUTH_SECRET` — random string (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`)

Then:

```bash
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000 — the middleware redirects to your locale (default English).

**Dev login:** in development (or when `ENABLE_DEV_LOGIN=true`), the login page shows a "Development access" form — enter any email to sign in without Google OAuth. This is automatically disabled in production.

## API

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/audits` | Run an audit `{ "url": "https://example.com" }` (rate-limited: 5/min per user) |
| GET | `/api/audits` | List the signed-in user's audits |
| GET | `/api/audits/:id` | Get a single audit report |

All endpoints require a valid session.

## Project structure

```
src/
  app/
    [locale]/           # localized pages (en, th, hi, id, ar, es, fr, pt, vi)
      login/            # Google sign-in
      dashboard/        # protected audit list + stats
      audit/new/        # audit form
      audit/[id]/       # report view
    api/
      auth/[...nextauth]/
      audits/           # POST + GET
      audits/[id]/      # GET
  components/           # Header, Footer, forms, report client
  lib/
    audit.ts            # crawler + 20+ checks engine
    auth.ts             # NextAuth config (Google provider)
    prisma.ts           # Prisma client singleton
    rateLimit.ts        # in-memory per-user limiter
  i18n/                 # routing, navigation, middleware wiring
messages/               # 9 locale dictionaries
prisma/schema.prisma    # User/Account/Session (NextAuth) + Audit
```

## Production checklist

- [x] Health check: `GET /api/health` (DB ping, 503 on failure)
- [x] robots.txt + localized sitemap at `/robots.txt` and `/sitemap.xml`
- [x] Audit API maxDuration set to 60s (Vercel `vercel.json` + route export)
- [x] Custom logo (`src/app/icon.svg`)
- [ ] Replace SQLite with PostgreSQL — **required on Vercel** (read-only filesystem). Use [Neon](https://neon.tech) free tier: change `provider = "postgresql"` in `prisma/schema.prisma` and set `DATABASE_URL` to the Neon connection string, then `npx prisma db push`.
- [ ] Set `NEXTAUTH_URL=https://seokub.com` and `NEXT_PUBLIC_SITE_URL=https://seokub.com`
- [ ] Add Google Search Console API for real ranking data (keyword positions, impressions)
- [ ] Add recurring audits + email reports (cron queue)

## Deploy on Vercel

1. Push to GitHub (done), then import the repo at [vercel.com/new](https://vercel.com/new)
2. Add environment variables in Project → Settings → Environment Variables:
   - `NEXTAUTH_URL` = `https://seokub.com`
   - `NEXTAUTH_SECRET` = a long random string
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` = from Google Cloud Console
   - `DATABASE_URL` = PostgreSQL connection string (Neon recommended)
   - `NEXT_PUBLIC_SITE_URL` = `https://seokub.com`
3. Set the Google OAuth redirect URI to `https://seokub.com/api/auth/callback/google`
4. Deploy — then verify:
   - `/api/health` returns `{"status":"ok","db":"up"}`
   - `/sitemap.xml` lists all 9 locales
   - `/robots.txt` disallows `/dashboard` and `/api`

SQLite works locally; switch to PostgreSQL before deploying since Vercel's filesystem is read-only.
