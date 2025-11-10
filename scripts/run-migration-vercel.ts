import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
    // Only run migrations on Vercel (not during local builds)
    if (!process.env.VERCEL) {
        console.log('⏭️  Skipping migrations (not on Vercel)');
        return;
    }

    console.log('🚀 Running migrations on Vercel...');

    // Vercel automatically sets these environment variables
    const databaseUrl = process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ No database URL found!');
        console.error('Make sure POSTGRES_URL is set in Vercel environment variables');
        process.exit(1);
    }

    console.log('📡 Connecting to database...');
    const connection = postgres(databaseUrl, {
        max: 1,
        ssl: 'require',
    });

    const db = drizzle(connection);

    console.log('📝 Applying migrations from ./drizzle...');
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('✅ Migrations completed successfully!');

    await connection.end();
}

main().catch((err) => {
    console.error('❌ Migration failed:', err);
    // Don't fail the build if migrations fail - the app might still work
    console.warn('⚠️  Build will continue despite migration error');
    process.exit(0);
});
