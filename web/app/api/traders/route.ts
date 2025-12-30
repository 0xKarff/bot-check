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
    const traderStats = [];

    for (const trader of traders) {
      // Get activities count
      const activitiesCollection = db.collection(`user_activities_${trader}`);
      const activities = await activitiesCollection.find({}).toArray();

      // Get positions
      const positionsCollection = db.collection(`user_positions_${trader}`);
      const positions = await positionsCollection.find({}).toArray();

      // Calculate stats
      const totalTrades = activities.length;
      const botTrades = activities.filter((a: any) => a.bot === true).length;
      const totalPnl = positions.reduce((sum: number, p: any) => sum + (p.cashPnl || 0), 0);
      const totalValue = positions.reduce((sum: number, p: any) => sum + (p.currentValue || 0), 0);

      // Get last activity time
      const lastActivity = activities.length > 0
        ? Math.max(...activities.map((a: any) => a.timestamp || 0))
        : null;

      // Get trader info from first activity if available
      const sampleActivity = activities[0] || {};

      traderStats.push({
        address: trader,
        name: sampleActivity.name || sampleActivity.pseudonym || 'Unknown',
        profileImage: sampleActivity.profileImage || sampleActivity.profileImageOptimized,
        totalTrades,
        botTrades,
        totalPnl: totalPnl.toFixed(2),
        totalValue: totalValue.toFixed(2),
        openPositions: positions.length,
        lastActivity,
      });
    }

    // Sort by total trades
    traderStats.sort((a, b) => b.totalTrades - a.totalTrades);

    return NextResponse.json({
      traders: traderStats,
      total: traderStats.length,
    });
  } catch (error) {
    console.error('Traders API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch traders' }, { status: 500 });
  }
}
