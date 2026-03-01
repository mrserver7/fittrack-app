import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🗑  Deleting all data...");

  // Delete in FK-safe order
  await prisma.setLog.deleteMany({});
  await prisma.painFlag.deleteMany({});
  await prisma.sessionLog.deleteMany({});
  await prisma.workoutExercise.deleteMany({});
  await prisma.workoutDay.deleteMany({});
  await prisma.programWeek.deleteMany({});
  await prisma.clientProgram.deleteMany({});
  await prisma.checkIn.deleteMany({});
  await prisma.checkInForm.deleteMany({});
  await prisma.measurement.deleteMany({});
  await prisma.personalRecord.deleteMany({});
  await prisma.goalMilestone.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditEvent.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.program.deleteMany({});
  // Delete trainer-specific exercises only, keep globals
  await prisma.exercise.deleteMany({ where: { isGlobal: false } });
  await prisma.trainer.deleteMany({});

  console.log("✓ All data deleted");

  // Create admin
  const hash = await bcrypt.hash("FitTrack@2024", 12);
  const admin = await prisma.trainer.create({
    data: {
      email: "mrserver.ksa@gmail.com",
      name: "Mohammed",
      passwordHash: hash,
      businessName: "FitTrack",
      isAdmin: true,
    },
  });
  console.log("✓ Admin created:", admin.email);

  // Seed global exercises (upsert so they survive repeated runs)
  const exerciseData = [
    { name: "Barbell Back Squat", category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings", equipment: "Barbell, Rack", bodyRegions: "knee,lower_back", defaultSets: 4, defaultReps: 5 },
    { name: "Conventional Deadlift", category: "hinge", primaryMuscles: "Hamstrings, Glutes, Lower Back", equipment: "Barbell", bodyRegions: "lower_back", defaultSets: 4, defaultReps: 5 },
    { name: "Barbell Bench Press", category: "push", primaryMuscles: "Pectorals, Triceps, Anterior Deltoid", equipment: "Barbell, Bench", bodyRegions: "shoulder", defaultSets: 4, defaultReps: 8 },
    { name: "Romanian Deadlift", category: "hinge", primaryMuscles: "Hamstrings, Glutes", equipment: "Barbell", bodyRegions: "lower_back,knee", defaultSets: 3, defaultReps: 10 },
    { name: "Pull-up", category: "pull", primaryMuscles: "Lats, Biceps, Rhomboids", equipment: "Pull-up bar", bodyRegions: "shoulder", defaultSets: 3, defaultReps: 8 },
    { name: "Plank", category: "core", primaryMuscles: "Core, Transverse Abdominis", equipment: "Bodyweight", bodyRegions: "lower_back", defaultSets: 3, defaultReps: null },
    { name: "Overhead Press", category: "push", primaryMuscles: "Deltoids, Triceps, Upper Chest", equipment: "Barbell", bodyRegions: "shoulder", defaultSets: 4, defaultReps: 6 },
    { name: "Bent-over Row", category: "pull", primaryMuscles: "Rhomboids, Lats, Biceps", equipment: "Barbell", bodyRegions: "lower_back", defaultSets: 4, defaultReps: 8 },
    { name: "Goblet Squat", category: "squat", primaryMuscles: "Quads, Glutes", equipment: "Dumbbell, Kettlebell", bodyRegions: "knee", defaultSets: 3, defaultReps: 12 },
    { name: "Dumbbell Lunges", category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings", equipment: "Dumbbells", bodyRegions: "knee", defaultSets: 3, defaultReps: 10 },
    { name: "Cable Row", category: "pull", primaryMuscles: "Rhomboids, Lats, Biceps", equipment: "Cable machine", bodyRegions: "lower_back", defaultSets: 3, defaultReps: 12 },
    { name: "Hip Hinge with Band", category: "hinge", primaryMuscles: "Glutes, Hamstrings", equipment: "Resistance band", bodyRegions: "lower_back", defaultSets: 3, defaultReps: 15 },
    { name: "Bulgarian Split Squat", category: "squat", primaryMuscles: "Quads, Glutes", equipment: "Dumbbells, Bench", bodyRegions: "knee", defaultSets: 3, defaultReps: 10 },
    { name: "Face Pull", category: "pull", primaryMuscles: "Rear Deltoid, Rotator Cuff", equipment: "Cable machine", bodyRegions: "shoulder", defaultSets: 3, defaultReps: 15 },
    { name: "Farmers Carry", category: "carry", primaryMuscles: "Core, Traps, Forearms", equipment: "Dumbbells, Kettlebells", bodyRegions: "shoulder,lower_back", defaultSets: 3, defaultReps: null },
    { name: "Dumbbell Row", category: "pull", primaryMuscles: "Lats, Rhomboids, Biceps", equipment: "Dumbbell, Bench", bodyRegions: "lower_back", defaultSets: 3, defaultReps: 10 },
    { name: "Incline Dumbbell Press", category: "push", primaryMuscles: "Upper Chest, Anterior Deltoid", equipment: "Dumbbells, Bench", bodyRegions: "shoulder", defaultSets: 3, defaultReps: 10 },
    { name: "Hip Thrust", category: "hinge", primaryMuscles: "Glutes, Hamstrings", equipment: "Barbell, Bench", bodyRegions: "lower_back", defaultSets: 4, defaultReps: 10 },
    { name: "Tricep Pushdown", category: "push", primaryMuscles: "Triceps", equipment: "Cable machine", bodyRegions: null, defaultSets: 3, defaultReps: 12 },
    { name: "Bicep Curl", category: "pull", primaryMuscles: "Biceps, Brachialis", equipment: "Dumbbells or Barbell", bodyRegions: null, defaultSets: 3, defaultReps: 12 },
  ];

  for (const ex of exerciseData) {
    const safeId = `global_${ex.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "")}`;
    await prisma.exercise.upsert({
      where: { id: safeId },
      update: {},
      create: {
        id: safeId,
        name: ex.name,
        category: ex.category,
        primaryMuscles: ex.primaryMuscles,
        equipment: ex.equipment,
        bodyRegions: ex.bodyRegions ?? undefined,
        defaultSets: ex.defaultSets,
        defaultReps: ex.defaultReps ?? undefined,
        isGlobal: true,
      },
    });
  }
  console.log(`✓ ${exerciseData.length} global exercises ready`);

  console.log("\n✅ Reset complete!");
  console.log("   Admin: mrserver.ksa@gmail.com / FitTrack@2024");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
