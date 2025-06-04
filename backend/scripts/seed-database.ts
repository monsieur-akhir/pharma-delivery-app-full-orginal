// @ts-nocheck
import 'dotenv/config';
import { DatabaseService } from '../src/database/database.service';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import {
  users,
  pharmacies,
  medicines,
  pharmacy_staff,
  pharmacy_medicines,
  orders,
  order_items,
  prescriptions,
  messages,
  reminders,
  permissions,
  role_permissions,
  supplier_orders,
  supplier_order_items,
  system_logs,
  ai_settings,
  delivery_tracking
} from '../../shared/src/schema';

// Configuration
const NUM_ADMINS = 3;
const NUM_PHARMACY_STAFF = 15;
const NUM_PHARMACISTS = 10;
const NUM_DELIVERY_PERSONS = 8;
const NUM_CUSTOMERS = 30;
const NUM_PHARMACIES = 10;
const NUM_MEDICINES = 50;
const NUM_ORDERS = 40;
const NUM_PRESCRIPTIONS = 15;
const NUM_MESSAGES = 60;
const NUM_REMINDERS = 20;

async function main() {
  console.log('🌱 Starting database seeding...');

  // Initialize database service and get Drizzle ORM client
  const configService = new ConfigService();
  const dbService = new DatabaseService(configService);
  const db = dbService.db;

  console.log('✓ Database connection established');

  // Remove manual schema patch SQL blocks (handled by migrations)

  // Synchronize schema to ensure all tables exist
  console.log("Creating tables if they don't exist...");

  // Ensure order_number column exists in orders table
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number varchar(20) UNIQUE NOT NULL;`);
  // Ensure optional order columns exist to match schema
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_coordinates json;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_person_id integer;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS expected_delivery_time timestamp;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_time timestamp;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'CARD';`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'PENDING';`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id text;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_reference text;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider text;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_phone varchar(20);`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_date timestamp;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating integer;`);
  await dbService.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_comment text;`);

  // Ensure messages table matches schema
  await dbService.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id integer;`);
  await dbService.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;`);
  await dbService.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS order_id integer;`);
  await dbService.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url text;`);

  // Ensure reminders table matches schema
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';`);
  await dbService.query(`ALTER TABLE reminders ALTER COLUMN title SET DEFAULT '';`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS medicine_name text NOT NULL;`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS dosage text;`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS schedule json NOT NULL;`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS start_date timestamp NOT NULL;`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS end_date timestamp;`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS last_taken timestamp;`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS next_reminder timestamp;`);
  await dbService.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS medicine_id integer;`);

  try {
    console.log('Clearing existing data...');
    await db.delete(reminders);
    await db.delete(messages);
    await db.delete(delivery_tracking);
    await db.delete(order_items);
    await db.delete(supplier_order_items);
    await db.delete(prescriptions);
    await db.delete(supplier_orders);
    await db.delete(orders);
    await db.delete(pharmacy_medicines);
    await db.delete(pharmacy_staff);
    await db.delete(medicines);
    await db.delete(pharmacies);
    await db.delete(role_permissions);
    await db.delete(permissions);
    await db.delete(system_logs);
    await db.delete(ai_settings);
    await db.delete(users);
    console.log('✓ Existing data cleared');

    // Create Permissions & Roles
    console.log('Creating permissions and roles...');
    const allPermissions = await createPermissions(db);
    const allRoles = await createRoles(db, allPermissions);
    console.log('✓ Permissions and roles created');

    // Create Users with different roles
    console.log('Creating users...');
    const allUsers = await createUsers(db);
    console.log(`✓ ${allUsers.length} users created`);

    // Create Pharmacies
    console.log('Creating pharmacies...');
    const allPharmacies = await createPharmacies(db, allUsers);
    console.log(`✓ ${allPharmacies.length} pharmacies created`);

    // Assign pharmacy staff
    console.log('Assigning pharmacy staff...');
    await assignPharmacyStaff(db, allUsers, allPharmacies);
    console.log('✓ Pharmacy staff assigned');

    // Create Medicines and associate with pharmacies
    console.log('Creating medicines and inventory...');
    const allMedicines = await createMedicines(db);
    await createPharmacyMedicines(db, allPharmacies, allMedicines);
    console.log(`✓ ${allMedicines.length} medicines created and inventory set up`);

    // Create Orders and OrderItems
    console.log('Creating orders...');
    const allOrders = await createOrders(db, allUsers, allPharmacies);
    await createOrderItems(db, allOrders, allMedicines);
    console.log(`✓ ${allOrders.length} orders created with items`);

    // Create Prescriptions
    console.log('Creating prescriptions...');
    await createPrescriptions(db, allUsers, allOrders);
    console.log('✓ Prescriptions created');

    // Create Messages
    console.log('Creating messages...');
    await createMessages(db, allUsers, allOrders);
    console.log('✓ Messages created');

    // Create Reminders
    console.log('Creating medication reminders...');
    await createReminders(db, allUsers, allMedicines);
    console.log('✓ Medication reminders created');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await dbService.onModuleDestroy();
  }
}

