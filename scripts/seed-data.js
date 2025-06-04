require('dotenv').config();
const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedData() {
  console.log('Seeding database with test data...');

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Insert sample users
    console.log('Creating users...');
    const usersResult = await pool.query(`
      INSERT INTO users (username, email, phone, role, password_hash, created_at, updated_at)
      VALUES 
        ('admin', 'admin@pharmacy.com', '+33612345678', 'ADMIN', '$2b$10$eSWbZgBOVe2M4XGIVJnTCeRD9bBKyf3l/fkDT2T8NjgVQGzCF5Q7q', NOW(), NOW()),
        ('pharmacist1', 'pharmacist1@pharmacy.com', '+33623456789', 'PHARMACIST', '$2b$10$s5Dp5QeS0M/n3cpR/sVqPOPBcpGpWYxlS8DtngZxu.Z2.FAFqGwVa', NOW(), NOW()),
        ('patient1', 'patient1@example.com', '+33634567890', 'CUSTOMER', '$2b$10$jQNdARJe1Ql/GlGH8j0WyenO9EIXYghvs8bxzsPOdCR9H5ZHdVAGC', NOW(), NOW()),
        ('patient2', 'patient2@example.com', '+33645678901', 'CUSTOMER', '$2b$10$HmYkMF/aRUzaGrVRvQwkp.Y3UJsw8/sjw1zHXwQW3MG/tY/58y7g.', NOW(), NOW()),
        ('deliverer1', 'deliverer1@pharmacy.com', '+33656789012', 'DELIVERY_PERSON', '$2b$10$P9tZF8eE6B6PGbP1yVRlReEwNEQ5TewH61UcQf5zQeNWnDcZ7CX/q', NOW(), NOW())
      RETURNING id;
    `);

    const userIds = usersResult.rows.map(row => row.id);
    console.log(`Created ${userIds.length} users with IDs:`, userIds);

    // Insert sample pharmacies
    console.log('Creating pharmacies...');
    const pharmaciesResult = await pool.query(`
      INSERT INTO pharmacies (name, address, location, phone, email, created_at, updated_at)
      VALUES 
        ('Pharmacie Centrale', '123 Rue de la République, Paris, 75001, France', '{"lat": 48.8566, "lng": 2.3522}', '+33123456789', 'contact@pharmaciecentrale.fr', NOW(), NOW()),
        ('Pharmacie du Marché', '45 Place du Marché, Lyon, 69002, France', '{"lat": 45.7578, "lng": 4.8320}', '+33234567890', 'contact@pharmaciemarche.fr', NOW(), NOW())
      RETURNING id;
    `);

    const pharmacyIds = pharmaciesResult.rows.map(row => row.id);
    console.log(`Created ${pharmacyIds.length} pharmacies with IDs:`, pharmacyIds);

    // Associate pharmacists with pharmacies
    console.log('Associating staff with pharmacies...');
    await pool.query(`
      INSERT INTO pharmacy_staff (pharmacy_id, user_id, position, created_at, updated_at)
      VALUES 
        (${pharmacyIds[0]}, ${userIds[1]}, 'head_pharmacist', NOW(), NOW()),
        (${pharmacyIds[1]}, ${userIds[1]}, 'pharmacist', NOW(), NOW())
    `);

    // Insert sample medicines
    console.log('Creating medicines...');
    const medicinesResult = await pool.query(`
      INSERT INTO medicines (name, description, manufacturer, category, requires_prescription, image_url, created_at, updated_at)
      VALUES 
        ('Amoxicillin 500mg', 'Antibiotic for bacterial infections', 'Sanofi', 'Antibiotics', true, 'https://example.com/images/amoxicillin.jpg', NOW(), NOW()),
        ('Ibuprofen 400mg', 'Pain reliever and fever reducer', 'Bayer', 'Anti-inflammatory', false, 'https://example.com/images/ibuprofen.jpg', NOW(), NOW()),
        ('Paracetamol 500mg', 'Pain reliever and fever reducer', 'GSK', 'Analgesics', false, 'https://example.com/images/paracetamol.jpg', NOW(), NOW()),
        ('Cetirizine 10mg', 'Antihistamine for allergies', 'UCB Pharma', 'Antihistamines', false, 'https://example.com/images/cetirizine.jpg', NOW(), NOW()),
        ('Omeprazole 20mg', 'Proton pump inhibitor for acid reflux', 'AstraZeneca', 'Gastrointestinal', true, 'https://example.com/images/omeprazole.jpg', NOW(), NOW())
      RETURNING id;
    `);

    const medicineIds = medicinesResult.rows.map(row => row.id);
    console.log(`Created ${medicineIds.length} medicines with IDs:`, medicineIds);

    // Associate medicines with pharmacies
    console.log('Adding medicines to pharmacy inventory...');
    await pool.query(`
      INSERT INTO pharmacy_medicines (pharmacy_id, medicine_id, price, stock_quantity, created_at, updated_at)
      VALUES 
        (${pharmacyIds[0]}, ${medicineIds[0]}, 1250.00, 145, NOW(), NOW()),
        (${pharmacyIds[0]}, ${medicineIds[1]}, 450.00, 230, NOW(), NOW()),
        (${pharmacyIds[0]}, ${medicineIds[2]}, 350.00, 340, NOW(), NOW()),
        (${pharmacyIds[0]}, ${medicineIds[3]}, 550.00, 120, NOW(), NOW()),
        (${pharmacyIds[0]}, ${medicineIds[4]}, 850.00, 85, NOW(), NOW()),
        (${pharmacyIds[1]}, ${medicineIds[0]}, 1290.00, 110, NOW(), NOW()),
        (${pharmacyIds[1]}, ${medicineIds[1]}, 460.00, 195, NOW(), NOW()),
        (${pharmacyIds[1]}, ${medicineIds[2]}, 360.00, 260, NOW(), NOW()),
        (${pharmacyIds[1]}, ${medicineIds[3]}, 560.00, 180, NOW(), NOW()),
        (${pharmacyIds[1]}, ${medicineIds[4]}, 870.00, 75, NOW(), NOW())
    `);

    // Insert sample prescriptions
    console.log('Creating prescriptions...');
    const prescriptionsResult = await pool.query(`
      INSERT INTO prescriptions (user_id, image_url, status, notes, created_at, updated_at)
      VALUES 
        (${userIds[2]}, 'https://example.com/prescriptions/12345.jpg', 'VERIFIED', 'Prescription pour antibiotiques', NOW(), NOW()),
        (${userIds[3]}, 'https://example.com/prescriptions/67890.jpg', 'PENDING', 'En attente de verification', NOW(), NOW())
      RETURNING id;
    `);

    const prescriptionIds = prescriptionsResult.rows.map(row => row.id);
    console.log(`Created ${prescriptionIds.length} prescriptions with IDs:`, prescriptionIds);

    // Insert sample orders
    console.log('Creating orders...');
    const ordersResult = await pool.query(`
      INSERT INTO orders (user_id, pharmacy_id, total_amount, status, delivery_address, delivery_location, payment_status, created_at, updated_at)
      VALUES 
        (${userIds[2]}, ${pharmacyIds[0]}, 2100, 'PROCESSING', '123 Avenue des Champs-Élysées, Paris', '{"lat": 48.8738, "lng": 2.2950}', 'PAID', NOW() - INTERVAL '2 days', NOW()),
        (${userIds[3]}, ${pharmacyIds[1]}, 1449, 'OUT_FOR_DELIVERY', '45 Rue de la République, Lyon', '{"lat": 45.7640, "lng": 4.8357}', 'PAID', NOW() - INTERVAL '1 day', NOW()),
        (${userIds[2]}, ${pharmacyIds[0]}, 599, 'DELIVERED', '123 Avenue des Champs-Élysées, Paris', '{"lat": 48.8738, "lng": 2.2950}', 'PAID', NOW() - INTERVAL '7 days', NOW())
      RETURNING id;
    `);

    const orderIds = ordersResult.rows.map(row => row.id);
    console.log(`Created ${orderIds.length} orders with IDs:`, orderIds);

    // Insert sample order items
    console.log('Adding items to orders...');
    await pool.query(`
      INSERT INTO order_items (order_id, medicine_id, quantity, unit_price, total_price, created_at, updated_at)
      VALUES 
        (${orderIds[0]}, ${medicineIds[0]}, 1, 1250, 1250, NOW(), NOW()),
        (${orderIds[0]}, ${medicineIds[4]}, 1, 850, 850, NOW(), NOW()),
        (${orderIds[1]}, ${medicineIds[2]}, 1, 599, 599, NOW(), NOW()),
        (${orderIds[1]}, ${medicineIds[3]}, 1, 850, 850, NOW(), NOW()),
        (${orderIds[2]}, ${medicineIds[2]}, 1, 599, 599, NOW(), NOW())
    `);

    // Skip delivery tracking (table doesn't exist yet)
    console.log('Skipping delivery tracking information as table appears to be missing');

    // Insert sample messages
    console.log('Adding sample messages...');
    await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, content, read_at, created_at, updated_at)
      VALUES 
        (${userIds[2]}, ${userIds[1]}, 'Bonjour, est-ce que je peux obtenir plus d''informations sur l''ordonnance?', NOW() - INTERVAL '2 hours 50 minutes', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
        (${userIds[1]}, ${userIds[2]}, 'Bonjour, bien sûr! Quel médicament vous intéresse?', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours')
    `);

    // Insert sample reminders
    console.log('Adding medication reminders...');
    await pool.query(`
      INSERT INTO reminders (user_id, medicine_id, title, description, frequency, start_date, active, created_at, updated_at)
      VALUES 
        (${userIds[2]}, ${medicineIds[0]}, 'Amoxicilline', 'Prendre 1 comprimé', '{"type": "daily", "times": ["08:00"]}', NOW(), true, NOW(), NOW()),
        (${userIds[2]}, ${medicineIds[0]}, 'Amoxicilline', 'Prendre 1 comprimé', '{"type": "daily", "times": ["20:00"]}', NOW(), true, NOW(), NOW()),
        (${userIds[3]}, ${medicineIds[4]}, 'Omeprazole', 'Prendre 1 gélule avant le repas', '{"type": "daily", "times": ["12:00"]}', NOW(), true, NOW(), NOW())
    `);

    // Insert sample system logs
    console.log('Adding system logs...');
    await pool.query(`
      INSERT INTO system_logs (action, entity_type, entity_id, description, performed_by, created_at)
      VALUES 
        ('LOGIN', 'USER', ${userIds[0]}, 'Connexion administrateur', ${userIds[0]}, NOW() - INTERVAL '1 day'),
        ('LOGIN', 'USER', ${userIds[1]}, 'Connexion pharmacien', ${userIds[1]}, NOW() - INTERVAL '12 hours'),
        ('CREATE', 'ORDER', ${orderIds[0]}, 'Nouvelle commande créée', ${userIds[2]}, NOW() - INTERVAL '2 days'),
        ('CREATE', 'ORDER', ${orderIds[1]}, 'Nouvelle commande créée', ${userIds[3]}, NOW() - INTERVAL '1 day'),
        ('UPDATE', 'SYSTEM', null, 'Mise à jour système v1.0.1', ${userIds[0]}, NOW() - INTERVAL '7 days')
    `);

    // Insert sample AI settings
    console.log('Adding AI settings...');
    await pool.query(`
      INSERT INTO ai_settings (user_id, setting_key, setting_value, created_at, updated_at)
      VALUES 
        (${userIds[0]}, 'ocr_settings', '{"confidence_threshold": 0.8, "languages": ["fra", "eng"]}', NOW(), NOW()),
        (${userIds[0]}, 'prescription_analysis', '{"model": "gpt-4o", "max_tokens": 1000}', NOW(), NOW()),
        (${userIds[0]}, 'medication_recognition', '{"enabled": true, "min_confidence": 0.7}', NOW(), NOW())
    `);

    // Commit the transaction
    await pool.query('COMMIT');

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

seedData().catch(err => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});