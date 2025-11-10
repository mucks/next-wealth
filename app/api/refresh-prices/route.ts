import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshUserPrices } from '@/lib/db/priceCache';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await refreshUserPrices(user.id);

        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error('Error refreshing prices:', error);
        return NextResponse.json(
            { error: 'Failed to refresh prices' },
            { status: 500 }
        );
    }
}

