import { MomentDocument, momentSchema } from "@/schemas/moments.schema";
import { addRxPlugin, createRxDatabase, RxCollection, RxDatabase } from "rxdb/plugins/core";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

addRxPlugin(RxDBUpdatePlugin);

// Add RxDB plugins for development and enhanced functionality
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

export type MyCollections = {
  moments: RxCollection<MomentDocument>;
};

let db: Promise<RxDatabase<MyCollections>> | null = null;

export async function initDB(): Promise<RxDatabase<MyCollections>> {
  if (!db) {
    db = (async () => {
      const db = await createRxDatabase<MyCollections>({
        name: "momentsdb",
        storage: getRxStorageDexie(),
        multiInstance: false,
      });

      // ✅ Add collections immediately, do not conditionally check
      await db.addCollections({
        moments: { schema: momentSchema },
      });

      return db;
    })();
  }
  return db;
}

export function generateId() {
  return (
    crypto.randomUUID?.() ||
    `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
}
