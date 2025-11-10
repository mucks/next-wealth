import { defineConfig } from 'drizzle-kit';

// Note: dotenv is loaded by the npm script (e.g., dotenv -e test.env)
// Support both Vercel's POSTGRES_URL and custom DATABASE_URL
// POSTGRES_PRISMA_URL is preferred as it includes pgbouncer=true
const databaseUrl = process.env.POSTGRES_PRISMA_URL || 
                    process.env.POSTGRES_URL || 
                    process.env.DATABASE_URL || 
                    '';

if (!databaseUrl) {
    throw new Error('No database URL found. Make sure POSTGRES_URL, POSTGRES_PRISMA_URL, or DATABASE_URL is set.');
}

export default defineConfig({
    out: './drizzle',
    schema: './lib/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: databaseUrl,
    },
});

