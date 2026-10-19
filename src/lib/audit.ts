import * as cheerio from "cheerio";

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export interface AuditCheck {
  id: string;
  status: CheckStatus;
  weight: number;
  finding: string;
  recommendation: string;
}

export interface AuditStats {
  title: string | null;
  metaDescription: string | null;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  responseTimeMs: number;
}

export interface AuditResult {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  score: number;
  checks: AuditCheck[];
  stats: AuditStats;
}

interface FetchOutcome {
  ok: boolean;
  status: number;
  body: string;
  headers: Headers;
  responseTimeMs: number;
}

const USER_AGENT = "SEOKUBBot/1.0 (+https://seokub.com/bot)";
const FETCH_TIMEOUT_MS = 15_000;

async function fetchPage(url: string): Promise<FetchOutcome> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      body,
      headers: res.headers,
      responseTimeMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeUrl(input: string): URL {
  let withProtocol = input.trim();
  if (!/^https?:\/\//i.test(withProtocol)) withProtocol = `https://${withProtocol}`;
  const url = new URL(withProtocol);
  if (!url.pathname || url.pathname === "/") url.pathname = "/";
  return url;
}

function makeCheck(
  id: string,
  status: CheckStatus,
  weight: number,
  finding: string,
  recommendation = ""
): AuditCheck {
  return { id, status, weight, finding, recommendation };
}

function absLink(href: string, base: URL): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function isInternal(href: string, base: URL): boolean {
  try {
    return new URL(href).hostname === base.hostname;
  } catch {
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function runAudit(inputUrl: string): Promise<AuditResult> {
  const base = normalizeUrl(inputUrl);
  const outcome = await fetchPage(base.href);

  if (!outcome.ok || !outcome.body) {
    throw new Error(
      `Could not fetch ${base.href} (HTTP ${outcome.status}). Check the URL and that the site allows crawlers.`
    );
  }

  const $ = cheerio.load(outcome.body);
  const checks: AuditCheck[] = [];

  const title = $("title").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ?? null;
  const h1s = $("h1").toArray();
  const headings = $("h1, h2, h3, h4, h5, h6")
    .toArray()
    .map((el) => ({ tag: el.tagName.toLowerCase(), text: $(el).text().trim() }));
  const images = $("img").toArray();
  const imagesMissingAlt = images.filter((el) => {
    const alt = $(el).attr("alt");
    return alt === undefined || alt.trim() === "";
  });
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() ?? null;
  const robotsMeta = $('meta[name="robots"]').attr("content")?.trim() ?? null;
  const ogTags = $('meta[property^="og:"]').toArray();
  const twitterTags = $('meta[name^="twitter:"]').toArray();
  const jsonLd = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => $(el).html())
    .filter((html): html is string => html != null && html.trim() !== "");
  const viewport = $('meta[name="viewport"]').attr("content")?.trim() ?? null;
  const lang = $.root().find("html").first().attr("lang")?.trim() ?? null;
  const favicon =
    $('link[rel~="icon"]').attr("href") ??
    $('link[rel="shortcut icon"]').attr("href") ??
    null;
  const https = base.protocol === "https:";
  const urlSlug = base.pathname;
  const hasUrlParams = base.search.length > 0;

  const bodyText = stripHtml($("body").html() ?? "");
  const wordCount = bodyText ? bodyText.split(" ").length : 0;

  const allLinks = $("a[href]")
    .toArray()
    .map((el) => $(el).attr("href"))
    .filter((href): href is string => !!href)
    .map((href) => absLink(href, base))
    .filter((href): href is string => href !== null)
    .filter(
      (href) =>
        !href.startsWith("javascript:") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:")
    );

  const internalLinks = Array.from(new Set(allLinks.filter((l) => isInternal(l, base))));
  const externalLinks = Array.from(new Set(allLinks.filter((l) => !isInternal(l, base))));

  const [sitemapCheck, faviconCheck, brokenLinkSample] = await Promise.all([
    checkSitemap(base),
    checkFavicon(base, favicon),
    sampleInternalLinks(base, internalLinks.slice(0, 5)),
  ]);

  if (!title) {
    checks.push(
      makeCheck(
        "title",
        "fail",
        10,
        "No <title> tag found.",
        "Add a unique, keyword-relevant title between 30–60 characters. This is the single most important on-page ranking factor and appears as your Google result headline."
      )
    );
  } else if (title.length < 10) {
    checks.push(
      makeCheck(
        "title",
        "warn",
        10,
        `Title is too short (${title.length} characters).`,
        "Expand the title to 30–60 characters with your primary keyword near the front. Short titles waste valuable SERP real estate."
      )
    );
  } else if (title.length > 60) {
    checks.push(
      makeCheck(
        "title",
        "warn",
        10,
        `Title is ${title.length} characters and will be truncated in search results.`,
        "Shorten the title to 50–60 characters so it displays fully in Google without being cut off."
      )
    );
  } else {
    checks.push(
      makeCheck("title", "pass", 10, `Title is ${title.length} characters — within the recommended range.`)
    );
  }

  if (!metaDescription) {
    checks.push(
      makeCheck(
        "metaDescription",
        "fail",
        8,
        "No meta description found.",
        "Write a compelling meta description of 70–160 characters containing your main keyword. It won't directly affect rankings but strongly influences click-through rate."
      )
    );
  } else if (metaDescription.length < 70) {
    checks.push(
      makeCheck(
        "metaDescription",
        "warn",
        8,
        `Meta description is short (${metaDescription.length} characters).`,
        "Extend it to 120–160 characters with a clear value proposition and call to action to maximize click-through rate."
      )
    );
  } else if (metaDescription.length > 160) {
    checks.push(
      makeCheck(
        "metaDescription",
        "warn",
        8,
        `Meta description is ${metaDescription.length} characters and will be truncated.`,
        "Trim it to 70–160 characters so the full message shows in search results."
      )
    );
  } else {
    checks.push(
      makeCheck("metaDescription", "pass", 8, `Meta description is ${metaDescription.length} characters — good length.`)
    );
  }

  if (h1s.length === 0) {
    checks.push(
      makeCheck(
        "h1",
        "fail",
        8,
        "No <h1> tag found.",
        "Add exactly one <h1> per page containing your primary keyword. It signals the page's main topic to search engines."
      )
    );
  } else if (h1s.length > 1) {
    checks.push(
      makeCheck(
        "h1",
        "warn",
        8,
        `${h1s.length} <h1> tags found — pages should have only one.`,
        "Keep a single <h1> per page and demote the others to <h2>. Multiple H1s dilute topical focus."
      )
    );
  } else {
    checks.push(makeCheck("h1", "pass", 8, "Exactly one <h1> tag present."));
  }

  let prevLevel = 0;
  let hierarchyBroken = false;
  for (const h of headings) {
    const level = parseInt(h.tag[1], 10);
    if (prevLevel > 0 && level > prevLevel + 1) {
      hierarchyBroken = true;
      break;
    }
    prevLevel = level;
  }
  if (hierarchyBroken) {
    checks.push(
      makeCheck(
        "headings",
        "warn",
        4,
        "Heading levels are skipped (e.g. <h2> jumps to <h4>).",
        "Fix heading hierarchy so it flows sequentially (h1 → h2 → h3). This improves accessibility and helps search engines understand content structure."
      )
    );
  } else {
    checks.push(makeCheck("headings", "pass", 4, "Heading hierarchy is sequential and well-structured."));
  }

  if (images.length === 0) {
    checks.push(makeCheck("images", "info", 2, "No images found on the page."));
  } else if (imagesMissingAlt.length > 0) {
    checks.push(
      makeCheck(
        "images",
        "warn",
        4,
        `${imagesMissingAlt.length} of ${images.length} images are missing alt text.`,
        "Add descriptive alt attributes to every image. It improves accessibility and image-search traffic."
      )
    );
  } else {
    checks.push(makeCheck("images", "pass", 4, `All ${images.length} images have alt text.`));
  }

  if (!canonical) {
    checks.push(
      makeCheck(
        "canonical",
        "warn",
        5,
        "No canonical link tag found.",
        'Add <link rel="canonical" href="..."> pointing to the preferred version of this URL to prevent duplicate-content issues.'
      )
    );
  } else {
    checks.push(makeCheck("canonical", "pass", 5, "Canonical tag is present."));
  }

  if (robotsMeta && /noindex/i.test(robotsMeta)) {
    checks.push(
      makeCheck(
        "robots",
        "fail",
        10,
        'Page contains <meta name="robots" content="noindex"> and will not be indexed.',
        "Remove the noindex directive if you want this page to appear in Google search results."
      )
    );
  } else {
    checks.push(makeCheck("robots", "pass", 10, "Page is indexable (no noindex directive)."));
  }

  if (ogTags.length === 0) {
    checks.push(
      makeCheck(
        "og",
        "warn",
        3,
        "No Open Graph tags found.",
        "Add og:title, og:description and og:image so the page renders as an attractive card when shared on social networks."
      )
    );
  } else {
    checks.push(makeCheck("og", "pass", 3, `${ogTags.length} Open Graph tags present.`));
  }

  if (twitterTags.length === 0) {
    checks.push(
      makeCheck(
        "twitter",
        "info",
        2,
        "No Twitter Card tags found.",
        "Add twitter:card, twitter:title and twitter:description to control how links preview on X/Twitter."
      )
    );
  } else {
    checks.push(makeCheck("twitter", "pass", 2, `${twitterTags.length} Twitter Card tags present.`));
  }

  if (jsonLd.length === 0) {
    checks.push(
      makeCheck(
        "schema",
        "warn",
        4,
        "No JSON-LD structured data found.",
        "Add schema.org markup (Article, Product, FAQ, BreadcrumbList, etc.) to qualify for rich results in Google."
      )
    );
  } else {
    checks.push(makeCheck("schema", "pass", 4, `${jsonLd.length} JSON-LD script block(s) detected.`));
  }

  if (!viewport || !/width=device-width/i.test(viewport)) {
    checks.push(
      makeCheck(
        "viewport",
        "fail",
        8,
        "Mobile viewport meta tag is missing or invalid.",
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">. Without it Google treats the page as non-mobile-friendly.'
      )
    );
  } else {
    checks.push(makeCheck("viewport", "pass", 8, "Mobile viewport is configured correctly."));
  }

  if (!https) {
    checks.push(
      makeCheck(
        "https",
        "fail",
        8,
        "Site is served over HTTP, not HTTPS.",
        "Install an SSL certificate and redirect all HTTP traffic to HTTPS. Google uses HTTPS as a ranking signal and browsers flag HTTP pages as 'Not Secure'."
      )
    );
  } else {
    checks.push(makeCheck("https", "pass", 8, "Site is served over HTTPS."));
  }

  if (!lang) {
    checks.push(
      makeCheck(
        "lang",
        "warn",
        3,
        "The <html> tag has no lang attribute.",
        'Add lang="en" (or the page\'s language) to the <html> tag. It helps search engines serve the correct language version and aids screen readers.'
      )
    );
  } else {
    checks.push(makeCheck("lang", "pass", 3, `HTML language declared as "${lang}".`));
  }

  if (wordCount < 300) {
    checks.push(
      makeCheck(
        "wordCount",
        "warn",
        5,
        `Only ~${wordCount} words of text content — thin content.`,
        "Thin pages (<300 words) struggle to rank. Expand with genuinely useful content covering the topic in depth."
      )
    );
  } else {
    checks.push(makeCheck("wordCount", "pass", 5, `~${wordCount} words of text content — solid depth.`));
  }

  if (internalLinks.length === 0) {
    checks.push(
      makeCheck(
        "links",
        "warn",
        4,
        "No internal links found on the page.",
        "Add contextual internal links to related pages. Internal linking distributes PageRank and helps search engines discover your content."
      )
    );
  } else {
    checks.push(
      makeCheck("links", "pass", 4, `${internalLinks.length} internal and ${externalLinks.length} external links found.`)
    );
  }

  checks.push(faviconCheck);
  checks.push(sitemapCheck);

  if (brokenLinkSample.broken > 0) {
    checks.push(
      makeCheck(
        "brokenLinks",
        "fail",
        6,
        `${brokenLinkSample.broken} of ${brokenLinkSample.tested} sampled internal links are broken.`,
        "Find and fix broken internal links (404s, 5xx, timeouts). Broken links waste crawl budget and hurt user experience."
      )
    );
  } else if (brokenLinkSample.tested > 0) {
    checks.push(
      makeCheck("brokenLinks", "pass", 6, `All ${brokenLinkSample.tested} sampled internal links return 200 OK.`)
    );
  } else {
    checks.push(makeCheck("brokenLinks", "info", 6, "No internal links available to sample."));
  }

  if (urlSlug.length > 75) {
    checks.push(
      makeCheck(
        "urlSlug",
        "warn",
        2,
        `URL path is long (${urlSlug.length} characters).`,
        "Shorten the URL to under 75 characters with descriptive, keyword-rich words. Shorter URLs tend to perform better and are easier to share."
      )
    );
  } else {
    checks.push(makeCheck("urlSlug", "pass", 2, "URL is short and descriptive."));
  }

  if (hasUrlParams) {
    checks.push(
      makeCheck(
        "urlParams",
        "info",
        2,
        "URL contains query parameters.",
        "Avoid passing essential page identity through query strings. Use clean path-based URLs and rel=canonical to consolidate parameter variants."
      )
    );
  }

  if (outcome.responseTimeMs > 2000) {
    checks.push(
      makeCheck(
        "ttfb",
        "warn",
        5,
        `Server response time is ${outcome.responseTimeMs}ms (slow).`,
        "Aim for TTFB under 600ms. Optimize server-side rendering, use a CDN, enable caching and compress assets."
      )
    );
  } else {
    checks.push(makeCheck("ttfb", "pass", 5, `Server response time is ${outcome.responseTimeMs}ms — fast.`));
  }

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const lostWeight = checks
    .filter((c) => c.status !== "pass" && c.status !== "info")
    .reduce((sum, c) => sum + (c.status === "fail" ? c.weight : c.weight / 2), 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - (lostWeight / totalWeight) * 100)));

  return {
    url: base.href,
    finalUrl: base.href,
    fetchedAt: new Date().toISOString(),
    score,
    checks,
    stats: {
      title,
      metaDescription,
      wordCount,
      internalLinks: internalLinks.length,
      externalLinks: externalLinks.length,
      responseTimeMs: outcome.responseTimeMs,
    },
  };
}

