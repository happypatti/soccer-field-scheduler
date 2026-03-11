import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function addOtisField() {
  // Get the city (Pasadena)
  const city = await db.query.cities.findFirst();
  if (!city) {
    console.log("No city found. Please add a city first.");
    return;
  }
  
  console.log("City:", city.name);
  
  // Check if Otis field already exists
  const existingField = await db.query.fields.findFirst({
    where: eq(schema.fields.name, "Otis Stadium")
  });
  
  let fieldId: string;
  
  if (existingField) {
    console.log("Otis Stadium already exists, using existing field");
    fieldId = existingField.id;
    
    // Update the image URL
    await db.update(schema.fields)
      .set({ imageUrl: "/fields/otis.png" })
      .where(eq(schema.fields.id, fieldId));
    
    // Delete existing zones
    await db.delete(schema.zones).where(eq(schema.zones.fieldId, fieldId));
    console.log("Cleared existing zones");
  } else {
    // Create the Otis field
    const [newField] = await db.insert(schema.fields).values({
      cityId: city.id,
      name: "Otis Stadium",
      address: "1234 Otis Avenue",
      description: "Multi-use sports complex with multiple soccer fields",
      imageUrl: "/fields/otis.png",
      isActive: true,
    }).returning();
    
    fieldId = newField.id;
    console.log("Created Otis Stadium");
  }
  
  // Add the 3 zones: top-left, mid-right, bottom-right
  const zonesToAdd = [
    { 
      name: "Field A", 
      description: "Top-left field - great for small games", 
      capacity: 14
    },
    { 
      name: "Field B", 
      description: "Mid-right field - perfect for training", 
      capacity: 14
    },
    { 
      name: "Field C", 
      description: "Bottom-right field - open practice area", 
      capacity: 14
    },
  ];
  
  for (const zone of zonesToAdd) {
    await db.insert(schema.zones).values({
      fieldId: fieldId,
      name: zone.name,
      description: zone.description,
      capacity: zone.capacity,
      pricePerHour: null, // Internal tool, no pricing
      isActive: true,
    });
    console.log("  Added:", zone.name);
  }
  
  console.log("\nDone! Otis Stadium created with 3 zones: Field A (top-left), Field B (mid-right), Field C (bottom-right)");
}

addOtisField();