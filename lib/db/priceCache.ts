import { db } from './drizzle';
import { priceCache, assets } from './schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const CACHE_DURATION_MS = 60000; // 1 minute cache

interface CachedPrice {
    price: number;
    priceChange24h?: number;
    name?: string;
    lastUpdated: Date;
}

// Direct API calls for server-side use
async function fetchCryptoPriceDirect(coinId: string): Promise<{ price: number; changePercent?: number; name?: string } | null> {
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (!data[coinId]) {
            return null;
        }

        return {
            price: data[coinId].usd,
            changePercent: data[coinId].usd_24h_change || 0,
            name: coinId,
        };
    } catch (error) {
        console.error('Error fetching crypto price:', error);
        return null;
    }
}

async function fetchStockPriceDirect(symbol: string): Promise<{ price: number; changePercent?: number; name?: string } | null> {
    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                },
            }
        );

        if (!response.ok) {
            // Stock not found - this is normal for invalid tickers, don't log as error
            return null;
        }

        const data = await response.json();
        const quote = data?.chart?.result?.[0];

        if (!quote) {
            return null;
        }

        const meta = quote.meta;
        const currentPrice = meta?.regularMarketPrice;

        if (!currentPrice) {
            return null;
        }

        const previousClose = meta?.chartPreviousClose || meta?.previousClose;
        const changePercent = previousClose
            ? ((currentPrice - previousClose) / previousClose) * 100
            : 0;

        return {
            price: currentPrice,
            changePercent,
            name: meta?.longName || meta?.shortName || symbol,
        };
    } catch (error) {
        // Only log unexpected errors, not "stock not found" errors
        return null;
    }
}

async function fetchRealEstatePriceDirect(city: string, propertyType: 'apartment' | 'house'): Promise<{ price: number } | null> {
    // Real estate prices from static data (same as realEstateService.ts)
    const CITY_PRICE_DATA: Record<string, { pricePerSqm: number }> = {
        'new york': { pricePerSqm: 12000 },
        'san francisco': { pricePerSqm: 11000 },
        'los angeles': { pricePerSqm: 7000 },
        'miami': { pricePerSqm: 6500 },
        'chicago': { pricePerSqm: 4500 },
        'seattle': { pricePerSqm: 7500 },
        'boston': { pricePerSqm: 8000 },
        'london': { pricePerSqm: 15000 },
        'paris': { pricePerSqm: 13000 },
        'berlin': { pricePerSqm: 7000 },
        'munich': { pricePerSqm: 9500 },
        'amsterdam': { pricePerSqm: 8500 },
        'barcelona': { pricePerSqm: 5500 },
        'madrid': { pricePerSqm: 4500 },
        'rome': { pricePerSqm: 6000 },
        'milan': { pricePerSqm: 6500 },
        'zurich': { pricePerSqm: 14000 },
        'vienna': { pricePerSqm: 6500 },
        'lisbon': { pricePerSqm: 5000 },
        'tokyo': { pricePerSqm: 10000 },
        'hong kong': { pricePerSqm: 25000 },
        'singapore': { pricePerSqm: 18000 },
        'shanghai': { pricePerSqm: 9000 },
        'beijing': { pricePerSqm: 8500 },
        'seoul': { pricePerSqm: 11000 },
        'dubai': { pricePerSqm: 4500 },
        'bangkok': { pricePerSqm: 3500 },
        'mumbai': { pricePerSqm: 5000 },
        'sydney': { pricePerSqm: 9500 },
        'melbourne': { pricePerSqm: 7500 },
        'toronto': { pricePerSqm: 8000 },
        'vancouver': { pricePerSqm: 9000 },
    };

    const normalizedCity = city.toLowerCase().trim();
    const data = CITY_PRICE_DATA[normalizedCity];

    if (!data) {
        return null;
    }

    // Adjust price for houses (typically 15% less per sqm than apartments)
    let pricePerSqm = data.pricePerSqm;
    if (propertyType === 'house') {
        pricePerSqm = Math.round(pricePerSqm * 0.85);
    }

    return {
        price: pricePerSqm,
    };
}

