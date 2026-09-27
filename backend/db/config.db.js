import { MongoClient } from "mongodb";
import "dotenv/config";
const client = new MongoClient(process.env.MONGO_URL);

try {
    await client.connect();
    console.log("connection to mongo db successfully");
} catch (e) {
    console.error("failed to connect to mongo", e);
    process.exit(1)
}

export const db = client.db("incident-map")
