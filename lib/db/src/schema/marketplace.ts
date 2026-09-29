import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const marketplaceProfilesTable = pgTable("marketplace_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  role: varchar("role", { enum: ["customer", "guide"] }).notNull(),
  phone: varchar("phone"),
  region: varchar("region"),
  experience: varchar("experience", { length: 2000 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const adventuresTable = pgTable(
  "adventures",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerId: varchar("owner_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    category: varchar("category", {
      enum: ["Hunting", "Fishing", "ATV", "Dirt bike", "Snowmobile"],
    }).notNull(),
    location: varchar("location", { length: 160 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    price: integer("price").notNull(),
    duration: varchar("duration", { length: 80 }).notNull(),
    guests: varchar("guests", { length: 80 }).notNull(),
    capacity: integer("capacity").notNull().default(4),
    rating: integer("rating").notNull().default(5),
    reviews: integer("reviews").notNull().default(0),
    accent: varchar("accent", { length: 20 }).notNull().default("#a65327"),
    description: varchar("description", { length: 2000 }).notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    availability: varchar("availability", { length: 240 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("adventures_owner_idx").on(table.ownerId),
    index("adventures_category_idx").on(table.category),
  ],
);

export const bookingsTable = pgTable(
  "bookings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    adventureId: varchar("adventure_id")
      .notNull()
      .references(() => adventuresTable.id, { onDelete: "restrict" }),
    customerId: varchar("customer_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 80 }).notNull(),
    date: date("date").notNull(),
    partySize: integer("party_size").notNull(),
    total: integer("total").notNull(),
    notes: varchar("notes", { length: 2000 }).notNull().default(""),
    status: varchar("status", {
      enum: ["pending", "confirmed", "cancelled"],
    }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("bookings_customer_idx").on(table.customerId),
    index("bookings_adventure_date_idx").on(table.adventureId, table.date),
  ],
);

export const notificationsTable = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    recipientUserId: varchar("recipient_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    bookingId: varchar("booking_id").references(() => bookingsTable.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 40 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    message: varchar("message", { length: 1000 }).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_recipient_idx").on(table.recipientUserId, table.createdAt)],
);

export type MarketplaceProfile = typeof marketplaceProfilesTable.$inferSelect;
export type Adventure = typeof adventuresTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;