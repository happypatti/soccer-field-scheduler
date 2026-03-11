import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Create a lazy database connection that only initializes when needed
const createDb = () => {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please add it to your .env.local file."
    );
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
};

// Export a proxy that lazily initializes the database connection
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(target, prop) {
    const database = createDb();
    return (database as any)[prop];
  },
});