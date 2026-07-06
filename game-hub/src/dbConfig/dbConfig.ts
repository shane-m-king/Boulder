import mongoose from "mongoose";

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = (global as any).mongoose || { conn: null, promise: null };

if (!cached.conn) {
  (global as any).mongoose = cached;
}

const connect = async (): Promise<typeof mongoose> => {
  if (cached.conn) return cached.conn;

  const dbUri =
    process.env.NODE_ENV === "test"
      ? process.env.MONGO_URI_TEST
      : process.env.MONGO_URI;

  if (!dbUri) {
    throw new Error("MONGO_URI not defined");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 5,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    };

    const connectWithRetry = async (retries = 3): Promise<typeof mongoose> => {
      try {
        const conn = await mongoose.connect(dbUri, opts);
        console.log("MongoDB connected");
        return conn;
      } catch (err) {
        console.error("MongoDB connection failed, retrying...", err);
        if (retries <= 1) throw err;
        await new Promise((res) => setTimeout(res, 1000));
        return connectWithRetry(retries - 1);
      }
    };

    cached.promise = connectWithRetry();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Clear the failed promise so the next request can retry the connection
    // instead of awaiting the same rejected promise forever
    cached.promise = null;
    throw err;
  }
  return cached.conn;
};

export default connect;
