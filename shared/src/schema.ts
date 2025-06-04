import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  json,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum definitions
export const userRoleEnum = pgEnum("user_role", [
  "CUSTOMER",
  "ADMIN",
  "PHARMACY_STAFF",
  "PHARMACIST", 
  "DELIVERY_PERSON",
  "SUPER_ADMIN",
  "MANAGER",
  "SUPPORT",
  "VIEWER",
] as const);

// Export UserRole type for TypeScript
export const UserRole = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN", 
  PHARMACY_STAFF: "PHARMACY_STAFF",
  PHARMACIST: "PHARMACIST",
  DELIVERY_PERSON: "DELIVERY_PERSON",
  SUPER_ADMIN: "SUPER_ADMIN",
  MANAGER: "MANAGER",
  SUPPORT: "SUPPORT",
  VIEWER: "VIEWER",
  PHARMACY_MANAGER: "PHARMACY_STAFF", // Alias for PHARMACY_STAFF
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

// Permission type exports
export type AiSettings = typeof ai_settings.$inferSelect;
export type InsertAiSettings = typeof ai_settings.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

export type RolePermission = typeof role_permissions.$inferSelect;
export type InsertRolePermission = typeof role_permissions.$inferInsert;

export type UserPermission = typeof user_permissions.$inferSelect;
export type InsertUserPermission = typeof user_permissions.$inferInsert;

export const pharmacyStatusEnum = pgEnum("pharmacy_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PENDING_INFO",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "PURCHASE",
  "SALE",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "EXPIRED",
  "DAMAGED",
  "RETURNED",
]);

// Export StockMovementType constants for TypeScript
export const StockMovementType = {
  PURCHASE: "PURCHASE",
  SALE: "SALE",
  ADJUSTMENT: "ADJUSTMENT",
  TRANSFER_IN: "TRANSFER_IN",
  TRANSFER_OUT: "TRANSFER_OUT",
  EXPIRED: "EXPIRED",
  DAMAGED: "DAMAGED",
  RETURNED: "RETURNED",
} as const;

export type StockMovementType = typeof StockMovementType[keyof typeof StockMovementType];

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  phone: text("phone").notNull().unique(),
  role: userRoleEnum("role").notNull().default("CUSTOMER"),
  address: text("address"),
  location: json("location").$type<{ lat: number; lng: number }>(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  profile_image: text("profile_image"),
  password_hash: text("password_hash"), // Ajout du champ mot de passe haché
  first_name: text("first_name"), // Ajout du prénom
  last_name: text("last_name"), // Ajout du nom de famille
  last_login: timestamp("last_login"), // Date de dernière connexion
  last_logout: timestamp("last_logout"), // Date de dernière déconnexion
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
});

// Pharmacy table
export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  location: json("location").$type<{ lat: number; lng: number }>().notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  license_number: text("license_number").notNull().unique(),
  is_verified: boolean("is_verified").default(false).notNull(),
  opening_hours: json("opening_hours"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  is_active: boolean("is_active").default(true).notNull(),
  logo_image: text("logo_image"),
  website: text("website"),
  is_24_hours: boolean("is_24_hours").default(false),
  image_url: text("image_url"),
  status: pharmacyStatusEnum("status").default("PENDING").notNull(),
  rejection_reason: text("rejection_reason"),
  additional_info_required: text("additional_info_required"),
  verified_by: integer("verified_by").references(() => users.id, { onDelete: "set null" }),
  verified_at: timestamp("verified_at"),
  reorder_threshold: integer("reorder_threshold").default(10),
});

// Medicine table
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  generic_name: text("generic_name"),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  requires_prescription: boolean("requires_prescription").default(false).notNull(),
  category: text("category"),
  manufacturer: text("manufacturer"),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  in_stock: boolean("in_stock").default(true).notNull(),
  stock_quantity: integer("stock_quantity").default(0).notNull(),
});

