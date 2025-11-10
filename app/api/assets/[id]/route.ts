import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/drizzle';
import { assets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT - Update an asset
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const assetData = { ...body, userId: user.id };

        const [updated] = await db
            .update(assets)
            .set(assetData)
            .where(and(eq(assets.id, id), eq(assets.userId, user.id)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating asset:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Delete an asset
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = await params;

        await db.delete(assets).where(and(eq(assets.id, id), eq(assets.userId, user.id)));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting asset:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

