import { pgTable, text, decimal, timestamp, uuid, index, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const assetTypeEnum = pgEnum('asset_type', ['crypto', 'stock', 'real-estate', 'cash']);
export const propertyTypeEnum = pgEnum('property_type', ['house', 'apartment', 'commercial', 'land', 'other']);

// Assets table
export const assets = pgTable('assets', {
    id: text('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    type: assetTypeEnum('type').notNull(),
    purchaseDate: text('purchase_date').notNull(), // Using text for date to match your existing types
    notes: text('notes'),

    // Crypto fields
    coinId: text('coin_id'),
    symbol: text('symbol'),
    quantity: decimal('quantity'),
    currentPrice: decimal('current_price'),
    priceChange24h: decimal('price_change_24h'),

    // Real estate fields
    address: text('address'),
    city: text('city'),
    squareMeters: decimal('square_meters'),
    pricePerSqm: decimal('price_per_sqm'),
    propertyType: propertyTypeEnum('property_type'),

    // Cash fields
    amount: decimal('amount'),
    currency: text('currency'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index('assets_user_id_idx').on(table.userId),
    typeIdx: index('assets_type_idx').on(table.type),
}));

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

// Price cache table - shared across all users to reduce API calls
export const priceCache = pgTable('price_cache', {
    id: text('id').primaryKey(), // For crypto: coinId, for stocks: symbol, for real-estate: city-propertyType
    type: text('type').notNull(), // 'crypto', 'stock', or 'real-estate'
    price: decimal('price').notNull(),
    priceChange24h: decimal('price_change_24h'),
    name: text('name'), // Asset name (optional)
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
    typeIdx: index('price_cache_type_idx').on(table.type),
    lastUpdatedIdx: index('price_cache_last_updated_idx').on(table.lastUpdated),
}));

export type PriceCache = typeof priceCache.$inferSelect;
export type NewPriceCache = typeof priceCache.$inferInsert;

