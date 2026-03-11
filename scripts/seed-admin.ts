import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";

const connectionString = process.env.DATABASE_URL!;
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function seedAdmin() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  try {
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "admin@example.com"),
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    await db.insert(schema.users).values({
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
    });

    console.log("Admin user created successfully!");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error creating admin:", error);
  }
}

seedAdmin();