// Helper function to create permissions
async function createPermissions(db) {
  const permissionsList = [
    { name: 'view_users', description: 'Can view users' },
    { name: 'create_users', description: 'Can create users' },
    { name: 'edit_users', description: 'Can edit users' },
    { name: 'delete_users', description: 'Can delete users' },
    { name: 'view_pharmacies', description: 'Can view pharmacies' },
    { name: 'create_pharmacies', description: 'Can create pharmacies' },
    { name: 'edit_pharmacies', description: 'Can edit pharmacies' },
    { name: 'delete_pharmacies', description: 'Can delete pharmacies' },
    { name: 'view_orders', description: 'Can view orders' },
    { name: 'create_orders', description: 'Can create orders' },
    { name: 'edit_orders', description: 'Can edit orders' },
    { name: 'delete_orders', description: 'Can delete orders' },
    { name: 'view_medicines', description: 'Can view medicines' },
    { name: 'create_medicines', description: 'Can create medicines' },
    { name: 'edit_medicines', description: 'Can edit medicines' },
    { name: 'delete_medicines', description: 'Can delete medicines' },
    { name: 'verify_prescriptions', description: 'Can verify prescriptions' },
    { name: 'manage_delivery', description: 'Can manage delivery' },
    { name: 'view_analytics', description: 'Can view analytics' },
    { name: 'manage_system', description: 'Can manage system settings' },
  ];

  const createdPermissions = [];
  for (const perm of permissionsList) {
    // Derive category from permission name (e.g., 'view_users' -> 'users')
    const category = perm.name.split('_')[1] || 'general';
    const [result] = await db.insert(permissions)
      .values({ name: perm.name, description: perm.description, category })
      .returning();
    createdPermissions.push(result);
  }

  return createdPermissions;
}

// Helper function to create roles and assign permissions
async function createRoles(db, allPermissions) {
  const roleNames = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'PHARMACY_STAFF', 'DELIVERY_PERSON', 'CUSTOMER'];
  for (const roleName of roleNames) {
    let permissionsToAssign: number[] = [];
    switch (roleName) {
      case 'SUPER_ADMIN':
        permissionsToAssign = allPermissions.map(p => p.id);
        break;
      case 'ADMIN':
        permissionsToAssign = allPermissions
          .filter(p => !p.name.includes('delete_') && p.name !== 'manage_system')
          .map(p => p.id);
        break;
      case 'PHARMACIST':
        permissionsToAssign = allPermissions
          .filter(p => ['view_orders','edit_orders','view_medicines','edit_medicines','verify_prescriptions'].includes(p.name))
          .map(p => p.id);
        break;
      case 'PHARMACY_STAFF':
        permissionsToAssign = allPermissions
          .filter(p => ['view_orders','view_medicines','edit_medicines'].includes(p.name))
          .map(p => p.id);
        break;
      case 'DELIVERY_PERSON':
        permissionsToAssign = allPermissions
          .filter(p => ['view_orders','manage_delivery'].includes(p.name))
          .map(p => p.id);
        break;
      case 'CUSTOMER':
        permissionsToAssign = allPermissions
          .filter(p => ['view_medicines','create_orders','view_orders'].includes(p.name))
          .map(p => p.id);
        break;
    }
    for (const permId of permissionsToAssign) {
      await db.insert(role_permissions).values({ role: roleName, permission_id: permId });
    }
  }
  return roleNames;
}

