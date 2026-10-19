import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-400 text-sm font-bold text-zinc-950">
            S
          </span>
          <span className="font-bold text-zinc-100">SEOKUB</span>
        </Link>
        <p className="text-sm text-zinc-500">{t("footerTag")}</p>
        <p className="text-xs text-zinc-600">
          © {year} SEOKUB. {t("footerRights")}
        </p>
      </div>
    </footer>
  );
}
