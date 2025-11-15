import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function truncateDatabase() {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename <> 'sql_features'
      AND tablename <> 'sql_implementation_info'
      AND tablename <> 'sql_parts'
      AND tablename <> '_prisma_migrations';
  `;

  const tableNames = tables
    .map(({ tablename }) => tablename?.trim())
    .filter((name): name is string => Boolean(name));

  if (tableNames.length === 0) {
    console.log('No application tables found to truncate.');
    return;
  }

  const quoted = tableNames.map((name) => `"${name}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
  console.log(`Truncated tables: ${tableNames.join(', ')}`);
}

async function main() {
  await truncateDatabase();
}

main()
  .catch((error) => {
    console.error('Failed to reset database', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
