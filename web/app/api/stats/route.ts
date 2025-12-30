import { NextResponse } from 'next/server';
import { connectDB, getTrackedTraders } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const traders = await getTrackedTraders();

    let totalTrades = 0;
    let totalPnl = 0;
    let botExecutedTrades = 0;
    let recentActivities: any[] = [];

    for (const trader of traders) {
      // Get activities
      const activitiesCollection = db.collection(`user_activities_${trader}`);
      const activities = await activitiesCollection.find({}).toArray();

      totalTrades += activities.length;
      botExecutedTrades += activities.filter((a: any) => a.bot === true).length;

      // Get recent activities (last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recent = activities
        .filter((a: any) => a.timestamp && a.timestamp * 1000 > oneDayAgo)
        .map((a: any) => ({ ...a, traderAddress: trader }));
      recentActivities.push(...recent);

      // Get positions for PnL
      const positionsCollection = db.collection(`user_positions_${trader}`);
      const positions = await positionsCollection.find({}).toArray();

      for (const pos of positions) {
        if (pos.cashPnl) {
          totalPnl += pos.cashPnl;
        }
      }
    }

    // Sort recent activities by timestamp
    recentActivities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    recentActivities = recentActivities.slice(0, 20);

    return NextResponse.json({
      totalTraders: traders.length,
      totalTrades,
      botExecutedTrades,
      totalPnl: totalPnl.toFixed(2),
      recentActivities,
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
