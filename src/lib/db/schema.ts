import { pgTable, text, timestamp, uuid, varchar, integer, boolean, time, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  teamName: varchar("team_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 20 }).notNull().default("user"), // 'user' or 'admin'
  tier: varchar("tier", { length: 20 }).notNull().default("bronze"), // 'gold', 'silver', 'bronze'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cities table
export const cities = pgTable("cities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull().default("USA"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fields table
export const fields = pgTable("fields", {
  id: uuid("id").defaultRandom().primaryKey(),
  cityId: uuid("city_id").notNull().references(() => cities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zones table (sections of a field)
export const zones = pgTable("zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  capacity: integer("capacity"), // max players
  pricePerHour: integer("price_per_hour"), // in cents
  // Zone overlay positioning (percentages)
  posLeft: integer("pos_left"), // left position %
  posTop: integer("pos_top"), // top position %
  posWidth: integer("pos_width"), // width %
  posHeight: integer("pos_height"), // height %
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password Reset Tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reservations table
export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  zoneId: uuid("zone_id").notNull().references(() => zones.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'approved', 'denied', 'cancelled'
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
}));

export const citiesRelations = relations(cities, ({ many }) => ({
  fields: many(fields),
}));

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  city: one(cities, {
    fields: [fields.cityId],
    references: [cities.id],
  }),
  zones: many(zones),
}));

export const zonesRelations = relations(zones, ({ one, many }) => ({
  field: one(fields, {
    fields: [zones.fieldId],
    references: [fields.id],
  }),
  reservations: many(reservations),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  zone: one(zones, {
    fields: [reservations.zoneId],
    references: [zones.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;
export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;
export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;