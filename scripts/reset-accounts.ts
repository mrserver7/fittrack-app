/**
 * Reset script: deletes all trainer + subscriber accounts EXCEPT admin.
 * Clients are hard-deleted (not soft-deleted) so they can re-register.
 * Trainers (non-admin) are hard-deleted so they can re-register.
 * All associated data is deleted in dependency order.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🔍 Finding admin account...");
  const admin = await prisma.trainer.findFirst({ where: { isAdmin: true } });
  if (!admin) {
    console.error("❌ No admin found — aborting to be safe.");
    process.exit(1);
  }
  console.log(`✅ Admin found: ${admin.email} (${admin.id}) — will be preserved.\n`);

  // ── Step 1: Delete all client-related data ─────────────────────────────────
  console.log("🗑  Deleting client data...");

  await prisma.workoutScheduleOverride.deleteMany({});
  console.log("   workoutScheduleOverrides cleared");

  await prisma.socialReaction.deleteMany({});
  console.log("   socialReactions cleared");

  await prisma.socialPost.deleteMany({});
  console.log("   socialPosts cleared");

  await prisma.workoutStreak.deleteMany({});
  console.log("   workoutStreaks cleared");

  await prisma.goalMilestone.deleteMany({});
  console.log("   goalMilestones cleared");

  await prisma.personalRecord.deleteMany({});
  console.log("   personalRecords cleared");

  await prisma.habitLog.deleteMany({});
  console.log("   habitLogs cleared");

  await prisma.habit.deleteMany({});
  console.log("   habits cleared");

  await prisma.nutritionLog.deleteMany({});
  console.log("   nutritionLogs cleared");

  await prisma.progressPhoto.deleteMany({});
  console.log("   progressPhotos cleared");

  await prisma.measurement.deleteMany({});
  console.log("   measurements cleared");

  await prisma.painFlag.deleteMany({});
  console.log("   painFlags cleared");

  await prisma.setLog.deleteMany({});
  console.log("   setLogs cleared");

  await prisma.sessionLog.deleteMany({});
  console.log("   sessionLogs cleared");

  await prisma.clientProgram.deleteMany({});
  console.log("   clientPrograms cleared");

  await prisma.checkIn.deleteMany({});
  console.log("   checkIns cleared");

  await prisma.message.deleteMany({});
  console.log("   messages cleared");

  await prisma.notification.deleteMany({});
  console.log("   notifications cleared");

  await prisma.loginAttempt.deleteMany({});
  console.log("   loginAttempts cleared");

  await prisma.auditEvent.deleteMany({});
  console.log("   auditEvents cleared");

  // Hard-delete all clients (they can re-register freely)
  const clientCount = await prisma.client.count();
  await prisma.client.deleteMany({});
  console.log(`   ✅ ${clientCount} clients hard-deleted\n`);

  // ── Step 2: Delete trainer-owned data (keep admin's) ──────────────────────
  console.log("🗑  Deleting trainer data (non-admin)...");

  const nonAdminTrainerIds = (
    await prisma.trainer.findMany({
      where: { isAdmin: false },
      select: { id: true },
    })
  ).map((t) => t.id);

  console.log(`   Found ${nonAdminTrainerIds.length} non-admin trainer(s) to delete`);

  if (nonAdminTrainerIds.length > 0) {
    // Delete programs first (cascades: ProgramWeek → WorkoutDay → WorkoutExercise, ExerciseGroup)
    await prisma.program.deleteMany({ where: { trainerId: { in: nonAdminTrainerIds } } });
    console.log("   programs cleared (cascade: weeks → days → exercises)");

    // Now delete exercises (WorkoutExercise refs are gone after program cascade)
    await prisma.exercise.deleteMany({ where: { trainerId: { in: nonAdminTrainerIds } } });
    console.log("   exercises (trainer-owned) cleared");

    // Delete check-in forms
    await prisma.checkInForm.deleteMany({ where: { trainerId: { in: nonAdminTrainerIds } } });
    console.log("   checkInForms cleared");

    // Delete challenges
    await prisma.challenge.deleteMany({ where: { trainerId: { in: nonAdminTrainerIds } } });
    console.log("   challenges cleared");

    // Delete trainer notifications
    await prisma.notification.deleteMany({ where: { recipientId: { in: nonAdminTrainerIds } } });
    console.log("   trainer notifications cleared");

    // Hard-delete non-admin trainers
    await prisma.trainer.deleteMany({ where: { isAdmin: false } });
    console.log(`   ✅ ${nonAdminTrainerIds.length} non-admin trainer(s) hard-deleted\n`);
  }

  // ── Step 3: Verify admin intact ───────────────────────────────────────────
  const adminCheck = await prisma.trainer.findUnique({ where: { id: admin.id } });
  if (!adminCheck) {
    console.error("❌ Admin account was accidentally deleted! Check immediately.");
    process.exit(1);
  }

  const remainingTrainers = await prisma.trainer.count();
  const remainingClients = await prisma.client.count();

  console.log("─────────────────────────────────────────");
  console.log(`✅ Reset complete!`);
  console.log(`   Admin preserved: ${adminCheck.email}`);
  console.log(`   Remaining trainers: ${remainingTrainers} (admin only)`);
  console.log(`   Remaining clients: ${remainingClients}`);
  console.log("   All accounts can re-register freely.");
}

main()
  .catch((e) => {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