// Helper function to create users
async function createUsers(db) {
  const users_array = [];

  // Create Super Admin
  const hashedAdminPassword = await bcrypt.hash('Admin123', 10);
  const [superAdmin] = await db.insert(users)
    .values({
      username: 'super_admin',
      email: 'super.admin-pharma-delivery@yopmail.com',
      phone: '0000000000',
      role: 'SUPER_ADMIN',
      first_name: 'Super',
      last_name: 'Admin',
      password_hash: hashedAdminPassword,
      is_active: true
    })
    .returning();
  users_array.push(superAdmin);

  // Create regular admin users
  for (let i = 0; i < NUM_ADMINS; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [admin] = await db.insert(users)
      .values({
        username: `admin_${i+1}`,
        email: `admin${i+1}@pharma-delivery.com`,
        phone: faker.phone.number({ format: '06########' }),
        role: 'ADMIN',
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        password_hash: hashedPassword,
        is_active: true
      })
      .returning();
    users_array.push(admin);
  }

  // Create pharmacy staff
  for (let i = 0; i < NUM_PHARMACY_STAFF; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [staff] = await db.insert(users)
      .values({
        username: `pharm_staff_${i+1}`,
        email: `staff${i+1}@pharma-delivery.com`,
        phone: faker.phone.number({ format: '05########' }),
        role: 'PHARMACY_STAFF',
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        password_hash: hashedPassword,
        is_active: faker.helpers.arrayElement([true, true, true, false]) // 25% chance inactive
      })
      .returning();
    users_array.push(staff);
  }

  // Create pharmacists
  for (let i = 0; i < NUM_PHARMACISTS; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [pharmacist] = await db.insert(users)
      .values({
        username: `pharmacist_${i+1}`,
        email: `pharmacist${i+1}@pharma-delivery.com`,
        phone: faker.phone.number({ format: '05########' }),
        role: 'PHARMACIST',
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        password_hash: hashedPassword,
        address: faker.location.streetAddress(),
        is_active: true
      })
      .returning();
    users_array.push(pharmacist);
  }

  // Create delivery persons
  for (let i = 0; i < NUM_DELIVERY_PERSONS; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [delivery] = await db.insert(users)
      .values({
        username: `delivery_${i+1}`,
        email: `delivery${i+1}@pharma-delivery.com`,
        phone: faker.phone.number({ format: '05########' }),
        role: 'DELIVERY_PERSON',
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        password_hash: hashedPassword,
        is_active: faker.helpers.arrayElement([true, true, true, false]) // 25% chance inactive
      })
      .returning();
    users_array.push(delivery);
  }

  // Create customers
  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const [customer] = await db.insert(users)
      .values({
        username: `customer_${i+1}`,
        email: `customer${i+1}@example.com`,
        phone: faker.phone.number(),
        role: 'CUSTOMER',
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        address: faker.location.streetAddress(),
        location: { lat: parseFloat(faker.location.latitude()), lng: parseFloat(faker.location.longitude()) },
        password_hash: hashedPassword,
        is_active: faker.helpers.arrayElement([true, true, true, true, false]) // 20% chance inactive
      })
      .returning();
    users_array.push(customer);
  }

  return users_array;
}

