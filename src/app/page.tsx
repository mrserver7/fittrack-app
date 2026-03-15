import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import ThemeToggle from "@/components/ui/theme-toggle";
import LanguageToggle from "@/components/ui/language-toggle";
import LogoMark from "@/components/ui/logo-mark";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    const role = (session.user as Record<string, unknown>).role as string;
    if (role === "client") redirect("/home");
    redirect("/dashboard");
  }

  const t = await getT();

  const features = [
    { icon: "👥", title: t.landing.feature1Title, desc: t.landing.feature1Desc },
    { icon: "🏋️", title: t.landing.feature2Title, desc: t.landing.feature2Desc },
    { icon: "📊", title: t.landing.feature3Title, desc: t.landing.feature3Desc },
    { icon: "💬", title: t.landing.feature4Title, desc: t.landing.feature4Desc },
    { icon: "⚡", title: t.landing.feature5Title, desc: t.landing.feature5Desc },
    { icon: "🎯", title: t.landing.feature6Title, desc: t.landing.feature6Desc },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 text-gray-900 dark:text-white transition-colors duration-300">
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <LogoMark size={32} />
          <span className="font-semibold text-lg text-gray-900 dark:text-white">FitTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors">
            {t.landing.signIn}
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white rounded-lg transition-colors">
            {t.landing.getStarted}
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
          {t.landing.hero}
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          {t.landing.heroSub}
        </p>
        <div className="flex justify-center gap-4 flex-wrap mb-20">
          <Link href="/register?tab=trainer" className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors text-base shadow-sm dark:shadow-none">
            {t.landing.trainerCta}
          </Link>
          <Link href="/register?tab=subscriber" className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors text-base border border-gray-200 dark:border-white/10">
            {t.landing.subscriberCta}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/8 border border-gray-200 dark:border-white/10 rounded-2xl p-6 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-white/10 py-6 text-center text-gray-400 dark:text-gray-500 text-sm">
        {t.landing.footer}
      </footer>
    </div>
  );
}
