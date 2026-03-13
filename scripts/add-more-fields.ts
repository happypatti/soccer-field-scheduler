import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

// High schools to add with their cities
const schoolsToAdd = [
  { name: "West Covina High School", city: "West Covina", state: "California", address: "1609 E Cameron Ave, West Covina, CA 91791" },
  { name: "Duarte High School", city: "Duarte", state: "California", address: "1565 Central Ave, Duarte, CA 91010" },
  { name: "Charter Oak High School", city: "Covina", state: "California", address: "1430 E Covina Blvd, Covina, CA 91724" },
  { name: "Edgewood High School", city: "West Covina", state: "California", address: "1625 W Durness St, West Covina, CA 91790" },
  { name: "La Canada High School", city: "La Cañada Flintridge", state: "California", address: "4463 Oak Grove Dr, La Cañada Flintridge, CA 91011" },
];

async function addMoreFields() {
  for (const school of schoolsToAdd) {
    // Check if city exists, if not create it
    let city = await db.query.cities.findFirst({
      where: eq(schema.cities.name, school.city)
    });
    
    if (!city) {
      const [newCity] = await db.insert(schema.cities).values({
        name: school.city,
        state: school.state,
        country: "USA",
      }).returning();
      city = newCity;
      console.log(`Created city: ${city.name}`);
    }
    
    // Check if field already exists
    const existingField = await db.query.fields.findFirst({
      where: eq(schema.fields.name, school.name)
    });
    
    if (existingField) {
      console.log(`Field already exists: ${school.name}`);
      continue;
    }
    
    // Create the field
    const [field] = await db.insert(schema.fields).values({
      cityId: city.id,
      name: school.name,
      address: school.address,
      description: `Soccer training facility at ${school.name}`,
      imageUrl: null, // Will be added later when user provides images
      isActive: true,
    }).returning();
    
    console.log(`Created field: ${field.name}`);
    
    // Add placeholder zones (will be updated later)
    const defaultZones = ["Field A", "Field B", "Field C"];
    for (const zoneName of defaultZones) {
      await db.insert(schema.zones).values({
        fieldId: field.id,
        name: zoneName,
        description: `${zoneName} at ${school.name}`,
        capacity: null,
        pricePerHour: null,
        isActive: true,
      });
    }
    console.log(`  Added 3 default zones`);
  }
  
  // List all cities and fields
  console.log("\n=== Current Cities and Fields ===");
  const allCities = await db.query.cities.findMany({
    with: { fields: true }
  });
  
  for (const city of allCities) {
    console.log(`\n${city.name}, ${city.state}:`);
    for (const field of city.fields) {
      console.log(`  - ${field.name}`);
    }
  }
  
  console.log("\nDone!");
}

addMoreFields();