// Helper function to create pharmacies
async function createPharmacies(db, allUsers) {
  const pharmacies_array = [];

  const adminUsers = allUsers.filter(
    user => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  );

  for (let i = 0; i < NUM_PHARMACIES; i++) {
    const is24Hours = faker.helpers.arrayElement([true, false, false, false, false]);
    const verifiedByAdmin = faker.helpers.arrayElement(adminUsers);

    const [pharmacy] = await db.insert(pharmacies)
      .values({
        name: `${faker.company.name()} Pharmacy`,
        address: faker.location.streetAddress(),
        location: { lat: parseFloat(faker.location.latitude()), lng: parseFloat(faker.location.longitude()) },
        phone: faker.phone.number('05########'),
        email: faker.internet.email(),
        license_number: `LIC-${faker.string.alphanumeric(8).toUpperCase()}`,
        is_verified: faker.helpers.arrayElement([true, true, true, false]), // 25% chance not verified
        opening_hours: is24Hours ? { is24Hours: true } : {
          monday: { open: '08:00', close: '20:00' },
          tuesday: { open: '08:00', close: '20:00' },
          wednesday: { open: '08:00', close: '20:00' },
          thursday: { open: '08:00', close: '20:00' },
          friday: { open: '08:00', close: '20:00' },
          saturday: { open: '09:00', close: '18:00' },
          sunday: { open: '10:00', close: '16:00' }
        },
        rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
        is_active: faker.helpers.arrayElement([true, true, true, false]), // 25% chance inactive
        website: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.7 }),
        is_24_hours: is24Hours,
        status: faker.helpers.arrayElement(['APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'REJECTED']),
        verified_by: verifiedByAdmin.id,
        verified_at: faker.date.recent({ days: 30 })
      })
      .returning();
    pharmacies_array.push(pharmacy);
  }

  return pharmacies_array;
}

// Helper function to assign pharmacy staff to pharmacies
async function assignPharmacyStaff(db, allUsers, allPharmacies) {
  const pharmacists = allUsers.filter(user => user.role === 'PHARMACIST');
  const pharmacyStaff = allUsers.filter(user => user.role === 'PHARMACY_STAFF');

  // Every pharmacy needs at least one pharmacist and some staff
  for (const pharmacy of allPharmacies) {
    // Assign 1-2 pharmacists per pharmacy
    const numPharmacists = faker.number.int({ min: 1, max: 2 });
    const assignedPharmacists = faker.helpers.arrayElements(pharmacists, numPharmacists);

    for (const pharmacist of assignedPharmacists) {
      await db.insert(pharmacy_staff)
        .values({
          pharmacy_id: pharmacy.id,
          user_id: pharmacist.id,
          role: 'PHARMACIST',
          position: faker.helpers.arrayElement(['Head Pharmacist', 'Staff Pharmacist', 'Clinical Pharmacist'])
        });
    }

    // Assign 1-3 staff members per pharmacy
    const numStaff = faker.number.int({ min: 1, max: 3 });
    const assignedStaff = faker.helpers.arrayElements(pharmacyStaff, numStaff);

    for (const staff of assignedStaff) {
      await db.insert(pharmacy_staff)
        .values({
          pharmacy_id: pharmacy.id,
          user_id: staff.id,
          role: 'STAFF',
          position: faker.helpers.arrayElement(['Pharmacy Technician', 'Cashier', 'Assistant', 'Intern'])
        });
    }
  }
}

