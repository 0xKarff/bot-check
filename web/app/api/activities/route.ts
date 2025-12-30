import { NextResponse } from 'next/server';
import { connectDB, getTrackedTraders } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trader = searchParams.get('trader');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    let traders: string[];
    if (trader) {
      traders = [trader.toLowerCase()];
    } else {
      traders = await getTrackedTraders();
    }

    let allActivities: any[] = [];

    for (const t of traders) {
      const collection = db.collection(`user_activities_${t}`);
      const activities = await collection
        .find({})
        .sort({ timestamp: -1 })
        .toArray();

      allActivities.push(...activities.map((a: any) => ({
        ...a,
        traderAddress: t,
      })));
    }

    // Sort by timestamp
    allActivities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Paginate
    const total = allActivities.length;
    const paginated = allActivities.slice(offset, offset + limit);

    return NextResponse.json({
      activities: paginated,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Activities API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
