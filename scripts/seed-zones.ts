import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function seedZones() {
  try {
    // Get the first field
    const field = await db.query.fields.findFirst();
    
    if (!field) {
      console.log("No fields found. Please add a field first via the admin panel.");
      return;
    }
    
    console.log("Adding zones to field:", field.name);
    
    // Check if zones already exist for this field
    const existingZones = await db.query.zones.findMany({
      where: eq(schema.zones.fieldId, field.id),
    });
    
    if (existingZones.length > 0) {
      console.log(`Field already has ${existingZones.length} zones.`);
      return;
    }
    
    // Add sample zones
    const zonesToAdd = [
      { 
        name: "Full Field", 
        description: "11v11 full size field - ideal for competitive matches", 
        capacity: 22, 
        pricePerHour: 10000  // $100/hr
      },
      { 
        name: "Half Field A (North)", 
        description: "6v6 or 7v7 matches - great for small-sided games", 
        capacity: 14, 
        pricePerHour: 6000   // $60/hr
      },
      { 
        name: "Half Field B (South)", 
        description: "6v6 or 7v7 matches - perfect for training sessions", 
        capacity: 14, 
        pricePerHour: 6000   // $60/hr
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
      console.log(`  ✓ Added zone: ${zone.name}`);
    }
    
    console.log("\n✅ Successfully added 3 zones!");
  } catch (error) {
    console.error("Error seeding zones:", error);
  }
}

seedZones();