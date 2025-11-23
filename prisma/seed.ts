import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Default tags for financial management
 */
const defaultTags = [
  {
    name: "Food & Dining",
    color: "#FF6B6B",
    description: "Restaurants, groceries, and food-related expenses",
    order: 0,
  },
  {
    name: "Transportation",
    color: "#4ECDC4",
    description: "Gas, public transit, car maintenance, and travel",
    order: 1,
  },
  {
    name: "Shopping",
    color: "#9B59B6",
    description: "General shopping and retail purchases",
    order: 2,
  },
  {
    name: "Entertainment",
    color: "#E91E63",
    description: "Movies, concerts, hobbies, and leisure activities",
    order: 3,
  },
  {
    name: "Bills & Utilities",
    color: "#F39C12",
    description: "Electricity, water, internet, phone, and other bills",
    order: 4,
  },
  {
    name: "Healthcare",
    color: "#2ECC71",
    description: "Medical expenses, prescriptions, and health services",
    order: 5,
  },
  {
    name: "Income",
    color: "#27AE60",
    description: "Salary, freelance income, and other earnings",
    order: 6,
  },
  {
    name: "Savings",
    color: "#3498DB",
    description: "Savings transfers and investment contributions",
    order: 7,
  },
  {
    name: "Other",
    color: "#95A5A6",
    description: "Miscellaneous expenses that don't fit other categories",
    order: 8,
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Ensure the mock user exists
  const mockUserId = "mock-user-id";
  const mockUserEmail = "mock@example.com";

  let user = await prisma.user.findUnique({
    where: { id: mockUserId },
  });

  if (!user) {
    console.log("👤 Creating mock user...");
    user = await prisma.user.create({
      data: {
        id: mockUserId,
        email: mockUserEmail,
        name: "Mock User",
      },
    });
    console.log("✅ Mock user created");
  } else {
    console.log("✅ Mock user already exists");
  }

  // Create tags for the user
  console.log(`\n📋 Creating ${defaultTags.length} default tags...`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const tag of defaultTags) {
    try {
      await prisma.tag.create({
        data: {
          userId: user.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          order: tag.order,
        },
      });
      console.log(`  ✅ Created tag: ${tag.name}`);
      createdCount++;
    } catch (error: any) {
      // Handle unique constraint violation (tag already exists)
      if (error.code === "P2002") {
        console.log(`  ⏭️  Tag already exists: ${tag.name}`);
        skippedCount++;
      } else {
        console.error(`  ❌ Error creating tag ${tag.name}:`, error);
        throw error;
      }
    }
  }

  console.log(`\n🎉 Seed completed!`);
  console.log(`   Created: ${createdCount} tags`);
  console.log(`   Skipped: ${skippedCount} tags (already exist)`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
