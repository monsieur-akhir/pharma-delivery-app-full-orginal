// Ce script teste le flux de connexion OTP pour le portail admin
const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_URL = 'http://localhost:3000/api/v1';
const ADMIN_CREDENTIALS = {
  identifier: 'admin',  // Remplacez par vos identifiants
  password: 'admin123'  // Remplacez par votre mot de passe
};

console.log(chalk.blue('🚀 Test du flux de connexion avec OTP'));
console.log(chalk.gray('======================================================='));

// Fonction principale
async function testOtpFlow() {
  try {
    // Étape 1: Login avec identifiants
    console.log(chalk.yellow('Étape 1: Tentative de connexion avec identifiants'));
    const loginResponse = await axios.post(`${API_URL}/admin/auth/login`, ADMIN_CREDENTIALS);
    
    console.log(chalk.green('✅ Connexion réussie'));
    console.log(chalk.gray('Réponse:'), JSON.stringify(loginResponse.data, null, 2));
    
    const { username } = loginResponse.data;
    
    if (!username) {
      console.error(chalk.red('❌ Le serveur n\'a pas retourné de nom d\'utilisateur'));
      return;
    }
    
    console.log(chalk.yellow(`Nom d'utilisateur reçu: ${username}`));
    console.log(chalk.blue('Code OTP envoyé par email/SMS'));
    
    // Demander le code OTP à l'utilisateur
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(chalk.yellow('Entrez le code OTP reçu: '), async (otp) => {
      try {
        // Étape 2: Vérifier l'OTP
        console.log(chalk.yellow('Étape 2: Vérification de l\'OTP'));
        
        const otpResponse = await axios.post(`${API_URL}/admin/auth/verify-otp`, {
          username,
          otp
        });
        
        console.log(chalk.green('✅ OTP vérifié avec succès'));
        console.log(chalk.gray('Réponse:'), JSON.stringify({
          id: otpResponse.data.id,
          username: otpResponse.data.username,
          role: otpResponse.data.role,
          // Ne pas afficher le token complet pour des raisons de sécurité
          token: otpResponse.data.token ? `${otpResponse.data.token.substring(0, 15)}...` : undefined
        }, null, 2));
        
        console.log(chalk.green('🎉 Test du flux OTP réussi!'));
      } catch (error) {
        console.error(chalk.red('❌ Erreur lors de la vérification de l\'OTP:'));
        if (error.response) {
          console.error(chalk.red(`Status: ${error.response.status}`));
          console.error(chalk.red('Réponse:'), JSON.stringify(error.response.data, null, 2));
        } else {
          console.error(chalk.red(error.message));
        }
      } finally {
        readline.close();
      }
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors du test:'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Réponse:'), JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

// Exécuter le test
testOtpFlow();
