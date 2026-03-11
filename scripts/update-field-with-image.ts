import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function updateFieldImage() {
  const field = await db.query.fields.findFirst();
  if (!field) {
    console.log("No field found");
    return;
  }
  
  await db.update(schema.fields)
    .set({ imageUrl: "/fields/john_muir.png" })
    .where(eq(schema.fields.id, field.id));
  
  console.log("Updated field image to /fields/john_muir.png");
}

updateFieldImage();