// Pharmacy staff relation
export const pharmacy_staff = pgTable("pharmacy_staff", {
  id: serial("id").primaryKey(),
  pharmacy_id: integer("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id, { onDelete: "cascade" }),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("STAFF"),
  position: text("position"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Pharmacy medicines relation
export const pharmacy_medicines = pgTable("pharmacy_medicines", {
  id: serial("id").primaryKey(),
  pharmacy_id: integer("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id, { onDelete: "cascade" }),
  medicine_id: integer("medicine_id")
    .notNull()
    .references(() => medicines.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }),
  cost_price: decimal("cost_price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0).notNull(),
  // Add missing columns for enhanced stock management
  quantity: integer("quantity").default(0).notNull(), // Alias for stock for consistency
  alert_threshold: integer("alert_threshold").default(5).notNull(),
  reorder_level: integer("reorder_level").default(10).notNull(),
  reorder_threshold: integer("reorder_threshold").default(5).notNull(),
  optimal_stock: integer("optimal_stock"),
  expiry_date: timestamp("expiry_date"),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }),
  location_in_pharmacy: text("location_in_pharmacy"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Order table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  order_number: varchar("order_number", { length: 20 }).unique().notNull(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  pharmacy_id: integer("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id, { onDelete: "restrict" }),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  delivery_address: text("delivery_address").notNull(),
  delivery_coordinates: json("delivery_coordinates").$type<{ lat: number; lng: number }>(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  delivery_person_id: integer("delivery_person_id").references(() => users.id, {
    onDelete: "set null",
  }),
  expected_delivery_time: timestamp("expected_delivery_time"),
  actual_delivery_time: timestamp("actual_delivery_time"),
  payment_method: text("payment_method").default("CARD").notNull(),
  payment_status: text("payment_status").default("PENDING").notNull(),
  payment_intent_id: text("payment_intent_id"),
  transaction_reference: text("transaction_reference"),
  payment_provider: text("payment_provider"),
  payment_phone: varchar("payment_phone", { length: 20 }),
  payment_date: timestamp("payment_date"),
  rating: integer("rating"),
  review_comment: text("review_comment"),
});

// Order items table
export const order_items = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  medicine_id: integer("medicine_id")
    .notNull()
    .references(() => medicines.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Prescription table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  image_url: text("image_url").notNull(),
  ai_analysis: json("ai_analysis"),
  status: text("status").default("pending"),
  verified_by: integer("verified_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  verified_at: timestamp("verified_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  order_id: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
});

// Message table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sender_id: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiver_id: integer("receiver_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  is_read: boolean("is_read").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  order_id: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  attachment_url: text("attachment_url"),
});

// Reminder table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  medicine_name: text("medicine_name").notNull(),
  dosage: text("dosage"),
  schedule: json("schedule").notNull(),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  last_taken: timestamp("last_taken"),
  next_reminder: timestamp("next_reminder"),
  medicine_id: integer("medicine_id").references(() => medicines.id, { onDelete: "set null" }),
});

// Supplier Orders table
export const supplier_orders = pgTable("supplier_orders", {
  id: serial("id").primaryKey(),
  pharmacy_id: integer("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id, { onDelete: "restrict" }),
  // Colonne order_number retirée car elle n'existe pas dans la DB
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("PENDING").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  expected_delivery_date: timestamp("expected_delivery_date"),
  actual_delivery_date: timestamp("actual_delivery_date"),
  // Colonne payment_status retirée car elle n'existe pas dans la DB
  // payment_status: text("payment_status").default("UNPAID").notNull(),
  // Colonne payment_date retirée car elle n'existe pas dans la DB
  // payment_date: timestamp("payment_date"),
  supplier_name: text("supplier_name").notNull(),
  // Colonne supplier_contact retirée car elle n'existe pas dans la DB
  // supplier_contact: text("supplier_contact"),
  // Colonne notes retirée car elle n'existe pas dans la DB
  // notes: text("notes"),
});

// Supplier Order Items table
export const supplier_order_items = pgTable("supplier_order_items", {
  id: serial("id").primaryKey(),
  supplier_order_id: integer("supplier_order_id")
    .notNull()
    .references(() => supplier_orders.id, { onDelete: "cascade" }),
  medicine_id: integer("medicine_id")
    .notNull()
    .references(() => medicines.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// System logs table
export const system_logs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entity_id: integer("entity_id"),
  type: text("type"),  // Ajout de la colonne manquante
  user_id: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  details: json("details"),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  level: text("level").default("INFO").notNull(),
});

// Permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Role permissions mapping table
export const role_permissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: userRoleEnum("role").notNull(),
  permission_id: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User custom permissions (overrides) table
export const user_permissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  permission_id: integer("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  granted: boolean("granted").notNull(),  // true = explicitly granted, false = explicitly denied
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// AI Settings table
export const ai_settings = pgTable("ai_settings", {
  id: serial("id").primaryKey(),
  feature: text("feature").unique().notNull(),
  is_enabled: boolean("is_enabled").default(true).notNull(),
  configuration: json("configuration"),
  last_updated_by: integer("last_updated_by").references(() => users.id, { onDelete: "set null" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Delivery Location Tracking table
export const delivery_tracking = pgTable("delivery_tracking", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  delivery_person_id: integer("delivery_person_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  current_location: json("current_location").$type<{ lat: number; lng: number }>().notNull(),
  heading: integer("heading"),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  battery_level: decimal("battery_level", { precision: 5, scale: 2 }),
});

// Stock Movements table
export const stock_movements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  pharmacy_id: integer("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id, { onDelete: "cascade" }),
  medicine_id: integer("medicine_id")
    .notNull()
    .references(() => medicines.id, { onDelete: "cascade" }),
  movement_type: stockMovementTypeEnum("movement_type").notNull(),
  quantity: integer("quantity").notNull(),
  previous_stock: integer("previous_stock").notNull(),
  new_stock: integer("new_stock").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }),
  total_value: decimal("total_value", { precision: 10, scale: 2 }),
  reference_id: integer("reference_id"), // Can reference order_id, transfer_id, etc.
  reference_type: varchar("reference_type", { length: 50 }), // 'order', 'transfer', 'adjustment', etc.
  notes: text("notes"),
  performed_by: integer("performed_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  pharmacy_staff: many(pharmacy_staff),
  orders: many(orders, { relationName: "user_orders" }),
  delivery_orders: many(orders, { relationName: "delivery_person_orders" }),
  prescriptions: many(prescriptions),
  messages_sent: many(messages, { relationName: "sender_messages" }),
  messages_received: many(messages, { relationName: "receiver_messages" }),
  reminders: many(reminders),
  delivery_tracking: many(delivery_tracking),
  stock_movements: many(stock_movements),
}));

export const pharmaciesRelations = relations(pharmacies, ({ many }) => ({
  pharmacy_staff: many(pharmacy_staff),
  pharmacy_medicines: many(pharmacy_medicines),
  orders: many(orders),
  supplier_orders: many(supplier_orders),
  stock_movements: many(stock_movements),
}));

export const medicinesRelations = relations(medicines, ({ many }) => ({
  pharmacy_medicines: many(pharmacy_medicines),
  order_items: many(order_items),
  supplier_order_items: many(supplier_order_items),
  stock_movements: many(stock_movements),
  reminders: many(reminders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.user_id],
    references: [users.id],
    relationName: "user_orders",
  }),
  pharmacy: one(pharmacies, {
    fields: [orders.pharmacy_id],
    references: [pharmacies.id],
  }),
  delivery_person: one(users, {
    fields: [orders.delivery_person_id],
    references: [users.id],
    relationName: "delivery_person_orders",
  }),
  order_items: many(order_items),
  prescriptions: many(prescriptions),
  messages: many(messages),
  delivery_tracking: many(delivery_tracking),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  user: one(users, {
    fields: [prescriptions.user_id],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [prescriptions.verified_by],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [prescriptions.order_id],
    references: [orders.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.sender_id],
    references: [users.id],
    relationName: "sender_messages",
  }),
  receiver: one(users, {
    fields: [messages.receiver_id],
    references: [users.id],
    relationName: "receiver_messages",
  }),
  order: one(orders, {
    fields: [messages.order_id],
    references: [orders.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.user_id],
    references: [users.id],
  }),
  medicine: one(medicines, {
    fields: [reminders.medicine_id],
    references: [medicines.id],
  }),
}));

export const supplierOrdersRelations = relations(supplier_orders, ({ one, many }) => ({
  pharmacy: one(pharmacies, {
    fields: [supplier_orders.pharmacy_id],
    references: [pharmacies.id],
  }),
  supplier_order_items: many(supplier_order_items),
}));

export const deliveryTrackingRelations = relations(delivery_tracking, ({ one }) => ({
  order: one(orders, {
    fields: [delivery_tracking.order_id],
    references: [orders.id],
  }),
  delivery_person: one(users, {
    fields: [delivery_tracking.delivery_person_id],
    references: [users.id],
  }),
}));

export const stockMovementsRelations = relations(stock_movements, ({ one }) => ({
  pharmacy: one(pharmacies, {
    fields: [stock_movements.pharmacy_id],
    references: [pharmacies.id],
  }),
  medicine: one(medicines, {
    fields: [stock_movements.medicine_id],
    references: [medicines.id],
  }),
  performed_by_user: one(users, {
    fields: [stock_movements.performed_by],
    references: [users.id],
  }),
}));

// Define types based on schema
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = typeof pharmacies.$inferInsert;

export type PharmacyMedicine = typeof pharmacy_medicines.$inferSelect;
export type InsertPharmacyMedicine = typeof pharmacy_medicines.$inferInsert;

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = typeof medicines.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type OrderItem = typeof order_items.$inferSelect;
export type InsertOrderItem = typeof order_items.$inferInsert;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

export type SupplierOrder = typeof supplier_orders.$inferSelect;
export type InsertSupplierOrder = typeof supplier_orders.$inferInsert;

export type SupplierOrderItem = typeof supplier_order_items.$inferSelect;
export type InsertSupplierOrderItem = typeof supplier_order_items.$inferInsert;

export type SystemLog = typeof system_logs.$inferSelect;
export type InsertSystemLog = typeof system_logs.$inferInsert;

export type AiSetting = typeof ai_settings.$inferSelect;
export type InsertAiSetting = typeof ai_settings.$inferInsert;

export type DeliveryTracking = typeof delivery_tracking.$inferSelect;
export type InsertDeliveryTracking = typeof delivery_tracking.$inferInsert;

export type StockMovement = typeof stock_movements.$inferSelect;
export type InsertStockMovement = typeof stock_movements.$inferInsert;