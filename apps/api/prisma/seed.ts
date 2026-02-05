import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const exercises = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'Chest', category: 'Compound' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest', category: 'Compound' },
  { name: 'Decline Bench Press', muscleGroup: 'Chest', category: 'Compound' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest', category: 'Compound' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', category: 'Compound' },
  { name: 'Cable Fly', muscleGroup: 'Chest', category: 'Isolation' },
  { name: 'Dumbbell Fly', muscleGroup: 'Chest', category: 'Isolation' },
  { name: 'Pec Deck', muscleGroup: 'Chest', category: 'Isolation' },
  { name: 'Push-Up', muscleGroup: 'Chest', category: 'Bodyweight' },
  { name: 'Chest Dip', muscleGroup: 'Chest', category: 'Bodyweight' },

  // Back
  { name: 'Deadlift', muscleGroup: 'Back', category: 'Compound' },
  { name: 'Sumo Deadlift', muscleGroup: 'Back', category: 'Compound' },
  { name: 'Barbell Row', muscleGroup: 'Back', category: 'Compound' },
  { name: 'Dumbbell Row', muscleGroup: 'Back', category: 'Compound' },
  { name: 'Pull-Up', muscleGroup: 'Back', category: 'Bodyweight' },
  { name: 'Chin-Up', muscleGroup: 'Back', category: 'Bodyweight' },
  { name: 'Lat Pulldown', muscleGroup: 'Back', category: 'Compound' },
  { name: 'Seated Cable Row', muscleGroup: 'Back', category: 'Compound' },
  { name: 'T-Bar Row', muscleGroup: 'Back', category: 'Compound' },
  { name: 'Face Pull', muscleGroup: 'Back', category: 'Isolation' },
  { name: 'Straight Arm Pulldown', muscleGroup: 'Back', category: 'Isolation' },
  { name: 'Hyperextension', muscleGroup: 'Back', category: 'Bodyweight' },
  { name: 'Rack Pull', muscleGroup: 'Back', category: 'Compound' },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Shoulders', category: 'Compound' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', category: 'Compound' },
  { name: 'Arnold Press', muscleGroup: 'Shoulders', category: 'Compound' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders', category: 'Isolation' },
  { name: 'Front Raise', muscleGroup: 'Shoulders', category: 'Isolation' },
  { name: 'Rear Delt Fly', muscleGroup: 'Shoulders', category: 'Isolation' },
  { name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', category: 'Isolation' },
  { name: 'Upright Row', muscleGroup: 'Shoulders', category: 'Compound' },
  { name: 'Barbell Shrug', muscleGroup: 'Shoulders', category: 'Isolation' },
  { name: 'Dumbbell Shrug', muscleGroup: 'Shoulders', category: 'Isolation' },

  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'Biceps', category: 'Isolation' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps', category: 'Isolation' },
  { name: 'Hammer Curl', muscleGroup: 'Biceps', category: 'Isolation' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps', category: 'Isolation' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', category: 'Isolation' },
  { name: 'Cable Curl', muscleGroup: 'Biceps', category: 'Isolation' },
  { name: 'Concentration Curl', muscleGroup: 'Biceps', category: 'Isolation' },
  { name: 'Spider Curl', muscleGroup: 'Biceps', category: 'Isolation' },

  // Triceps
  { name: 'Tricep Pushdown', muscleGroup: 'Triceps', category: 'Isolation' },
  { name: 'Skull Crusher', muscleGroup: 'Triceps', category: 'Isolation' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', category: 'Isolation' },
  { name: 'Close Grip Bench', muscleGroup: 'Triceps', category: 'Compound' },
  { name: 'Tricep Dip', muscleGroup: 'Triceps', category: 'Bodyweight' },
  { name: 'Tricep Kickback', muscleGroup: 'Triceps', category: 'Isolation' },
  { name: 'Diamond Push-Up', muscleGroup: 'Triceps', category: 'Bodyweight' },

  // Quads
  { name: 'Barbell Squat', muscleGroup: 'Quads', category: 'Compound' },
  { name: 'Front Squat', muscleGroup: 'Quads', category: 'Compound' },
  { name: 'Leg Press', muscleGroup: 'Quads', category: 'Compound' },
  { name: 'Hack Squat', muscleGroup: 'Quads', category: 'Compound' },
  { name: 'Leg Extension', muscleGroup: 'Quads', category: 'Isolation' },
  { name: 'Lunges', muscleGroup: 'Quads', category: 'Compound' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Quads', category: 'Compound' },
  { name: 'Goblet Squat', muscleGroup: 'Quads', category: 'Compound' },
  { name: 'Sissy Squat', muscleGroup: 'Quads', category: 'Bodyweight' },
  { name: 'Step-Up', muscleGroup: 'Quads', category: 'Compound' },

  // Hamstrings
  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', category: 'Compound' },
  { name: 'Lying Leg Curl', muscleGroup: 'Hamstrings', category: 'Isolation' },
  { name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', category: 'Isolation' },
  { name: 'Nordic Curl', muscleGroup: 'Hamstrings', category: 'Bodyweight' },
  { name: 'Good Morning', muscleGroup: 'Hamstrings', category: 'Compound' },

  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'Glutes', category: 'Compound' },
  { name: 'Glute Bridge', muscleGroup: 'Glutes', category: 'Bodyweight' },
  { name: 'Cable Glute Kickback', muscleGroup: 'Glutes', category: 'Isolation' },
  { name: 'Hip Abduction Machine', muscleGroup: 'Glutes', category: 'Isolation' },

  // Calves
  { name: 'Standing Calf Raise', muscleGroup: 'Calves', category: 'Isolation' },
  { name: 'Seated Calf Raise', muscleGroup: 'Calves', category: 'Isolation' },
  { name: 'Donkey Calf Raise', muscleGroup: 'Calves', category: 'Isolation' },

  // Abs
  { name: 'Crunch', muscleGroup: 'Abs', category: 'Bodyweight' },
  { name: 'Plank', muscleGroup: 'Abs', category: 'Bodyweight' },
  { name: 'Hanging Leg Raise', muscleGroup: 'Abs', category: 'Bodyweight' },
  { name: 'Cable Crunch', muscleGroup: 'Abs', category: 'Isolation' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Abs', category: 'Bodyweight' },
  { name: 'Russian Twist', muscleGroup: 'Abs', category: 'Bodyweight' },
  { name: 'Lying Leg Raise', muscleGroup: 'Abs', category: 'Bodyweight' },
  { name: 'Mountain Climber', muscleGroup: 'Abs', category: 'Bodyweight' },
  { name: 'Cable Woodchop', muscleGroup: 'Abs', category: 'Isolation' },

  // Forearms
  { name: 'Wrist Curl', muscleGroup: 'Forearms', category: 'Isolation' },
  { name: 'Reverse Wrist Curl', muscleGroup: 'Forearms', category: 'Isolation' },
  { name: "Farmer's Walk", muscleGroup: 'Forearms', category: 'Compound' },
];

async function main() {
  console.log('Seeding database...');

  // Create or update default user
  const user = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: { name: 'Hudson' },
    create: {
      id: 'default-user',
      name: 'Hudson',
    },
  });

  console.log(`Created/updated user: ${user.name}`);

  // Create or update default user settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      defaultRestTimerSec: 90,
      keepScreenAwake: true,
      rpeTrackingEnabled: false,
      availablePlates: '[45,35,25,10,5,2.5]',
      barWeight: 45,
    },
  });

  console.log('Created/updated user settings');

  // Upsert all exercises
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: {
        name_muscleGroup: {
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
        },
      },
      update: {
        category: exercise.category,
      },
      create: {
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        isCustom: false,
      },
    });
  }

  console.log(`Seeded ${exercises.length} exercises`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
