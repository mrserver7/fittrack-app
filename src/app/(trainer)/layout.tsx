import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>)?.role !== "trainer") {
    redirect("/login");
  }
  const isAdmin = (session.user as Record<string, unknown>)?.isAdmin as boolean;
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar role="trainer" isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
