import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/omnigate?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const apiKey = await prisma.apiKey.upsert({
    where: { key: 'test-key-123' },
    update: {},
    create: {
      key: 'test-key-123',
      teamName: 'demo-team',
      isActive: true,
    },
  });
  
  console.log('Seeded API Key:', apiKey);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
