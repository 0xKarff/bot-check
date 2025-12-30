import { NextResponse } from 'next/server';
import { connectDB, getTrackedTraders } from '@/lib/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trader = searchParams.get('trader');

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

    let allPositions: any[] = [];

    for (const t of traders) {
      const collection = db.collection(`user_positions_${t}`);
      const positions = await collection.find({}).toArray();

      allPositions.push(...positions.map((p: any) => ({
        ...p,
        traderAddress: t,
      })));
    }

    // Sort by value
    allPositions.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));

    // Calculate totals
    const totalValue = allPositions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalPnl = allPositions.reduce((sum, p) => sum + (p.cashPnl || 0), 0);

    return NextResponse.json({
      positions: allPositions,
      totalValue: totalValue.toFixed(2),
      totalPnl: totalPnl.toFixed(2),
      totalPositions: allPositions.length,
    });
  } catch (error) {
    console.error('Positions API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}
