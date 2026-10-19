import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "th", "hi", "id", "ar", "es", "fr", "pt", "vi"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
