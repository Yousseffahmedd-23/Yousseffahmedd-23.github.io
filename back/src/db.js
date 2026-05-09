import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

// Disable command buffering globally.
// Without this, operations queue silently for 10 s then throw
// "buffering timed out" — with this they fail immediately with a
// clear "not connected" message instead.
mongoose.set("bufferCommands", false);

export async function connectDb(uri) {
  mongoose.set("strictQuery", true);

  console.log("   URI format:", uri.startsWith("mongodb+srv") ? "SRV (recommended)" : "Direct");

  await mongoose.connect(uri, {
    // How long to wait for a server to be found in the cluster
    serverSelectionTimeoutMS: 10000,

    // How long a single socket operation can take
    socketTimeoutMS:          45000,

    // How long the initial TCP connection attempt can take
    connectTimeoutMS:         10000,

    // Connection pool size
    maxPoolSize:              10,
    minPoolSize:              1,

    // Retry once on transient errors
    retryWrites: true,
    retryReads:  true,

    // Required to avoid deprecation warning on replica sets
    directConnection: false,
  });

  // Attach persistent event listeners for visibility
  const db = mongoose.connection;
  db.on("disconnected", () => console.warn("⚠️  [mongodb] disconnected — attempting reconnect…"));
  db.on("reconnected",  () => console.log("✅  [mongodb] reconnected"));
  db.on("error",        (e) => console.error("❌  [mongodb] error:", e.message));

  return db;
}
