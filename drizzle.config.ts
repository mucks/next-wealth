import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Support both Vercel's POSTGRES_URL and custom DATABASE_URL
// POSTGRES_PRISMA_URL is preferred as it includes pgbouncer=true
const databaseUrl = process.env.POSTGRES_PRISMA_URL || 
                    process.env.POSTGRES_URL || 
                    process.env.DATABASE_URL || 
                    '';

export default defineConfig({
    out: './drizzle',
    schema: './lib/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: databaseUrl,
    },
});

