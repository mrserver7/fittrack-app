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
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t.settings.title}</h1>
      </div>

      <div className="space-y-6">
        {/* Profile section */}
        <div className="section-card-padded">
          <h2 className="text-base font-semibold text-foreground mb-5">{t.settings.profile}</h2>
          <ProfileForm currentName={trainer.name} currentPhotoUrl={trainer.photoUrl} />
        </div>

        {/* Account section */}
        <div className="section-card-padded">
          <h2 className="text-base font-semibold text-foreground mb-5">{t.settings.account}</h2>
          <AccountForm currentEmail={trainer.email} />
        </div>

        {/* Danger zone */}
        {!trainer.isAdmin && (
          <div className="section-card p-6 border-red-200 dark:border-red-800">
            <h2 className="text-base font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
            <DeleteAccountButton />
          </div>
        )}
      </div>
    </div>
  );
}