async function checkSitemap(base: URL): Promise<AuditCheck> {
  try {
    const res = await fetch(`${base.origin}/sitemap.xml`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      return makeCheck("sitemap", "pass", 4, "sitemap.xml is reachable.");
    }
    return makeCheck(
      "sitemap",
      "warn",
      4,
      "No sitemap.xml found at the root.",
      "Create a sitemap.xml listing your important pages and submit it in Google Search Console so Google can discover and crawl all your content."
    );
  } catch {
    return makeCheck(
      "sitemap",
      "warn",
      4,
      "sitemap.xml could not be verified.",
      "Create a sitemap.xml listing your important pages and submit it in Google Search Console."
    );
  }
}

async function checkFavicon(base: URL, faviconHref: string | null): Promise<AuditCheck> {
  if (faviconHref) {
    return makeCheck("favicon", "pass", 1, "Favicon is declared.");
  }
  try {
    const res = await fetch(`${base.origin}/favicon.ico`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      return makeCheck("favicon", "info", 1, "Default /favicon.ico is served.");
    }
  } catch {
    /* fallthrough */
  }
  return makeCheck(
    "favicon",
    "info",
    1,
    "No favicon found.",
    "Add a favicon (180×180 PNG for Apple Touch + 32×32 ICO). It appears in browser tabs and mobile search results."
  );
}

async function sampleInternalLinks(
  base: URL,
  links: string[]
): Promise<{ broken: number; tested: number }> {
  if (links.length === 0) return { broken: 0, tested: 0 };
  const results = await Promise.allSettled(
    links.map((href) =>
      fetch(href, {
        method: "HEAD",
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8_000),
        redirect: "follow",
      })
    )
  );
  const broken = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.status >= 400)
  ).length;
  return { broken, tested: links.length };
}
