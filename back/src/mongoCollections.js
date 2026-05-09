import mongoose from "mongoose";

/** Create physical collections in MongoDB and apply schema indexes (so Atlas/Compass lists them). */
export async function ensureMongoCollections() {
  if (mongoose.connection.readyState !== 1) return;

  const names = mongoose.modelNames();
  for (const name of names) {
    const Model = mongoose.model(name);
    try {
      await Model.createCollection();
    } catch (e) {
      const exists = e?.code === 48 || e?.codeName === "NamespaceExists";
      if (!exists) console.warn(`[mongo] createCollection ${name}:`, e.message);
    }
    try {
      await Model.syncIndexes();
    } catch (e) {
      console.warn(`[mongo] syncIndexes ${name}:`, e.message);
    }
  }

  console.log(`[mongo] registered collections: ${names.sort().join(", ")}`);
}
