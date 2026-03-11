import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function fixZones() {
  const field = await db.query.fields.findFirst();
  if (!field) {
    console.log("No field found");
    return;
  }
  
  console.log("Field:", field.name);
  
  // Delete all existing zones for this field
  await db.delete(schema.zones).where(eq(schema.zones.fieldId, field.id));
  console.log("Deleted existing zones");
  
  // Add the 3 zones: Field A (top-left), Field B (bottom-left), Field C (bottom-right)
  const zonesToAdd = [
    { 
      name: "Field A", 
      description: "Northwest corner - great for small games", 
      capacity: 14, 
      pricePerHour: 6000  // $60/hr
    },
    { 
      name: "Field B", 
      description: "Southwest corner - perfect for training", 
      capacity: 14, 
      pricePerHour: 6000  // $60/hr
    },
    { 
      name: "Field C", 
      description: "Southeast corner - open practice area", 
      capacity: 14, 
      pricePerHour: 6000  // $60/hr
    },
  ];
  
  for (const zone of zonesToAdd) {
    await db.insert(schema.zones).values({
      fieldId: field.id,
      name: zone.name,
      description: zone.description,
      capacity: zone.capacity,
      pricePerHour: zone.pricePerHour,
      isActive: true,
    });
    console.log("  Added:", zone.name);
  }
  
  console.log("\nDone! 3 zones created: Field A, Field B, Field C");
}

fixZones();