// Helper function to create medicines
async function createMedicines(db) {
  const medicines_array = [];

  const medicineCategories = [
    'Antibiotics', 'Pain Relief', 'Cardiovascular', 'Respiratory',
    'Gastrointestinal', 'Dermatological', 'Neurological', 'Endocrine',
    'Allergy', 'Vitamins & Supplements', 'First Aid', 'Eye Care'
  ];

  const manufacturers = [
    'Pfizer', 'Johnson & Johnson', 'Novartis', 'Roche', 'Merck',
    'AstraZeneca', 'Sanofi', 'GlaxoSmithKline', 'Bayer', 'Eli Lilly',
    'Amgen', 'Bristol-Myers Squibb', 'Gilead Sciences', 'Biogen',
    'Abbott Laboratories', 'Novo Nordisk'
  ];

  const commonMedicines = [
    { name: 'Paracetamol 500mg', generic: 'Acetaminophen', prescription: false, category: 'Pain Relief' },
    { name: 'Ibuprofène 400mg', generic: 'Ibuprofen', prescription: false, category: 'Pain Relief' },
    { name: 'Amoxicilline 250mg', generic: 'Amoxicillin', prescription: true, category: 'Antibiotics' },
    { name: 'Doliprane 1000mg', generic: 'Paracetamol', prescription: false, category: 'Pain Relief' },
    { name: 'Efferalgan 500mg', generic: 'Paracetamol', prescription: false, category: 'Pain Relief' },
    { name: 'Smecta', generic: 'Diosmectite', prescription: false, category: 'Gastrointestinal' },
    { name: 'Ventoline Inhalateur', generic: 'Salbutamol', prescription: true, category: 'Respiratory' },
    { name: 'Bisoprolol 5mg', generic: 'Bisoprolol', prescription: true, category: 'Cardiovascular' },
    { name: 'Fluoxétine 20mg', generic: 'Fluoxetine', prescription: true, category: 'Neurological' },
    { name: 'Insuline Lantus', generic: 'Insulin Glargine', prescription: true, category: 'Endocrine' },
  ];

  // First add common medicines
  for (const med of commonMedicines) {
    const [medicine] = await db.insert(medicines)
      .values({
        name: med.name,
        generic_name: med.generic,
        description: `Standard ${med.generic} medication for ${med.category.toLowerCase()} conditions`,
        price: faker.commerce.price({ min: 4, max: 50 }),
        requires_prescription: med.prescription,
        category: med.category,
        manufacturer: faker.helpers.arrayElement(manufacturers),
        image_url: faker.helpers.maybe(() => faker.image.url(), { probability: 0.7 }),
        in_stock: true,
        stock_quantity: faker.number.int({ min: 50, max: 500 })
      })
      .returning();
    medicines_array.push(medicine);
  }

  // Then add random medicines to reach NUM_MEDICINES
  const remaining = NUM_MEDICINES - commonMedicines.length;
  for (let i = 0; i < remaining; i++) {
    const requiresPrescription = faker.helpers.arrayElement([true, false, false, false]);
    const category = faker.helpers.arrayElement(medicineCategories);

    const [medicine] = await db.insert(medicines)
      .values({
        name: `${faker.science.chemicalElement().name} ${faker.number.int({ min: 50, max: 1000 })}mg`,
        generic_name: faker.science.chemicalElement().symbol,
        description: faker.lorem.paragraph(),
        price: faker.commerce.price({ min: 5, max: 200 }),
        requires_prescription: requiresPrescription,
        category: category,
        manufacturer: faker.helpers.arrayElement(manufacturers),
        image_url: faker.helpers.maybe(() => faker.image.url(), { probability: 0.7 }),
        in_stock: faker.helpers.arrayElement([true, true, true, false]), // 25% chance out of stock
        stock_quantity: faker.number.int({ min: 0, max: 300 })
      })
      .returning();
    medicines_array.push(medicine);
  }

  return medicines_array;
}

// Helper function to associate medicines with pharmacies and set inventory levels
async function createPharmacyMedicines(db, allPharmacies, allMedicines) {
  for (const pharmacy of allPharmacies) {
    // Each pharmacy carries 70-90% of all medicines
    const numMedicines = Math.floor(allMedicines.length * faker.number.float({ min: 0.7, max: 0.9 }));
    const selectedMedicines = faker.helpers.arrayElements(allMedicines, numMedicines);

    for (const medicine of selectedMedicines) {
      const basePrice = parseFloat(medicine.price);
      const markup = faker.number.float({ min: 1, max: 1.4 });
      const pharmacyPrice = (basePrice * markup).toFixed(2);

      const lowStock = faker.helpers.arrayElement([true, false, false, false, false]); // 20% chance of low stock
      const stockLevel = lowStock
        ? faker.number.int({ min: 0, max: 10 })
        : faker.number.int({ min: 20, max: 500 });

      await db.insert(pharmacy_medicines)
        .values({
          pharmacy_id: pharmacy.id,
          medicine_id: medicine.id,
          price: pharmacyPrice,
          stock: stockLevel,
          reorder_threshold: faker.number.int({ min: 5, max: 20 }),
          optimal_stock: faker.number.int({ min: 30, max: 100 })
        });
    }
  }
}

