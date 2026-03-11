import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq, like } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function updateAddresses() {
  // Update John Muir
  const johnMuir = await db.query.fields.findFirst({
    where: like(schema.fields.name, '%John Muir%')
  });
  
  if (johnMuir) {
    await db.update(schema.fields)
      .set({ address: "640-720 W Montana St, Pasadena, CA 91103" })
      .where(eq(schema.fields.id, johnMuir.id));
    console.log("Updated John Muir address");
  }
  
  // Update Otis
  const otis = await db.query.fields.findFirst({
    where: like(schema.fields.name, '%Otis%')
  });
  
  if (otis) {
    await db.update(schema.fields)
      .set({ address: "2340 Central Ave, Duarte, CA 91010" })
      .where(eq(schema.fields.id, otis.id));
    console.log("Updated Otis address");
  }
  
  console.log("\nDone!");
}

updateAddresses();