// Get cached price or fetch new one
export async function getCachedPrice(
    id: string,
    type: 'crypto' | 'stock' | 'real-estate',
    cityPropertyType?: { city: string; propertyType: 'apartment' | 'house' }
): Promise<CachedPrice | null> {
    try {
        // Check cache first
        const cached = await db
            .select()
            .from(priceCache)
            .where(eq(priceCache.id, id))
            .limit(1);

        const now = new Date();

        if (cached.length > 0) {
            const cacheAge = now.getTime() - new Date(cached[0].lastUpdated).getTime();

            // If cache is fresh (< 1 minute), return it
            if (cacheAge < CACHE_DURATION_MS) {
                return {
                    price: parseFloat(cached[0].price),
                    priceChange24h: cached[0].priceChange24h ? parseFloat(cached[0].priceChange24h) : undefined,
                    name: cached[0].name || undefined,
                    lastUpdated: new Date(cached[0].lastUpdated),
                };
            }
        }

        // Cache is stale or doesn't exist, fetch new price
        let priceData: { price: number; changePercent?: number; name?: string } | null = null;

        if (type === 'crypto') {
            priceData = await fetchCryptoPriceDirect(id);
        } else if (type === 'stock') {
            priceData = await fetchStockPriceDirect(id);
        } else if (type === 'real-estate' && cityPropertyType) {
            const realEstateData = await fetchRealEstatePriceDirect(cityPropertyType.city, cityPropertyType.propertyType);
            if (realEstateData) {
                priceData = {
                    price: realEstateData.price,
                    name: `${cityPropertyType.city} - ${cityPropertyType.propertyType}`,
                };
            }
        }

        if (!priceData) {
            // Return stale cache if API fails
            if (cached.length > 0) {
                return {
                    price: parseFloat(cached[0].price),
                    priceChange24h: cached[0].priceChange24h ? parseFloat(cached[0].priceChange24h) : undefined,
                    name: cached[0].name || undefined,
                    lastUpdated: new Date(cached[0].lastUpdated),
                };
            }
            return null;
        }

        // Update cache
        await db
            .insert(priceCache)
            .values({
                id,
                type,
                price: priceData.price.toString(),
                priceChange24h: priceData.changePercent?.toString() || null,
                name: priceData.name || null,
                lastUpdated: now,
            })
            .onConflictDoUpdate({
                target: priceCache.id,
                set: {
                    price: priceData.price.toString(),
                    priceChange24h: priceData.changePercent?.toString() || null,
                    name: priceData.name || null,
                    lastUpdated: now,
                },
            });

        return {
            price: priceData.price,
            priceChange24h: priceData.changePercent,
            name: priceData.name,
            lastUpdated: now,
        };
    } catch (error) {
        // Silently return null - caller will handle missing prices
        return null;
    }
}

// Refresh all prices for a user's portfolio
export async function refreshUserPrices(userId: string) {
    try {
        const userAssets = await db
            .select()
            .from(assets)
            .where(eq(assets.userId, userId));

        const results = {
            updated: 0,
            failed: 0,
            cached: 0,
        };

        for (const asset of userAssets) {
            try {
                let priceData: CachedPrice | null = null;

                if (asset.type === 'crypto' && asset.coinId) {
                    priceData = await getCachedPrice(asset.coinId, 'crypto');
                } else if (asset.type === 'stock' && asset.symbol) {
                    priceData = await getCachedPrice(asset.symbol, 'stock');
                } else if (asset.type === 'real-estate' && asset.city && asset.propertyType) {
                    const cacheId = `${asset.city}-${asset.propertyType}`;
                    priceData = await getCachedPrice(
                        cacheId,
                        'real-estate',
                        { city: asset.city, propertyType: asset.propertyType as 'apartment' | 'house' }
                    );
                }

                if (priceData) {
                    // Update asset with new price
                    const updateData: any = {
                        updatedAt: sql`NOW()`,
                    };

                    // For crypto/stock, update currentPrice and priceChange24h
                    if (asset.type === 'crypto' || asset.type === 'stock') {
                        updateData.currentPrice = priceData.price.toString();
                        updateData.priceChange24h = priceData.priceChange24h?.toString() || null;
                    }
                    // For real estate, update pricePerSqm
                    else if (asset.type === 'real-estate') {
                        updateData.pricePerSqm = priceData.price.toString();
                    }

                    await db
                        .update(assets)
                        .set(updateData)
                        .where(eq(assets.id, asset.id));

                    results.updated++;
                } else {
                    // Price not available (stock not found, API down, etc.) - this is normal
                    results.failed++;
                }
            } catch (error) {
                // Silently fail - price refresh errors are non-critical
                results.failed++;
            }
        }

        return results;
    } catch (error) {
        console.error('Error refreshing user prices:', error);
        throw error;
    }
}