// Helper function to create orders
async function createOrders(db, allUsers, allPharmacies) {
  const orders_array = [];

  // Filter only customer users
  const customers = allUsers.filter(user => user.role === 'CUSTOMER');
  const deliveryPersons = allUsers.filter(user => user.role === 'DELIVERY_PERSON');

  // Create random dates within the last 60 days
  const getRandomDate = () => {
    return faker.date.recent({ days: 60 });
  };

  for (let i = 0; i < NUM_ORDERS; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const pharmacy = faker.helpers.arrayElement(allPharmacies);

    // Determine order status
    const statusOptions = [
      { status: 'PENDING', weight: 2 },
      { status: 'CONFIRMED', weight: 2 },
      { status: 'PROCESSING', weight: 3 },
      { status: 'READY_FOR_PICKUP', weight: 1 },
      { status: 'OUT_FOR_DELIVERY', weight: 2 },
      { status: 'DELIVERED', weight: 5 },
      { status: 'CANCELLED', weight: 1 }
    ];

    const totalWeight = statusOptions.reduce((acc, option) => acc + option.weight, 0);
    let random = faker.number.int({ min: 1, max: totalWeight });
    let status;

    for (const option of statusOptions) {
      random -= option.weight;
      if (random <= 0) {
        status = option.status;
        break;
      }
    }

    // Assign a delivery person for relevant statuses
    const deliveryPersonId = ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)
      ? faker.helpers.arrayElement(deliveryPersons).id
      : null;

    // Generate appropriate dates based on status
    const createdAt = getRandomDate();
    let expectedDeliveryTime: Date | null = null;
    let actualDeliveryTime: Date | null = null;

    if (['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      expectedDeliveryTime = new Date(createdAt);
      expectedDeliveryTime.setHours(expectedDeliveryTime.getHours() + faker.number.int({ min: 1, max: 24 }));
    }

    if (status === 'DELIVERED') {
      actualDeliveryTime = new Date(expectedDeliveryTime);
      if (faker.helpers.arrayElement([true, true, false])) { // 67% on time
        actualDeliveryTime.setMinutes(actualDeliveryTime.getMinutes() + faker.number.int({ min: -30, max: 30 }));
      } else {
        actualDeliveryTime.setHours(actualDeliveryTime.getHours() + faker.number.int({ min: 1, max: 2 }));
      }
    }

    // Set payment status based on order status
    const paymentStatus = status === 'CANCELLED' ? 'CANCELLED' :
      status === 'DELIVERED' ? 'COMPLETED' :
      ['PENDING', 'CONFIRMED'].includes(status) ?
        faker.helpers.arrayElement(['PENDING', 'PENDING', 'PROCESSING']) : 'PROCESSING';

    // Generate order number with format ORD-YYYYMMDD-XXXX
    const orderDate = new Date(createdAt).toISOString().split('T')[0].replace(/-/g, '');
    const orderNumber = `ORD-${orderDate}-${faker.string.numeric(4)}`;

    const totalAmount = faker.commerce.price({ min: 15, max: 300 });

    const [order] = await db.insert(orders)
      .values({
        order_number: orderNumber.slice(0, 20),
        user_id: customer.id,
        pharmacy_id: pharmacy.id,
        status: status,
        total_amount: totalAmount,
        delivery_address: customer.address || faker.location.streetAddress(),
        delivery_coordinates: customer.location || { lat: parseFloat(faker.location.latitude()), lng: parseFloat(faker.location.longitude()) },
        created_at: createdAt,
        updated_at: createdAt,
        delivery_person_id: deliveryPersonId,
        expected_delivery_time: expectedDeliveryTime,
        actual_delivery_time: actualDeliveryTime,
        payment_method: faker.helpers.arrayElement(['CARD', 'CASH', 'MOBILE_MONEY']),
        payment_status: paymentStatus,
        payment_intent_id: faker.helpers.maybe(() => `pi_${faker.string.alphanumeric(24)}`, { probability: 0.7 }),
        transaction_reference: faker.helpers.maybe(() => `TX${faker.string.alphanumeric(10)}`, { probability: 0.8 }),
        payment_provider: faker.helpers.arrayElement(['STRIPE', 'PAYPAL', 'ORANGE_MONEY', 'CASH']),
        payment_phone: faker.helpers.maybe(() => faker.phone.number().slice(0, 20), { probability: 0.5 }),
        payment_date: status === 'DELIVERED' ? actualDeliveryTime : null,
        rating: status === 'DELIVERED' ? faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }), { probability: 0.6 }) : null,
        review_comment: status === 'DELIVERED' ? faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }) : null
      })
      .returning();

    orders_array.push(order);
  }

  return orders_array;
}

