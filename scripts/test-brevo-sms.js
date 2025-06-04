// Ce script teste l'envoi de SMS avec le service Brevo
require('dotenv').config();
const { BrevoSmsService } = require('../dist/notifications/services/brevo-sms.service');
const { SmsService } = require('../dist/notifications/services/sms.service');
const { ConfigService } = require('@nestjs/config');

async function testBrevoSmsService() {
  console.log('🚀 Test du service SMS Brevo');
  console.log('=======================================================');

  // Créer une instance de ConfigService simulée
  const configService = {
    get: (key, defaultValue) => {
      return process.env[key] || defaultValue;
    }
  };

  // Créer une instance du service BrevoSms
  const brevoSmsService = new BrevoSmsService(configService);
  
  // Créer une instance du service SMS principal
  const smsService = new SmsService(configService, brevoSmsService);

  // Numéro de téléphone de test (format international requis: +33612345678)
  const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '+33600000000';

  console.log(`📱 Envoi de SMS de test à: ${testPhoneNumber}`);

  try {
    // Test 1: Envoi SMS direct via BrevoSmsService
    console.log('\n🧪 Test 1: Envoi SMS direct via BrevoSmsService');
    const directResult = await brevoSmsService.sendSms(
      testPhoneNumber,
      'Test SMS directement via BrevoSmsService'
    );
    console.log('✅ Résultat d\'envoi direct:');
    console.log(directResult);

    // Test 2: Envoi SMS avec template via BrevoSmsService
    console.log('\n🧪 Test 2: Envoi SMS avec template prédéfini');
    const templateResult = await brevoSmsService.sendSmsWithPresetTemplate(
      testPhoneNumber,
      'otp',
      { 
        otp: '123456', 
        expiresIn: '10 minutes'
      }
    );
    console.log('✅ Résultat d\'envoi avec template:');
    console.log(templateResult);

    // Test 3: Envoi via SmsService avec choix explicite de fournisseur Brevo
    console.log('\n🧪 Test 3: Envoi via SmsService (fournisseur Brevo)');
    const viaServiceResult = await smsService.sendSms(
      testPhoneNumber, 
      'Test via SmsService avec fournisseur Brevo explicite',
      'brevo'
    );
    console.log('✅ Résultat via service:');
    console.log(viaServiceResult);

    // Test 4: Envoi d'un rappel de médicament
    console.log('\n🧪 Test 4: Envoi d\'un rappel de médicament');
    const reminderResult = await brevoSmsService.sendMedicationReminder(
      testPhoneNumber,
      'Paracétamol',
      '500mg, 2 comprimés',
      '12h00'
    );
    console.log('✅ Résultat d\'envoi de rappel:');
    console.log(reminderResult);

    // Test 5: Envoi d'une mise à jour de commande
    console.log('\n🧪 Test 5: Envoi d\'une mise à jour de commande');
    const orderResult = await brevoSmsService.sendOrderStatusUpdate(
      testPhoneNumber,
      'CMD-12345',
      'IN_TRANSIT'
    );
    console.log('✅ Résultat d\'envoi de mise à jour:');
    console.log(orderResult);

    console.log('\n🎉 Tests terminés avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:');
    console.error(error);
    console.error('\n👉 Vérifiez que les variables d\'environnement suivantes sont définies:');
    console.error('- BREVO_API_KEY_SMS: Votre clé API Brevo pour les SMS');
    console.error('- TEST_PHONE_NUMBER: Un numéro de téléphone valide pour les tests (format: +33612345678)');
  }
}

// Exécuter les tests
testBrevoSmsService();
