import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Support both Vercel's POSTGRES_URL and custom DATABASE_URL
// POSTGRES_PRISMA_URL is preferred as it includes pgbouncer=true
const databaseUrl = process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    '';

// Disable prefetch as it's not supported for "Transaction" pool mode
// SSL is required for Supabase connections
const client = postgres(databaseUrl, {
    prepare: false,
    ssl: 'require',
});
export const db = drizzle(client, { schema });

