import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;

let connectionPromise;

export function connectMongo() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI must be configured before starting the API.");
  }

  if (!connectionPromise) {
    const client = new MongoClient(mongoUri);
    connectionPromise = client
      .connect()
      .then(() => ({ client, db: client.db("importora") }))
      .catch(async () => {
        await client.close().catch(() => {});
        connectionPromise = undefined;
        throw new Error("Native MongoDB connection failed. Check MongoDB availability and MONGODB_URI.");
      });
  }

  return connectionPromise;
}

export async function closeMongo() {
  if (!connectionPromise) return;

  const connection = await connectionPromise.catch(() => undefined);
  connectionPromise = undefined;
  await connection?.client.close();
}
