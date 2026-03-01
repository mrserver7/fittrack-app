import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import ProfileForm from "@/components/settings/profile-form";
import AccountForm from "@/components/settings/account-form";

export default async function ClientSettingsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  if (!session) redirect("/login");

  const clientId = session.user!.id!;
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) redirect("/login");

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.settings.title}</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-5">{t.settings.profile}</h2>
          <ProfileForm currentName={client.name} currentPhotoUrl={client.photoUrl} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-5">{t.settings.account}</h2>
          <AccountForm currentEmail={client.email} />
        </div>
      </div>
    </div>
  );
}
