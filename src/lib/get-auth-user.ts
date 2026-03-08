import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getMobileUser, MobileUser } from "@/lib/mobile-auth";

/**
 * Unified auth: checks Bearer JWT first (mobile), then falls back to cookie session (web).
 * Returns a normalised user object or null if unauthenticated.
 */
export async function getAuthUser(req: NextRequest): Promise<MobileUser | null> {
  // 1. Bearer JWT (mobile)
  const mobileUser = getMobileUser(req);
  if (mobileUser) return mobileUser;

  // 2. Cookie session (web)
  const session = await auth();
  if (!session?.user) return null;

  const u = session.user as Record<string, unknown>;
  return {
    id: session.user.id as string,
    email: session.user.email as string,
    name: session.user.name as string,
    role: u.role as "trainer" | "client",
    isAdmin: u.isAdmin as boolean | undefined,
    trainerId: u.trainerId as string | undefined,
    photoUrl: u.photoUrl as string | null | undefined,
  };
}
