import { addRxPlugin, createRxDatabase } from "rxdb/plugins/core";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

addRxPlugin(RxDBDevModePlugin);

let dbPromise: any = null;

export const initDB = async () => {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase({
    name: "eventsdb", // database name
    storage: getRxStorageDexie(), // persistent storage
  }).then(async (db) => {
    await db.addCollections({
      countdowns: {
        schema: {
          version: 0,
          primaryKey: "id",
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            date: { type: "string", format: "date-time" },
          },
          required: ["id", "title", "date"],
        },
      },
    });
    return db;
  });

  return dbPromise;
};
