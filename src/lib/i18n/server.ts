import { cookies } from "next/headers";
import { translations, type Locale } from "./translations";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const locale = store.get("locale")?.value;
  return (locale === "ar" ? "ar" : "en") as Locale;
}

export async function getT() {
  const locale = await getLocale();
  return translations[locale];
}
