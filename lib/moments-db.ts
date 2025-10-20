import { addRxPlugin, createRxDatabase } from "rxdb/plugins/core";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";


// Add RxDB plugins for development and enhanced functionality
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

const momentSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 36, // UUID length
    },
    title: {
      type: "string",
      maxLength: 100,
    },
    description: {
      type: "string",
      maxLength: 200,
    },
    date: {
      type: "string",
      maxLength: 10, // YYYY-MM-DD format
    },
    repeatFrequency: {
      type: "string",
      enum: ["none", "daily", "weekly", "monthly", "yearly"],
      default: "none",
      maxLength: 10,
    },
    createdAt: {
      type: "string",
      format: "date-time",
      maxLength: 50,
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      maxLength: 50,
    },
  },
  required: [
    "id",
    "title",
    "date",
    "repeatFrequency",
    "createdAt",
    "updatedAt",
  ],
  indexes: [
    "date", // Index for date-based queries
    "createdAt", // Index for chronological sorting
    "repeatFrequency", // Index for filtering repeat events
    ["repeatFrequency", "date"], // Compound index for efficient repeat event queries
  ],
};

let db: any = null;

export async function initDB() {
  if (db) return db;

  db = await createRxDatabase({
    name: "lifemomentsdb",
    storage: getRxStorageDexie(),
  });

  await db.addCollections({
    moments: {
      schema: momentSchema,
    },
  });

  return db;
}

export function generateId() {
  return (
    crypto.randomUUID?.() ||
    `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
}
