import type { AuditResult } from "./audit";

export const isMailEnabled = Boolean(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "SEOKUB <onboarding@resend.dev>";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function send(payload: EmailPayload): Promise<boolean> {
  if (!isMailEnabled) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STATUS_COLOR: Record<string, string> = {
  fail: "#f87171",
  warn: "#fbbf24",
  pass: "#a3e635",
  info: "#a1a1aa",
};

export async function sendAuditEmail(
  to: string,
  audit: AuditResult,
  reportUrl: string,
  frequencyLabel: string
): Promise<boolean> {
  const failed = audit.checks.filter((c) => c.status === "fail");
  const warned = audit.checks.filter((c) => c.status === "warn");
  const topIssues = [...failed, ...warned].slice(0, 5);
  const scoreColor =
    audit.score >= 80 ? "#a3e635" : audit.score >= 50 ? "#fbbf24" : "#f87171";

  const issueRows = topIssues
    .map(
      (c) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:14px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${STATUS_COLOR[c.status]};margin-right:10px;"></span>
            ${escapeHtml(c.finding)}
          </td>
        </tr>`
    )
    .join("");

  const html = `
  <!doctype html>
  <html>
    <body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #27272a;">
                <span style="display:inline-block;background:#a3e635;color:#09090b;font-weight:700;border-radius:8px;padding:4px 10px;font-size:14px;">SEOKUB</span>
                <p style="margin:16px 0 4px;color:#a1a1aa;font-size:13px;">${escapeHtml(frequencyLabel)} report</p>
                <h1 style="margin:0;color:#fafafa;font-size:22px;font-weight:700;word-break:break-all;">${escapeHtml(audit.url)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="96" valign="top">
                      <div style="width:96px;height:96px;border-radius:9999px;border:8px solid ${scoreColor};display:flex;align-items:center;justify-content:center;">
                        <span style="color:#fafafa;font-size:28px;font-weight:800;">${audit.score}</span>
                      </div>
                    </td>
                    <td style="padding-left:24px;">
                      <p style="margin:0 0 12px;color:#a1a1aa;font-size:14px;">SEO health score</p>
                      <p style="margin:0;color:#fafafa;font-size:15px;">
                        ${failed.length} critical &middot; ${warned.length} warnings &middot; ${audit.checks.filter((c) => c.status === "pass").length} passed
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              topIssues.length > 0
                ? `<tr>
              <td style="padding:0 32px 8px;">
                <p style="margin:0 0 8px;color:#a1a1aa;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Top issues to fix</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${issueRows}</table>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:28px 32px;">
                <a href="${reportUrl}" style="display:block;background:#a3e635;color:#09090b;font-weight:700;text-align:center;padding:14px 20px;border-radius:10px;text-decoration:none;font-size:15px;">
                  View full report
                </a>
                <p style="margin:20px 0 0;color:#52525b;font-size:12px;text-align:center;">
                  You are receiving this because you scheduled ${escapeHtml(frequencyLabel)} audits on SEOKUB.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;

  return send({
    to,
    subject: `SEOKUB report: ${audit.url} — ${audit.score}/100`,
    html,
  });
}
