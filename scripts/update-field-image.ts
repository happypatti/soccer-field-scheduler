import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function updateFieldImage() {
  try {
    const field = await db.query.fields.findFirst();
    
    if (!field) {
      console.log("No fields found.");
      return;
    }
    
    console.log("Updating field image for:", field.name);
    
    await db.update(schema.fields)
      .set({
        imageUrl: '/fields/muir-north-field.jpg',
        updatedAt: new Date(),
      })
      .where(eq(schema.fields.id, field.id));
    
    console.log("✅ Field image URL updated!");
  } catch (error) {
    console.error("Error updating field:", error);
  }
}

updateFieldImage();