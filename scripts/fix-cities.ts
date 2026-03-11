import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq, like } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function fixCities() {
  // Check if Duarte city exists
  let duarteCity = await db.query.cities.findFirst({
    where: eq(schema.cities.name, "Duarte")
  });
  
  if (!duarteCity) {
    // Create Duarte city
    const [newCity] = await db.insert(schema.cities).values({
      name: "Duarte",
      state: "California",
      country: "USA",
    }).returning();
    
    duarteCity = newCity;
    console.log("Created Duarte city");
  } else {
    console.log("Duarte city already exists");
  }
  
  // Update Otis Stadium to be in Duarte
  const otis = await db.query.fields.findFirst({
    where: like(schema.fields.name, '%Otis%')
  });
  
  if (otis) {
    await db.update(schema.fields)
      .set({ cityId: duarteCity.id })
      .where(eq(schema.fields.id, otis.id));
    console.log("Moved Otis Stadium to Duarte");
  }
  
  // Verify
  const allCities = await db.query.cities.findMany({
    with: { fields: true }
  });
  
  console.log("\nCities and Fields:");
  for (const city of allCities) {
    console.log(`  ${city.name}, ${city.state}:`);
    for (const field of city.fields) {
      console.log(`    - ${field.name} (${field.address})`);
    }
  }
  
  console.log("\nDone!");
}

fixCities();