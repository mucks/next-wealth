import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/drizzle';
import { userSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET user settings
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user settings
        const settings = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, user.id))
            .limit(1);

        // If no settings exist, return defaults
        if (settings.length === 0) {
            return NextResponse.json({
                wealthTrackingEnabled: false
            });
        }

        return NextResponse.json({
            wealthTrackingEnabled: settings[0].wealthTrackingEnabled === 'true'
        });
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings', details: error.message },
            { status: 500 }
        );
    }
}

// PUT update user settings
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { wealthTrackingEnabled } = body;

        // Check if settings exist
        const existingSettings = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, user.id))
            .limit(1);

        const settingsData = {
            userId: user.id,
            wealthTrackingEnabled: wealthTrackingEnabled ? 'true' : 'false',
            updatedAt: new Date()
        };

        if (existingSettings.length === 0) {
            // Insert new settings
            await db.insert(userSettings).values({
                ...settingsData,
                createdAt: new Date()
            });
        } else {
            // Update existing settings
            await db.update(userSettings)
                .set(settingsData)
                .where(eq(userSettings.userId, user.id));
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings', details: error.message },
            { status: 500 }
        );
    }
}

