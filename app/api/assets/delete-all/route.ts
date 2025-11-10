import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/drizzle';
import { assets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete all assets for this user
        const deleted = await db
            .delete(assets)
            .where(eq(assets.userId, user.id))
            .returning();

        return NextResponse.json({
            success: true,
            count: deleted.length,
            message: `Deleted ${deleted.length} assets`
        });
    } catch (error: any) {
        console.error('Error deleting all assets:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete assets' },
            { status: 500 }
        );
    }
}

