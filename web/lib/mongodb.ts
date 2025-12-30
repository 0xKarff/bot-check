import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from parent directory
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/polymarket';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGO_URI).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

// Get all trader addresses from database collections
export async function getTrackedTraders(): Promise<string[]> {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) return [];

  const collections = await db.listCollections().toArray();
  const traders: string[] = [];

  for (const col of collections) {
    // Match collections like user_activities_0x... or user_positions_0x...
    const match = col.name.match(/^user_(activities|positions)_(0x[a-fA-F0-9]{40})$/);
    if (match && !traders.includes(match[2].toLowerCase())) {
      traders.push(match[2].toLowerCase());
    }
  }

  return traders;
}
