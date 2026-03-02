import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import ProfileForm from "@/components/settings/profile-form";
import AccountForm from "@/components/settings/account-form";
import DeleteAccountButton from "@/components/settings/delete-account-button";

export default async function TrainerSettingsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  if (!session) redirect("/login");

  const trainerId = session.user!.id!;
  const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
  if (!trainer) redirect("/login");

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.settings.title}</h1>
      </div>

      <div className="space-y-6">
        {/* Profile section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-5">{t.settings.profile}</h2>
          <ProfileForm currentName={trainer.name} currentPhotoUrl={trainer.photoUrl} />
        </div>

        {/* Account section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-5">{t.settings.account}</h2>
          <AccountForm currentEmail={trainer.email} />
        </div>

        {/* Danger zone */}
        {!trainer.isAdmin && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-base font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Permanently delete your account and all associated data.</p>
            <DeleteAccountButton />
          </div>
        )}
      </div>
    </div>
  );
}
