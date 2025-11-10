import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/drizzle';
import { assets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCachedPrice } from '@/lib/db/priceCache';

// GET - Fetch all assets for the authenticated user
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userAssets = await db.select().from(assets).where(eq(assets.userId, user.id));

        // Transform database rows back to Portfolio format
        const portfolio = {
            crypto: userAssets.filter(a => a.type === 'crypto').map(transformAsset),
            stocks: userAssets.filter(a => a.type === 'stock').map(transformAsset),
            realEstate: userAssets.filter(a => a.type === 'real-estate').map(transformAsset),
            cash: userAssets.filter(a => a.type === 'cash').map(transformAsset),
        };

        return NextResponse.json(portfolio);
    } catch (error: any) {
        console.error('Error fetching assets:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to transform database rows to frontend format
function transformAsset(asset: any) {
    return {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        purchaseDate: asset.purchaseDate,
        notes: asset.notes || undefined,
        // Crypto fields
        coinId: asset.coinId || undefined,
        symbol: asset.symbol || undefined,
        quantity: asset.quantity ? parseFloat(asset.quantity) : undefined,
        currentPrice: asset.currentPrice ? parseFloat(asset.currentPrice) : undefined,
        priceChange24h: asset.priceChange24h ? parseFloat(asset.priceChange24h) : undefined,
        // Real estate fields
        address: asset.address || undefined,
        city: asset.city || undefined,
        squareMeters: asset.squareMeters ? parseFloat(asset.squareMeters) : undefined,
        pricePerSqm: asset.pricePerSqm ? parseFloat(asset.pricePerSqm) : undefined,
        propertyType: asset.propertyType || undefined,
        // Cash fields
        amount: asset.amount ? parseFloat(asset.amount) : undefined,
        currency: asset.currency || undefined,
    };
}

// POST - Create a new asset
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        let assetData = { ...body, userId: user.id };

        // Check if we should skip price fetching (for bulk imports)
        const { searchParams } = new URL(request.url);
        const skipPrice = searchParams.get('skipPrice') === 'true';

        // If creating crypto/stock/real-estate and price is 0 or missing, try to get from cache
        // Skip this during bulk imports for better performance
        if (!skipPrice && body.type === 'crypto' && body.coinId && (!body.currentPrice || parseFloat(body.currentPrice) === 0)) {
            const priceData = await getCachedPrice(body.coinId, 'crypto');
            if (priceData) {
                assetData.currentPrice = priceData.price.toString();
                assetData.priceChange24h = priceData.priceChange24h?.toString() || null;
            }
        } else if (!skipPrice && body.type === 'stock' && body.symbol && (!body.currentPrice || parseFloat(body.currentPrice) === 0)) {
            const priceData = await getCachedPrice(body.symbol, 'stock');
            if (priceData) {
                assetData.currentPrice = priceData.price.toString();
                assetData.priceChange24h = priceData.priceChange24h?.toString() || null;
                if (priceData.name && !body.name) {
                    assetData.name = priceData.name;
                }
            }
        } else if (!skipPrice && body.type === 'real-estate' && body.city && body.propertyType && (!body.pricePerSqm || parseFloat(body.pricePerSqm) === 0)) {
            const cacheId = `${body.city}-${body.propertyType}`;
            const priceData = await getCachedPrice(cacheId, 'real-estate', { city: body.city, propertyType: body.propertyType });
            if (priceData) {
                assetData.pricePerSqm = priceData.price.toString();
            }
        }

        const [created] = await db.insert(assets).values(assetData).returning();

        return NextResponse.json(created);
    } catch (error: any) {
        console.error('Error creating asset:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

