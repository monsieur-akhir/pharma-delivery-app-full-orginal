"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryTrackingRelations = exports.supplierOrdersRelations = exports.remindersRelations = exports.messagesRelations = exports.prescriptionsRelations = exports.ordersRelations = exports.medicinesRelations = exports.pharmaciesRelations = exports.usersRelations = exports.delivery_tracking = exports.ai_settings = exports.system_logs = exports.supplier_order_items = exports.supplier_orders = exports.reminders = exports.messages = exports.prescriptions = exports.order_items = exports.orders = exports.pharmacy_medicines = exports.pharmacy_staff = exports.medicines = exports.pharmacies = exports.users = exports.pharmacyStatusEnum = exports.orderStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.userRoleEnum = (0, pg_core_1.pgEnum)("user_role", [
    "CUSTOMER",
    "ADMIN",
    "PHARMACY_STAFF",
    "PHARMACIST",
    "DELIVERY_PERSON",
]);
exports.orderStatusEnum = (0, pg_core_1.pgEnum)("order_status", [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
]);
exports.pharmacyStatusEnum = (0, pg_core_1.pgEnum)("pharmacy_status", [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "PENDING_INFO",
]);
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    email: (0, pg_core_1.text)("email").unique(),
    phone: (0, pg_core_1.text)("phone").notNull().unique(),
    role: (0, exports.userRoleEnum)("role").notNull().default("CUSTOMER"),
    address: (0, pg_core_1.text)("address"),
    location: (0, pg_core_1.json)("location").$type(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    is_active: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    profile_image: (0, pg_core_1.text)("profile_image"),
    password_hash: (0, pg_core_1.text)("password_hash"),
    first_name: (0, pg_core_1.text)("first_name"),
    last_name: (0, pg_core_1.text)("last_name"),
    last_login: (0, pg_core_1.timestamp)("last_login"),
    stripe_customer_id: (0, pg_core_1.text)("stripe_customer_id"),
    stripe_subscription_id: (0, pg_core_1.text)("stripe_subscription_id"),
});
exports.pharmacies = (0, pg_core_1.pgTable)("pharmacies", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    address: (0, pg_core_1.text)("address").notNull(),
    location: (0, pg_core_1.json)("location").$type().notNull(),
    phone: (0, pg_core_1.text)("phone").notNull(),
    email: (0, pg_core_1.text)("email"),
    license_number: (0, pg_core_1.text)("license_number").notNull().unique(),
    is_verified: (0, pg_core_1.boolean)("is_verified").default(false).notNull(),
    opening_hours: (0, pg_core_1.json)("opening_hours"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    rating: (0, pg_core_1.decimal)("rating", { precision: 3, scale: 2 }).default("0.00"),
    is_active: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    logo_image: (0, pg_core_1.text)("logo_image"),
    website: (0, pg_core_1.text)("website"),
    is_24_hours: (0, pg_core_1.boolean)("is_24_hours").default(false),
    image_url: (0, pg_core_1.text)("image_url"),
    status: (0, exports.pharmacyStatusEnum)("status").default("PENDING").notNull(),
    rejection_reason: (0, pg_core_1.text)("rejection_reason"),
    additional_info_required: (0, pg_core_1.text)("additional_info_required"),
    verified_by: (0, pg_core_1.integer)("verified_by").references(() => exports.users.id, { onDelete: "set null" }),
    verified_at: (0, pg_core_1.timestamp)("verified_at"),
    reorder_threshold: (0, pg_core_1.integer)("reorder_threshold").default(10),
});
exports.medicines = (0, pg_core_1.pgTable)("medicines", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    generic_name: (0, pg_core_1.text)("generic_name"),
    description: (0, pg_core_1.text)("description"),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    requires_prescription: (0, pg_core_1.boolean)("requires_prescription").default(false).notNull(),
    category: (0, pg_core_1.text)("category"),
    manufacturer: (0, pg_core_1.text)("manufacturer"),
    image_url: (0, pg_core_1.text)("image_url"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    in_stock: (0, pg_core_1.boolean)("in_stock").default(true).notNull(),
    stock_quantity: (0, pg_core_1.integer)("stock_quantity").default(0).notNull(),
});
exports.pharmacy_staff = (0, pg_core_1.pgTable)("pharmacy_staff", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    pharmacy_id: (0, pg_core_1.integer)("pharmacy_id")
        .notNull()
        .references(() => exports.pharmacies.id, { onDelete: "cascade" }),
    user_id: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    role: (0, pg_core_1.text)("role").notNull().default("STAFF"),
    position: (0, pg_core_1.text)("position"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.pharmacy_medicines = (0, pg_core_1.pgTable)("pharmacy_medicines", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    pharmacy_id: (0, pg_core_1.integer)("pharmacy_id")
        .notNull()
        .references(() => exports.pharmacies.id, { onDelete: "cascade" }),
    medicine_id: (0, pg_core_1.integer)("medicine_id")
        .notNull()
        .references(() => exports.medicines.id, { onDelete: "cascade" }),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }),
    cost_price: (0, pg_core_1.decimal)("cost_price", { precision: 10, scale: 2 }),
    stock: (0, pg_core_1.integer)("stock").default(0).notNull(),
    reorder_threshold: (0, pg_core_1.integer)("reorder_threshold").default(5).notNull(),
    optimal_stock: (0, pg_core_1.integer)("optimal_stock"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    order_number: (0, pg_core_1.varchar)("order_number", { length: 20 }).unique().notNull(),
    user_id: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "restrict" }),
    pharmacy_id: (0, pg_core_1.integer)("pharmacy_id")
        .notNull()
        .references(() => exports.pharmacies.id, { onDelete: "restrict" }),
    status: (0, exports.orderStatusEnum)("status").default("PENDING").notNull(),
    total_amount: (0, pg_core_1.decimal)("total_amount", { precision: 10, scale: 2 }).notNull(),
    delivery_address: (0, pg_core_1.text)("delivery_address").notNull(),
    delivery_coordinates: (0, pg_core_1.json)("delivery_coordinates").$type(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    delivery_person_id: (0, pg_core_1.integer)("delivery_person_id").references(() => exports.users.id, {
        onDelete: "set null",
    }),
    expected_delivery_time: (0, pg_core_1.timestamp)("expected_delivery_time"),
    actual_delivery_time: (0, pg_core_1.timestamp)("actual_delivery_time"),
    payment_method: (0, pg_core_1.text)("payment_method").default("CARD").notNull(),
    payment_status: (0, pg_core_1.text)("payment_status").default("PENDING").notNull(),
    payment_intent_id: (0, pg_core_1.text)("payment_intent_id"),
    transaction_reference: (0, pg_core_1.text)("transaction_reference"),
    payment_provider: (0, pg_core_1.text)("payment_provider"),
    payment_phone: (0, pg_core_1.varchar)("payment_phone", { length: 20 }),
    payment_date: (0, pg_core_1.timestamp)("payment_date"),
    rating: (0, pg_core_1.integer)("rating"),
    review_comment: (0, pg_core_1.text)("review_comment"),
});
exports.order_items = (0, pg_core_1.pgTable)("order_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    order_id: (0, pg_core_1.integer)("order_id")
        .notNull()
        .references(() => exports.orders.id, { onDelete: "cascade" }),
    medicine_id: (0, pg_core_1.integer)("medicine_id")
        .notNull()
        .references(() => exports.medicines.id, { onDelete: "restrict" }),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    unit_price: (0, pg_core_1.decimal)("unit_price", { precision: 10, scale: 2 }).notNull(),
    total_price: (0, pg_core_1.decimal)("total_price", { precision: 10, scale: 2 }).notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.prescriptions = (0, pg_core_1.pgTable)("prescriptions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    image_url: (0, pg_core_1.text)("image_url").notNull(),
    ai_analysis: (0, pg_core_1.json)("ai_analysis"),
    status: (0, pg_core_1.text)("status").default("pending"),
    verified_by: (0, pg_core_1.integer)("verified_by").references(() => exports.users.id, { onDelete: "set null" }),
    notes: (0, pg_core_1.text)("notes"),
    verified_at: (0, pg_core_1.timestamp)("verified_at"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    order_id: (0, pg_core_1.integer)("order_id").references(() => exports.orders.id, { onDelete: "set null" }),
});
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    sender_id: (0, pg_core_1.integer)("sender_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    receiver_id: (0, pg_core_1.integer)("receiver_id").references(() => exports.users.id, { onDelete: "cascade" }),
    content: (0, pg_core_1.text)("content").notNull(),
    is_read: (0, pg_core_1.boolean)("is_read").default(false).notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    order_id: (0, pg_core_1.integer)("order_id").references(() => exports.orders.id, { onDelete: "cascade" }),
    attachment_url: (0, pg_core_1.text)("attachment_url"),
});
exports.reminders = (0, pg_core_1.pgTable)("reminders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    medicine_name: (0, pg_core_1.text)("medicine_name").notNull(),
    dosage: (0, pg_core_1.text)("dosage"),
    schedule: (0, pg_core_1.json)("schedule").notNull(),
    start_date: (0, pg_core_1.timestamp)("start_date").notNull(),
    end_date: (0, pg_core_1.timestamp)("end_date"),
    is_active: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    last_taken: (0, pg_core_1.timestamp)("last_taken"),
    next_reminder: (0, pg_core_1.timestamp)("next_reminder"),
    medicine_id: (0, pg_core_1.integer)("medicine_id").references(() => exports.medicines.id, { onDelete: "set null" }),
});
exports.supplier_orders = (0, pg_core_1.pgTable)("supplier_orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    pharmacy_id: (0, pg_core_1.integer)("pharmacy_id")
        .notNull()
        .references(() => exports.pharmacies.id, { onDelete: "restrict" }),
    total_amount: (0, pg_core_1.decimal)("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: (0, pg_core_1.text)("status").default("PENDING").notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    expected_delivery_date: (0, pg_core_1.timestamp)("expected_delivery_date"),
    actual_delivery_date: (0, pg_core_1.timestamp)("actual_delivery_date"),
    supplier_name: (0, pg_core_1.text)("supplier_name").notNull(),
});
exports.supplier_order_items = (0, pg_core_1.pgTable)("supplier_order_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    supplier_order_id: (0, pg_core_1.integer)("supplier_order_id")
        .notNull()
        .references(() => exports.supplier_orders.id, { onDelete: "cascade" }),
    medicine_id: (0, pg_core_1.integer)("medicine_id")
        .notNull()
        .references(() => exports.medicines.id, { onDelete: "restrict" }),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    unit_price: (0, pg_core_1.decimal)("unit_price", { precision: 10, scale: 2 }).notNull(),
    total_price: (0, pg_core_1.decimal)("total_price", { precision: 10, scale: 2 }).notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.system_logs = (0, pg_core_1.pgTable)("system_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    action: (0, pg_core_1.text)("action").notNull(),
    entity: (0, pg_core_1.text)("entity").notNull(),
    entity_id: (0, pg_core_1.integer)("entity_id"),
    user_id: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "set null" }),
    details: (0, pg_core_1.json)("details"),
    ip_address: (0, pg_core_1.text)("ip_address"),
    user_agent: (0, pg_core_1.text)("user_agent"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    level: (0, pg_core_1.text)("level").default("INFO").notNull(),
});
exports.ai_settings = (0, pg_core_1.pgTable)("ai_settings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    feature: (0, pg_core_1.text)("feature").unique().notNull(),
    is_enabled: (0, pg_core_1.boolean)("is_enabled").default(true).notNull(),
    configuration: (0, pg_core_1.json)("configuration"),
    last_updated_by: (0, pg_core_1.integer)("last_updated_by").references(() => exports.users.id, { onDelete: "set null" }),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.delivery_tracking = (0, pg_core_1.pgTable)("delivery_tracking", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    order_id: (0, pg_core_1.integer)("order_id")
        .notNull()
        .references(() => exports.orders.id, { onDelete: "cascade" }),
    delivery_person_id: (0, pg_core_1.integer)("delivery_person_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    current_location: (0, pg_core_1.json)("current_location").$type().notNull(),
    heading: (0, pg_core_1.integer)("heading"),
    speed: (0, pg_core_1.decimal)("speed", { precision: 5, scale: 2 }),
    accuracy: (0, pg_core_1.decimal)("accuracy", { precision: 5, scale: 2 }),
    timestamp: (0, pg_core_1.timestamp)("timestamp").defaultNow().notNull(),
    is_active: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    battery_level: (0, pg_core_1.decimal)("battery_level", { precision: 5, scale: 2 }),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    pharmacy_staff: many(exports.pharmacy_staff),
    orders: many(exports.orders, { relationName: "user_orders" }),
    delivery_orders: many(exports.orders, { relationName: "delivery_person_orders" }),
    prescriptions: many(exports.prescriptions),
    messages_sent: many(exports.messages, { relationName: "sender_messages" }),
    messages_received: many(exports.messages, { relationName: "receiver_messages" }),
    reminders: many(exports.reminders),
    delivery_tracking: many(exports.delivery_tracking),
}));
exports.pharmaciesRelations = (0, drizzle_orm_1.relations)(exports.pharmacies, ({ many }) => ({
    pharmacy_staff: many(exports.pharmacy_staff),
    pharmacy_medicines: many(exports.pharmacy_medicines),
    orders: many(exports.orders),
    supplier_orders: many(exports.supplier_orders),
}));
exports.medicinesRelations = (0, drizzle_orm_1.relations)(exports.medicines, ({ many }) => ({
    pharmacy_medicines: many(exports.pharmacy_medicines),
    order_items: many(exports.order_items),
    supplier_order_items: many(exports.supplier_order_items),
    reminders: many(exports.reminders),
}));
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.orders.user_id],
        references: [exports.users.id],
        relationName: "user_orders",
    }),
    pharmacy: one(exports.pharmacies, {
        fields: [exports.orders.pharmacy_id],
        references: [exports.pharmacies.id],
    }),
    delivery_person: one(exports.users, {
        fields: [exports.orders.delivery_person_id],
        references: [exports.users.id],
        relationName: "delivery_person_orders",
    }),
    order_items: many(exports.order_items),
    prescriptions: many(exports.prescriptions),
    messages: many(exports.messages),
    delivery_tracking: many(exports.delivery_tracking),
}));
exports.prescriptionsRelations = (0, drizzle_orm_1.relations)(exports.prescriptions, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.prescriptions.user_id],
        references: [exports.users.id],
    }),
    verifier: one(exports.users, {
        fields: [exports.prescriptions.verified_by],
        references: [exports.users.id],
    }),
    order: one(exports.orders, {
        fields: [exports.prescriptions.order_id],
        references: [exports.orders.id],
    }),
}));
exports.messagesRelations = (0, drizzle_orm_1.relations)(exports.messages, ({ one }) => ({
    sender: one(exports.users, {
        fields: [exports.messages.sender_id],
        references: [exports.users.id],
        relationName: "sender_messages",
    }),
    receiver: one(exports.users, {
        fields: [exports.messages.receiver_id],
        references: [exports.users.id],
        relationName: "receiver_messages",
    }),
    order: one(exports.orders, {
        fields: [exports.messages.order_id],
        references: [exports.orders.id],
    }),
}));
exports.remindersRelations = (0, drizzle_orm_1.relations)(exports.reminders, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.reminders.user_id],
        references: [exports.users.id],
    }),
    medicine: one(exports.medicines, {
        fields: [exports.reminders.medicine_id],
        references: [exports.medicines.id],
    }),
}));
exports.supplierOrdersRelations = (0, drizzle_orm_1.relations)(exports.supplier_orders, ({ one, many }) => ({
    pharmacy: one(exports.pharmacies, {
        fields: [exports.supplier_orders.pharmacy_id],
        references: [exports.pharmacies.id],
    }),
    supplier_order_items: many(exports.supplier_order_items),
}));
exports.deliveryTrackingRelations = (0, drizzle_orm_1.relations)(exports.delivery_tracking, ({ one }) => ({
    order: one(exports.orders, {
        fields: [exports.delivery_tracking.order_id],
        references: [exports.orders.id],
    }),
    delivery_person: one(exports.users, {
        fields: [exports.delivery_tracking.delivery_person_id],
        references: [exports.users.id],
    }),
}));
//# sourceMappingURL=schema.js.map