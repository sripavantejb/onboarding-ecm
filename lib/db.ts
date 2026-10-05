import mongoose from "mongoose";
import { env } from "@/lib/env";

/**
 * Cached Mongoose connection. In development, Next.js clears the module cache on
 * every request/HMR, which would otherwise open a new connection each time and
 * exhaust the pool. We stash the promise on the global object.
 *
 * Reconnects are serialized through a single in-flight promise so concurrent
 * requests never race on disconnect/connect after an Atlas blip.
 */

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

const CONNECT_OPTS: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 10_000,
  maxIdleTimeMS: 60_000,
  socketTimeoutMS: 45_000,
};

function isConnected(conn: typeof mongoose | null): conn is typeof mongoose {
  return Boolean(conn && conn.connection.readyState === 1);
}

function isTransientMongoError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const name = err.name.toLowerCase();
  return (
    name.includes("mongo") ||
    msg.includes("buffering timed out") ||
    msg.includes("server selection") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound") ||
    msg.includes("querysrv") ||
    msg.includes("topology was destroyed") ||
    msg.includes("connection pool") ||
    msg.includes("not connected") ||
    msg.includes("client was closed")
  );
}

function startConnect(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  return mongoose
    .connect(env.MONGODB_URI, CONNECT_OPTS)
    .then((m) => {
      cached.conn = m;
      return m;
    })
    .catch((err) => {
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
}

/** Connect (or reuse) the shared Mongoose connection, with one retry on blips. */
export async function dbConnect(): Promise<typeof mongoose> {
  if (isConnected(cached.conn)) return cached.conn;

  // Drop a stale handle from the cache (do NOT disconnect globally — that races).
  if (cached.conn && !isConnected(cached.conn)) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = startConnect();
  }

  try {
    return await cached.promise;
  } catch (first) {
    if (!isTransientMongoError(first)) throw first;
    // Brief pause, then a clean serialized retry.
    await new Promise((r) => setTimeout(r, 250));
    if (isConnected(cached.conn)) return cached.conn;
    if (!cached.promise) {
      cached.promise = startConnect();
    }
    return cached.promise;
  }
}
