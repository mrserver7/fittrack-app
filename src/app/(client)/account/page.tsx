import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import ProfileForm from "@/components/settings/profile-form";
import AccountForm from "@/components/settings/account-form";
import DeleteAccountButton from "@/components/settings/delete-account-button";

export default async function ClientSettingsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  if (!session) redirect("/login");

  const clientId = session.user!.id!;
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) redirect("/login");

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t.settings.title}</h1>
      </div>

      <div className="space-y-6">
        <div className="section-card-padded">
          <h2 className="text-base font-semibold text-foreground mb-5">{t.settings.profile}</h2>
          <ProfileForm currentName={client.name} currentPhotoUrl={client.photoUrl} />
        </div>

        <div className="section-card-padded">
          <h2 className="text-base font-semibold text-foreground mb-5">{t.settings.account}</h2>
          <AccountForm currentEmail={client.email} />
        </div>

        {/* Danger zone */}
        <div className="section-card p-6 border-red-200 dark:border-red-800">
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
