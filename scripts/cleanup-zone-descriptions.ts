import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function cleanupZoneDescriptions() {
  // Remove all zone descriptions - just keep the zone names clean
  await db.update(schema.zones).set({ description: null });
  
  console.log("Removed all zone descriptions");
  
  // List all zones
  const zones = await db.query.zones.findMany({
    with: { field: true }
  });
  
  console.log("\n=== Zones ===");
  for (const zone of zones) {
    console.log(`${zone.field.name} - ${zone.name}`);
  }
  
  console.log("\nDone!");
}

cleanupZoneDescriptions();