/**
 * Définition simplifiée des tables pour l'initialisation des permissions
 */
const { pgTable, serial, text, integer, timestamp, varchar } = require('drizzle-orm/pg-core');

// Permissions table
const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Role permissions mapping table
const role_permissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
  permission_id: integer("permission_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

module.exports = {
  permissions,
  role_permissions
};
