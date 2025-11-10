import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables - use argument or default to .env.local
const envFile = process.argv[2] || '.env.local';
console.log(`Loading environment from: ${envFile}`);
dotenv.config({ path: envFile });

const databaseUrl = process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    '';

if (!databaseUrl) {
    console.error('No database URL found!');
    process.exit(1);
}

async function main() {
    if (!databaseUrl) {
        console.error('No database URL found!');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const connection = postgres(databaseUrl, {
        max: 1,
        ssl: 'require',
    });

    const db = drizzle(connection);

    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('✅ Migrations completed successfully!');

    await connection.end();
    process.exit(0);
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});