// Helper function to create order items
async function createOrderItems(db, allOrders, allMedicines) {
  for (const order of allOrders) {
    // Each order has between 1 and 5 items
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const selectedMedicines = faker.helpers.arrayElements(allMedicines, itemCount);

    for (const medicine of selectedMedicines) {
      const quantity = faker.number.int({ min: 1, max: 5 });
      const unitPrice = parseFloat(medicine.price);
      const totalPrice = (unitPrice * quantity).toFixed(2);

      await db.insert(order_items)
        .values({
          order_id: order.id,
          medicine_id: medicine.id,
          quantity: quantity,
          unit_price: unitPrice.toString(),
          total_price: totalPrice
        });
    }
  }
}

// Helper function to create prescriptions
async function createPrescriptions(db, allUsers, allOrders) {
  const pharmacists = allUsers.filter(user => user.role === 'PHARMACIST');

  // Get orders that might have prescriptions (require prescription medicines)
  const ordersWithPrescription = allOrders.slice(0, NUM_PRESCRIPTIONS);

  for (let i = 0; i < NUM_PRESCRIPTIONS; i++) {
    const order = ordersWithPrescription[i];
    const user_id = order.user_id;

    // Determine if prescription is verified
    const isVerified = faker.helpers.arrayElement([true, true, false]);
    const verifiedBy = isVerified ? faker.helpers.arrayElement(pharmacists).id : null;
    const status = isVerified ?
      faker.helpers.arrayElement(['approved', 'approved', 'partial']) :
      faker.helpers.arrayElement(['pending', 'rejected']);

    await db.insert(prescriptions)
      .values({
        user_id: user_id,
        image_url: `https://storage.pharmadelivery.com/prescriptions/rx_${faker.string.alphanumeric(10)}.jpg`,
        ai_analysis: {
          confidence: faker.number.float({ min: 0.7, max: 0.98 }),
          detected_medicines: faker.helpers.arrayElements(
            ['Amoxicilline', 'Ibuprofène', 'Doliprane', 'Ventoline', 'Bisoprolol', 'Fluoxétine'],
            faker.number.int({ min: 1, max: 3 })
          ),
          issues: faker.helpers.maybe(() => ['Illegible handwriting', 'Missing dosage'], { probability: 0.3 })
        },
        status: status,
        verified_by: verifiedBy,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }),
        verified_at: isVerified ? faker.date.recent({ days: 10 }) : null,
        order_id: order.id
      });
  }
}

