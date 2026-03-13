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
  // Roles: 'user', 'silver_admin' (first level approver), 'gold_admin' (final approver)
  role: varchar("role", { length: 20 }).notNull().default("user"),
  // Coach tiers for field access: 'gold', 'silver', 'bronze'
  tier: varchar("tier", { length: 20 }).notNull().default("bronze"),
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
  aboutInfo: text("about_info"), // Rich "About this Field" content
  imageUrl: text("image_url"),
  // Allowed tiers: 'gold', 'gold_silver', 'silver', 'silver_bronze', 'bronze', 'all'
  allowedTiers: varchar("allowed_tiers", { length: 50 }).notNull().default("all"),
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

// Reservations table with two-level approval
export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  zoneId: uuid("zone_id").notNull().references(() => zones.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  // Status: 'pending' (waiting for silver), 'pending_gold' (silver approved, waiting for gold), 
  // 'approved' (fully approved), 'denied', 'cancelled'
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  // Track who approved at each level
  silverApprovedBy: uuid("silver_approved_by").references(() => users.id),
  silverApprovedAt: timestamp("silver_approved_at"),
  goldApprovedBy: uuid("gold_approved_by").references(() => users.id),
  goldApprovedAt: timestamp("gold_approved_at"),
  // Track if moved from another reservation
  movedFromId: uuid("moved_from_id"),
  movedReason: text("moved_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Field Issues/Alerts table
export const fieldIssues = pgTable("field_issues", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  reportedBy: uuid("reported_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  issueType: varchar("issue_type", { length: 50 }).notNull().default("other"), // 'lights', 'safety', 'equipment', 'weather', 'other'
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open', 'in_progress', 'resolved'
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications table for alerts to coaches
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // 'cancellation', 'moved', 'approval', 'denial', 'field_issue'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedReservationId: uuid("related_reservation_id").references(() => reservations.id, { onDelete: "set null" }),
  relatedFieldId: uuid("related_field_id").references(() => fields.id, { onDelete: "set null" }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
  reportedIssues: many(fieldIssues, { relationName: "reporter" }),
  notifications: many(notifications),
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
  issues: many(fieldIssues),
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
  silverApprover: one(users, {
    fields: [reservations.silverApprovedBy],
    references: [users.id],
  }),
  goldApprover: one(users, {
    fields: [reservations.goldApprovedBy],
    references: [users.id],
  }),
}));

export const fieldIssuesRelations = relations(fieldIssues, ({ one }) => ({
  field: one(fields, {
    fields: [fieldIssues.fieldId],
    references: [fields.id],
  }),
  reporter: one(users, {
    fields: [fieldIssues.reportedBy],
    references: [users.id],
    relationName: "reporter",
  }),
  resolver: one(users, {
    fields: [fieldIssues.resolvedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  reservation: one(reservations, {
    fields: [notifications.relatedReservationId],
    references: [reservations.id],
  }),
  field: one(fields, {
    fields: [notifications.relatedFieldId],
    references: [fields.id],
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
export type FieldIssue = typeof fieldIssues.$inferSelect;
export type NewFieldIssue = typeof fieldIssues.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;