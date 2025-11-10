import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/drizzle';
import { wealthHistory, userSettings } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET wealth history
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if wealth tracking is enabled
        const settings = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, user.id))
            .limit(1);

        if (settings.length === 0 || settings[0].wealthTrackingEnabled !== 'true') {
            return NextResponse.json({ error: 'Wealth tracking is not enabled' }, { status: 403 });
        }

        // Fetch wealth history for the user, ordered by date descending
        const history = await db.select()
            .from(wealthHistory)
            .where(eq(wealthHistory.userId, user.id))
            .orderBy(desc(wealthHistory.date))
            .limit(365); // Last year of data

        // Convert to regular objects with parsed numbers
        const historyData = history.map(h => ({
            id: h.id,
            date: h.date,
            totalValue: parseFloat(h.totalValue),
            cryptoValue: parseFloat(h.cryptoValue),
            stocksValue: parseFloat(h.stocksValue),
            realEstateValue: parseFloat(h.realEstateValue),
            cashValue: parseFloat(h.cashValue),
            createdAt: h.createdAt
        }));

        return NextResponse.json(historyData);
    } catch (error: any) {
        console.error('Error fetching wealth history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wealth history', details: error.message },
            { status: 500 }
        );
    }
}

// POST create wealth snapshot
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if wealth tracking is enabled
        const settings = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, user.id))
            .limit(1);

        if (settings.length === 0 || settings[0].wealthTrackingEnabled !== 'true') {
            return NextResponse.json({ error: 'Wealth tracking is not enabled' }, { status: 403 });
        }

        const body = await request.json();
        const { totalValue, cryptoValue, stocksValue, realEstateValue, cashValue } = body;

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const snapshotId = `${user.id}-${today}`;

        // Check if a snapshot already exists for today
        const existingSnapshot = await db.select()
            .from(wealthHistory)
            .where(and(
                eq(wealthHistory.userId, user.id),
                eq(wealthHistory.date, today)
            ))
            .limit(1);

        const snapshotData = {
            id: snapshotId,
            userId: user.id,
            date: today,
            totalValue: totalValue.toString(),
            cryptoValue: cryptoValue.toString(),
            stocksValue: stocksValue.toString(),
            realEstateValue: realEstateValue.toString(),
            cashValue: cashValue.toString(),
            createdAt: new Date()
        };

        if (existingSnapshot.length === 0) {
            // Insert new snapshot
            await db.insert(wealthHistory).values(snapshotData);
        } else {
            // Update existing snapshot for today
            await db.update(wealthHistory)
                .set(snapshotData)
                .where(eq(wealthHistory.id, snapshotId));
        }

        return NextResponse.json({ success: true, snapshotId });
    } catch (error: any) {
        console.error('Error creating wealth snapshot:', error);
        return NextResponse.json(
            { error: 'Failed to create wealth snapshot', details: error.message },
            { status: 500 }
        );
    }
}

