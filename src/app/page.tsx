import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    const role = (session.user as Record<string, unknown>).role as string;
    if (role === "client") redirect("/home");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 text-white">
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="FitTrack" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-semibold text-lg">FitTrack</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 md:px-10 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          The smart hub for<br />
          <span className="text-emerald-400">personal trainers</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Manage clients, assign personalized workouts, collect feedback, and track progress —
          all in one beautifully simple platform.
        </p>
        <div className="flex justify-center gap-4 flex-wrap mb-20">
          <Link href="/register?tab=trainer" className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors text-base">
            I&apos;m a Trainer →
          </Link>
          <Link href="/register?tab=subscriber" className="px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-colors text-base border border-white/10">
            I&apos;m a Subscriber
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {[
            { icon: "👥", title: "Client Management", desc: "Manage subscribers, track goals, injuries, schedule, and status from one clean dashboard." },
            { icon: "🏋️", title: "Smart Programming", desc: "Build reusable programs with sets, reps, RPE targets, tempo notation, and coaching notes." },
            { icon: "📊", title: "Progress Analytics", desc: "Auto-track PRs, adherence streaks, measurements, and readiness scores in real time." },
            { icon: "💬", title: "Built-in Messaging", desc: "Per-workout feedback, weekly check-ins, and in-app messaging — no WhatsApp needed." },
            { icon: "⚡", title: "Readiness Score", desc: "Subscribers report sleep, soreness, and motivation before each session — you see it all." },
            { icon: "🎯", title: "Injury-Aware", desc: "Pain flags trigger smart substitution suggestions. Stay safe, stay on program." },
          ].map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        © 2026 FitTrack · Built for real trainers.
      </footer>
    </div>
  );
}