// Helper function to create messages
async function createMessages(db, allUsers, allOrders) {
  for (let i = 0; i < NUM_MESSAGES; i++) {
    // 80% of messages are related to orders, 20% are direct user-to-user
    const isOrderRelated = faker.helpers.arrayElement([true, true, true, true, false]);

    let order = null;
    let sender = null;
    let receiver = null;

    if (isOrderRelated) {
      order = faker.helpers.arrayElement(allOrders);

      // For order-related messages, sender could be customer or delivery person or pharmacy
      const senderOptions = [
        { role: 'CUSTOMER', id: order.user_id, weight: 4 },
        { role: 'DELIVERY_PERSON', id: order.delivery_person_id, weight: 2 },
        { role: 'ADMIN', weight: 1 }
      ].filter(option => option.id !== null || option.role === 'ADMIN');

      if (senderOptions.length === 1) {
        sender = allUsers.find(u => u.id === senderOptions[0].id) || faker.helpers.arrayElement(allUsers.filter(u => u.role === senderOptions[0].role));
      } else {
        const totalWeight = senderOptions.reduce((acc, option) => acc + option.weight, 0);
        let random = faker.number.int({ min: 1, max: totalWeight });

        for (const option of senderOptions) {
          random -= option.weight;
          if (random <= 0) {
            sender = option.id
              ? allUsers.find(u => u.id === option.id)
              : faker.helpers.arrayElement(allUsers.filter(u => u.role === option.role));
            break;
          }
        }
      }

      // Receiver is related to the order but not the sender
      if (sender.role === 'CUSTOMER') {
        // Customer sending to delivery person or admin
        receiver = order.delivery_person_id
          ? allUsers.find(u => u.id === order.delivery_person_id)
          : faker.helpers.arrayElement(allUsers.filter(u => u.role === 'ADMIN'));
      } else if (sender.role === 'DELIVERY_PERSON') {
        // Delivery sending to customer
        receiver = allUsers.find(u => u.id === order.user_id);
      } else {
        // Admin sending to customer or delivery
        receiver = faker.helpers.arrayElement([
          allUsers.find(u => u.id === order.user_id),
          order.delivery_person_id ? allUsers.find(u => u.id === order.delivery_person_id) : null
        ].filter(Boolean));
      }
    } else {
      // Direct user-to-user messages
      sender = faker.helpers.arrayElement(allUsers);

      // Don't send messages to self
      receiver = faker.helpers.arrayElement(
        allUsers.filter(u => u.id !== sender.id)
      );
    }

    if (!sender || !receiver) continue;

    const createdAt = isOrderRelated
      ? new Date(order.created_at)
      : faker.date.recent({ days: 30 });

    // If order related, time should be after order creation
    if (isOrderRelated) {
      createdAt.setMinutes(createdAt.getMinutes() + faker.number.int({ min: 10, max: 1440 }));
    }

    await db.insert(messages)
      .values({
        sender_id: sender.id,
        receiver_id: receiver.id,
        content: faker.lorem.paragraph(),
        is_read: faker.helpers.arrayElement([true, true, false]),
        created_at: createdAt,
        order_id: isOrderRelated ? order.id : null,
        attachment_url: faker.helpers.maybe(() => faker.image.url(), { probability: 0.2 })
      });
  }
}

// Helper function to create medication reminders
async function createReminders(db, allUsers, allMedicines) {
  const customers = allUsers.filter(user => user.role === 'CUSTOMER');

  for (let i = 0; i < NUM_REMINDERS; i++) {
    const user = faker.helpers.arrayElement(customers);
    const medicine = faker.helpers.arrayElement(allMedicines);

    const startDate = faker.date.recent({ days: 14 });
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + faker.number.int({ min: 7, max: 90 }));

    // Generate a randomized schedule
    const scheduleType = faker.helpers.arrayElement(['daily', 'weekly', 'specific_days']);
    let schedule;

    switch (scheduleType) {
      case 'daily':
        schedule = {
          type: 'daily',
          times: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
            `${faker.number.int({ min: 6, max: 23 }).toString().padStart(2, '0')}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}`
          )
        };
        break;
      case 'weekly':
        schedule = {
          type: 'weekly',
          days: faker.helpers.arrayElements(
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            faker.number.int({ min: 1, max: 3 })
          ),
          time: `${faker.number.int({ min: 6, max: 23 }).toString().padStart(2, '0')}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}`
        };
        break;
      case 'specific_days':
        schedule = {
          type: 'specific_days',
          dates: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + faker.number.int({ min: 1, max: 28 }));
            return date.toISOString().split('T')[0];
          }),
          time: `${faker.number.int({ min: 6, max: 23 }).toString().padStart(2, '0')}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}`
        };
        break;
    }

    const lastTaken = faker.helpers.maybe(() => {
      const date = faker.date.between({ from: startDate, to: new Date() });
      return date > new Date() ? null : date;
    }, { probability: 0.7 });

    const nextReminder = new Date();
    nextReminder.setHours(nextReminder.getHours() + faker.number.int({ min: 1, max: 24 }));

    await db.insert(reminders)
      .values({
        title: medicine.name,
        user_id: user.id,
        medicine_name: medicine.name,
        medicine_id: medicine.id,
        dosage: `${faker.number.int({ min: 1, max: 3 })} ${faker.helpers.arrayElement(['pill', 'tablet', 'capsule', 'ml'])}`,
        schedule: schedule,
        start_date: startDate,
        end_date: faker.helpers.arrayElement([endDate, null]),
        is_active: faker.helpers.arrayElement([true, true, true, false]),
        last_taken: lastTaken,
        next_reminder: nextReminder
      });
  }
}

// Run the script
main().catch(console.error);
