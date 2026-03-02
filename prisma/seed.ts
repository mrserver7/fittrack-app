import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.trainer.upsert({
    where: { email: "admin@trainerhub.com" },
    update: { isAdmin: true },
    create: {
      email: "admin@trainerhub.com",
      name: "Admin",
      passwordHash: adminHash,
      businessName: "FitTrack",
      isAdmin: true,
    },
  });
  console.log("✓ Admin:", admin.email);

  const exerciseData = [
    // ── SQUAT ──────────────────────────────────────────────────────────
    { name: "Barbell Back Squat",       category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings",              equipment: "Barbell, Rack",                  bodyRegions: "knee,lower_back", defaultSets: 4, defaultReps: 5  },
    { name: "Front Squat",              category: "squat", primaryMuscles: "Quads, Glutes, Upper Back",              equipment: "Barbell, Rack",                  bodyRegions: "knee,lower_back", defaultSets: 4, defaultReps: 5  },
    { name: "Goblet Squat",             category: "squat", primaryMuscles: "Quads, Glutes",                          equipment: "Dumbbell, Kettlebell",            bodyRegions: "knee",            defaultSets: 3, defaultReps: 12 },
    { name: "Hack Squat",               category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings",              equipment: "Hack squat machine or Barbell",   bodyRegions: "knee",            defaultSets: 4, defaultReps: 10 },
    { name: "Sumo Squat",               category: "squat", primaryMuscles: "Glutes, Adductors, Quads",               equipment: "Barbell or Dumbbell",             bodyRegions: "knee",            defaultSets: 3, defaultReps: 12 },
    { name: "Bulgarian Split Squat",    category: "squat", primaryMuscles: "Quads, Glutes",                          equipment: "Dumbbells, Bench",                bodyRegions: "knee",            defaultSets: 3, defaultReps: 10 },
    { name: "Dumbbell Lunges",          category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings",              equipment: "Dumbbells",                      bodyRegions: "knee",            defaultSets: 3, defaultReps: 10 },
    { name: "Walking Lunges",           category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings",              equipment: "Dumbbells or Bodyweight",         bodyRegions: "knee",            defaultSets: 3, defaultReps: 12 },
    { name: "Reverse Lunge",            category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings",              equipment: "Dumbbells or Bodyweight",         bodyRegions: "knee",            defaultSets: 3, defaultReps: 10 },
    { name: "Step-up",                  category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings",              equipment: "Dumbbells, Box or Bench",         bodyRegions: "knee",            defaultSets: 3, defaultReps: 10 },
    { name: "Leg Press",                category: "squat", primaryMuscles: "Quads, Glutes, Hamstrings",              equipment: "Leg press machine",              bodyRegions: "knee",            defaultSets: 4, defaultReps: 10 },
    { name: "Leg Extension",            category: "squat", primaryMuscles: "Quadriceps",                             equipment: "Leg extension machine",          bodyRegions: "knee",            defaultSets: 3, defaultReps: 12 },
    { name: "Calf Raise",               category: "push",  primaryMuscles: "Gastrocnemius, Soleus",                  equipment: "Machine or Bodyweight",          bodyRegions: "knee",            defaultSets: 4, defaultReps: 15 },
    // ── HINGE ──────────────────────────────────────────────────────────
    { name: "Conventional Deadlift",    category: "hinge", primaryMuscles: "Hamstrings, Glutes, Lower Back",         equipment: "Barbell",                        bodyRegions: "lower_back",      defaultSets: 4, defaultReps: 5  },
    { name: "Sumo Deadlift",            category: "hinge", primaryMuscles: "Glutes, Adductors, Hamstrings",          equipment: "Barbell",                        bodyRegions: "lower_back",      defaultSets: 4, defaultReps: 5  },
    { name: "Romanian Deadlift",        category: "hinge", primaryMuscles: "Hamstrings, Glutes",                     equipment: "Barbell",                        bodyRegions: "lower_back,knee", defaultSets: 3, defaultReps: 10 },
    { name: "Trap Bar Deadlift",        category: "hinge", primaryMuscles: "Quads, Glutes, Hamstrings, Lower Back",  equipment: "Trap bar",                       bodyRegions: "lower_back,knee", defaultSets: 4, defaultReps: 5  },
    { name: "Single-leg Romanian Deadlift", category: "hinge", primaryMuscles: "Hamstrings, Glutes",                equipment: "Dumbbell or Kettlebell",          bodyRegions: "lower_back,knee", defaultSets: 3, defaultReps: 10 },
    { name: "Good Morning",             category: "hinge", primaryMuscles: "Hamstrings, Glutes, Lower Back",         equipment: "Barbell",                        bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 10 },
    { name: "Hip Thrust",               category: "hinge", primaryMuscles: "Glutes, Hamstrings",                     equipment: "Barbell, Bench",                  bodyRegions: "lower_back",      defaultSets: 4, defaultReps: 10 },
    { name: "Glute Bridge",             category: "hinge", primaryMuscles: "Glutes, Hamstrings",                     equipment: "Bodyweight or Barbell",          bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 15 },
    { name: "Hip Hinge with Band",      category: "hinge", primaryMuscles: "Glutes, Hamstrings",                     equipment: "Resistance band",                bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 15 },
    { name: "Kettlebell Swing",         category: "hinge", primaryMuscles: "Glutes, Hamstrings, Core",               equipment: "Kettlebell",                     bodyRegions: "lower_back",      defaultSets: 4, defaultReps: 15 },
    { name: "Cable Pull-through",       category: "hinge", primaryMuscles: "Glutes, Hamstrings",                     equipment: "Cable machine",                  bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 15 },
    { name: "Leg Curl",                 category: "hinge", primaryMuscles: "Hamstrings",                             equipment: "Leg curl machine",               bodyRegions: "knee",            defaultSets: 3, defaultReps: 12 },
    { name: "Nordic Curl",              category: "hinge", primaryMuscles: "Hamstrings",                             equipment: "Bodyweight, Anchor point",        bodyRegions: "knee",            defaultSets: 3, defaultReps: 6  },
    // ── PUSH ───────────────────────────────────────────────────────────
    { name: "Barbell Bench Press",      category: "push",  primaryMuscles: "Pectorals, Triceps, Anterior Deltoid",   equipment: "Barbell, Bench",                  bodyRegions: "shoulder",        defaultSets: 4, defaultReps: 8  },
    { name: "Incline Dumbbell Press",   category: "push",  primaryMuscles: "Upper Chest, Anterior Deltoid",          equipment: "Dumbbells, Bench",                bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 10 },
    { name: "Overhead Press",           category: "push",  primaryMuscles: "Deltoids, Triceps, Upper Chest",         equipment: "Barbell",                        bodyRegions: "shoulder",        defaultSets: 4, defaultReps: 6  },
    { name: "Dumbbell Shoulder Press",  category: "push",  primaryMuscles: "Deltoids, Triceps",                      equipment: "Dumbbells",                      bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 10 },
    { name: "Arnold Press",             category: "push",  primaryMuscles: "Deltoids, Triceps",                      equipment: "Dumbbells",                      bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 10 },
    { name: "Push-up",                  category: "push",  primaryMuscles: "Pectorals, Triceps, Anterior Deltoid",   equipment: "Bodyweight",                     bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 15 },
    { name: "Dip",                      category: "push",  primaryMuscles: "Triceps, Pectorals, Anterior Deltoid",   equipment: "Parallel bars",                  bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 10 },
    { name: "Close-grip Bench Press",   category: "push",  primaryMuscles: "Triceps, Pectorals",                     equipment: "Barbell, Bench",                  bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 10 },
    { name: "Lateral Raise",            category: "push",  primaryMuscles: "Medial Deltoid",                         equipment: "Dumbbells or Cables",            bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 15 },
    { name: "Cable Fly",                category: "push",  primaryMuscles: "Pectorals, Anterior Deltoid",            equipment: "Cable machine",                  bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 12 },
    { name: "Skull Crusher",            category: "push",  primaryMuscles: "Triceps",                                equipment: "Barbell or EZ-bar, Bench",        bodyRegions: null,              defaultSets: 3, defaultReps: 12 },
    { name: "Tricep Pushdown",          category: "push",  primaryMuscles: "Triceps",                                equipment: "Cable machine",                  bodyRegions: null,              defaultSets: 3, defaultReps: 12 },
    { name: "Tricep Overhead Extension", category: "push", primaryMuscles: "Triceps",                                equipment: "Dumbbell or Cable",              bodyRegions: null,              defaultSets: 3, defaultReps: 12 },
    // ── PULL ───────────────────────────────────────────────────────────
    { name: "Pull-up",                  category: "pull",  primaryMuscles: "Lats, Biceps, Rhomboids",                equipment: "Pull-up bar",                    bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 8  },
    { name: "Chin-up",                  category: "pull",  primaryMuscles: "Lats, Biceps, Rhomboids",                equipment: "Pull-up bar",                    bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 8  },
    { name: "Lat Pulldown",             category: "pull",  primaryMuscles: "Lats, Biceps, Rhomboids",                equipment: "Cable machine",                  bodyRegions: "shoulder",        defaultSets: 4, defaultReps: 10 },
    { name: "Bent-over Row",            category: "pull",  primaryMuscles: "Rhomboids, Lats, Biceps",                equipment: "Barbell",                        bodyRegions: "lower_back",      defaultSets: 4, defaultReps: 8  },
    { name: "T-Bar Row",                category: "pull",  primaryMuscles: "Lats, Rhomboids, Biceps, Lower Back",    equipment: "T-bar or Landmine",              bodyRegions: "lower_back",      defaultSets: 4, defaultReps: 8  },
    { name: "Dumbbell Row",             category: "pull",  primaryMuscles: "Lats, Rhomboids, Biceps",                equipment: "Dumbbell, Bench",                bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 10 },
    { name: "Cable Row",                category: "pull",  primaryMuscles: "Rhomboids, Lats, Biceps",                equipment: "Cable machine",                  bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 12 },
    { name: "Seated Cable Row",         category: "pull",  primaryMuscles: "Rhomboids, Lats, Biceps, Rear Deltoid",  equipment: "Cable machine",                  bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 12 },
    { name: "Face Pull",                category: "pull",  primaryMuscles: "Rear Deltoid, Rotator Cuff",             equipment: "Cable machine",                  bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 15 },
    { name: "Reverse Fly",              category: "pull",  primaryMuscles: "Rear Deltoid, Rhomboids, Traps",         equipment: "Dumbbells or Cables",            bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 15 },
    { name: "Bicep Curl",               category: "pull",  primaryMuscles: "Biceps, Brachialis",                     equipment: "Dumbbells or Barbell",           bodyRegions: null,              defaultSets: 3, defaultReps: 12 },
    { name: "Hammer Curl",              category: "pull",  primaryMuscles: "Brachialis, Biceps, Brachioradialis",    equipment: "Dumbbells",                      bodyRegions: null,              defaultSets: 3, defaultReps: 12 },
    { name: "Preacher Curl",            category: "pull",  primaryMuscles: "Biceps, Brachialis",                     equipment: "Barbell or Dumbbells, Preacher bench", bodyRegions: null,        defaultSets: 3, defaultReps: 10 },
    { name: "Barbell Shrug",            category: "pull",  primaryMuscles: "Traps, Levator Scapulae",                equipment: "Barbell or Dumbbells",           bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 12 },
    { name: "Upright Row",              category: "pull",  primaryMuscles: "Traps, Medial Deltoid, Biceps",          equipment: "Barbell or Cables",              bodyRegions: "shoulder",        defaultSets: 3, defaultReps: 12 },
    // ── CORE ───────────────────────────────────────────────────────────
    { name: "Plank",                    category: "core",  primaryMuscles: "Core, Transverse Abdominis",             equipment: "Bodyweight",                     bodyRegions: "lower_back",      defaultSets: 3, defaultReps: null },
    { name: "Side Plank",               category: "core",  primaryMuscles: "Obliques, Core, Glutes",                 equipment: "Bodyweight",                     bodyRegions: "lower_back",      defaultSets: 3, defaultReps: null },
    { name: "Hollow Body Hold",         category: "core",  primaryMuscles: "Core, Hip Flexors",                      equipment: "Bodyweight",                     bodyRegions: "lower_back",      defaultSets: 3, defaultReps: null },
    { name: "Dead Bug",                 category: "core",  primaryMuscles: "Transverse Abdominis, Core",             equipment: "Bodyweight",                     bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 10 },
    { name: "Bird Dog",                 category: "core",  primaryMuscles: "Core, Glutes, Lower Back",               equipment: "Bodyweight",                     bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 10 },
    { name: "Hanging Leg Raise",        category: "core",  primaryMuscles: "Hip Flexors, Abs, Core",                 equipment: "Pull-up bar",                    bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 12 },
    { name: "Ab Wheel Rollout",         category: "core",  primaryMuscles: "Core, Lats, Shoulders",                  equipment: "Ab wheel",                       bodyRegions: "lower_back",      defaultSets: 3, defaultReps: 10 },
    { name: "Cable Crunch",             category: "core",  primaryMuscles: "Rectus Abdominis",                       equipment: "Cable machine",                  bodyRegions: null,              defaultSets: 3, defaultReps: 15 },
    { name: "Russian Twist",            category: "core",  primaryMuscles: "Obliques, Transverse Abdominis",         equipment: "Bodyweight or Weight plate",     bodyRegions: null,              defaultSets: 3, defaultReps: 20 },
    { name: "V-Up",                     category: "core",  primaryMuscles: "Abs, Hip Flexors",                       equipment: "Bodyweight",                     bodyRegions: null,              defaultSets: 3, defaultReps: 15 },
    { name: "Bicycle Crunch",           category: "core",  primaryMuscles: "Obliques, Rectus Abdominis",             equipment: "Bodyweight",                     bodyRegions: null,              defaultSets: 3, defaultReps: 20 },
    // ── CARRY ──────────────────────────────────────────────────────────
    { name: "Farmers Carry",            category: "carry", primaryMuscles: "Core, Traps, Forearms",                  equipment: "Dumbbells, Kettlebells",          bodyRegions: "shoulder,lower_back", defaultSets: 3, defaultReps: null },
    { name: "Suitcase Carry",           category: "carry", primaryMuscles: "Core, Obliques, Traps",                  equipment: "Dumbbell or Kettlebell",          bodyRegions: "shoulder,lower_back", defaultSets: 3, defaultReps: null },
    { name: "Overhead Carry",           category: "carry", primaryMuscles: "Shoulders, Core, Traps",                 equipment: "Dumbbell or Kettlebell",          bodyRegions: "shoulder",        defaultSets: 3, defaultReps: null },
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
  console.log(`✓ ${exerciseData.length} exercises seeded`);

  console.log("\n✅ Seed complete!");
  console.log("   Admin:  admin@trainerhub.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
