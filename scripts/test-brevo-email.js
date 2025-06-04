// Ce script teste l'envoi d'email avec le service Brevo amélioré
require('dotenv').config();
const { BrevoService } = require('../dist/notifications/services/brevo.service');
const { ConfigService } = require('@nestjs/config');

async function testBrevoEmailService() {
  console.log('🚀 Test du service d\'emails Brevo avec Handlebars');
  console.log('=======================================================');

  // Créer une instance de ConfigService simulée
  const configService = {
    get: (key, defaultValue) => {
      return process.env[key] || defaultValue;
    }
  };

  // Créer une instance du service Brevo
  const brevoService = new BrevoService(configService);

  // Adresse email de test
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  console.log(`📧 Envoi d'email de test à: ${testEmail}`);

  try {
    // Test d'envoi avec template OTP
    const otpResult = await brevoService.sendEmail(
      testEmail,
      'Votre code de vérification',
      'otp',
      { 
        otp: '123456', 
        expiresIn: '10 minutes',
        firstName: 'Utilisateur',
        userId: 1
      }
    );

    console.log('\n✅ Résultat d\'envoi avec template OTP:');
    console.log(otpResult);

    // Test d'envoi avec template de réinitialisation de mot de passe
    const resetResult = await brevoService.sendEmail(
      testEmail,
      'Réinitialisation de votre mot de passe',
      'password_reset',
      { 
        code: 'ABC123', 
        expiresIn: '30 minutes',
        resetUrl: 'https://votreapp.com/reset-password?token=xyz123'
      }
    );

    console.log('\n✅ Résultat d\'envoi avec template de réinitialisation:');
    console.log(resetResult);

    // Test d'envoi avec template Handlebars personnalisé
    const customTemplate = `
      <html>
        <body>
          <h1>{{title}}</h1>
          <p>Bonjour {{name}},</p>
          <p>{{message}}</p>
          <p>Date: {{date}}</p>
        </body>
      </html>
    `;

    const customResult = await brevoService.sendTemplateEmail(
      testEmail,
      'Email personnalisé avec Handlebars',
      customTemplate,
      {
        title: 'Test de Template Personnalisé',
        name: 'Utilisateur Test',
        message: 'Ceci est un message de test avec Handlebars',
        date: new Date().toLocaleDateString()
      }
    );

    console.log('\n✅ Résultat d\'envoi avec template personnalisé:');
    console.log(customResult);

    console.log('\n🎉 Tests terminés avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:');
    console.error(error);
  }
}

// Exécuter les tests
testBrevoEmailService();
