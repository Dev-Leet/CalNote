// packages/database/prisma/seed.ts
// Seed script to populate the database with sample data for development

import { PrismaClient, Platform } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.note.deleteMany();
  await prisma.syncedContest.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.user.deleteMany();

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      timezone: 'Asia/Kolkata',
      enabledPlatforms: {
        LEETCODE: true,
        CODEFORCES: true,
        CODECHEF: true,
      },
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create sample contests
  const now = new Date();
  const contests = await prisma.contest.createMany({
    data: [
      {
        name: 'LeetCode Weekly Contest 400',
        platform: Platform.LEETCODE,
        url: 'https://leetcode.com/contest/weekly-contest-400',
        startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        duration: 90,
        status: 'BEFORE',
      },
      {
        name: 'Codeforces Round 950 (Div. 2)',
        platform: Platform.CODEFORCES,
        url: 'https://codeforces.com/contest/950',
        externalId: '950',
        difficulty: 'Div. 2',
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        duration: 120,
        status: 'BEFORE',
      },
      {
        name: 'CodeChef Starters 130',
        platform: Platform.CODECHEF,
        url: 'https://www.codechef.com/START130',
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        duration: 180,
        status: 'BEFORE',
      },
      {
        name: 'LeetCode Biweekly Contest 130',
        platform: Platform.LEETCODE,
        url: 'https://leetcode.com/contest/biweekly-contest-130',
        startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        duration: 90,
        status: 'BEFORE',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created ${contests.count} contests`);

  // Create sample notes
  const allContests = await prisma.contest.findMany({ take: 2 });

  if (allContests.length > 0) {
    await prisma.note.create({
      data: {
        userId: user.id,
        contestId: allContests[0].id,
        title: `Prep Notes: ${allContests[0].name}`,
        content: `# ${allContests[0].name} Prep Notes\n\n## Topics to Review\n- Dynamic Programming\n- Binary Search\n- Graph Traversal (BFS/DFS)\n\n## Strategy\n1. Read all problems first\n2. Start from easiest\n3. Time-box each problem: 30 minutes\n\n## Resources\n- [LeetCode Discuss](https://leetcode.com/discuss)\n- [CP Algorithms](https://cp-algorithms.com)`,
        tags: ['dp', 'graphs', 'strategy'],
        isAiGenerated: false,
      },
    });

    await prisma.note.create({
      data: {
        userId: user.id,
        contestId: allContests[1]?.id,
        title: `AI Notes: ${allContests[1]?.name}`,
        content: `# ${allContests[1]?.name} - AI Generated Notes\n\n## Contest Overview\nThis is a Codeforces Div. 2 contest.\n\n## Preparation Checklist\n- [ ] Review number theory basics\n- [ ] Practice greedy problems\n- [ ] Review segment trees\n\n## Contest Strategy\n- Problem A & B: Aim for first 15 minutes\n- Problem C: 30 minutes budget\n- Problem D+: Attempt if time allows`,
        tags: ['codeforces', 'div2', 'ai-generated'],
        isAiGenerated: true,
        aiModel: 'gpt-4-turbo-preview',
      },
    });
  }

  console.log('✅ Created sample notes');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
