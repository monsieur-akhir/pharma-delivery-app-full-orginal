// Script pour tester le service d'analyse de prescriptions
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:8000/api';
const SAMPLE_IMAGE_PATH = path.join(__dirname, '../../../attached_assets/Pasted-Tu-es-un-architecte-logiciel-fullstack-expert-en-NestJS-React-Native-Angular-et-d-veloppement-d-ap-1746814972037.txt');

// Fonction pour convertir une image en base64
async function imageToBase64(imagePath) {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(imagePath)) {
      console.error(`Le fichier image n'existe pas: ${imagePath}`);
      console.log('Utilisation d\'une chaîne de test à la place');
      return 'test-image-data';
    }
    
    // Lire l'image et la convertir en base64
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Erreur lors de la conversion de l\'image en base64:', error);
    throw error;
  }
}

// Fonction pour tester l'analyse de prescription
async function testPrescriptionAnalysis() {
  try {
    console.log('Test du service d\'analyse de prescriptions');
    
    // Convertir l'image en base64
    console.log(`Chargement de l'image depuis: ${SAMPLE_IMAGE_PATH}`);
    let base64Image;
    try {
      base64Image = await imageToBase64(SAMPLE_IMAGE_PATH);
      console.log('Image convertie en base64 avec succès');
    } catch (error) {
      console.log('Utilisation d\'une image de test factice');
      base64Image = 'test-image-data';
    }
    
    // Envoyer la requête d'analyse
    console.log('Envoi de la requête d\'analyse au serveur...');
    const response = await axios.post(`${API_BASE_URL}/prescriptions/analyze`, {
      imageBase64: base64Image
    });
    
    // Afficher les résultats
    console.log('Réponse du serveur:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors du test d\'analyse de prescription:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester l'interaction entre médicaments
async function testDrugInteractions() {
  try {
    console.log('\nTest du service d\'interactions médicamenteuses');
    
    // Exemple de médicaments à tester
    const medications = ['Metformin', 'Lisinopril', 'Ibuprofen'];
    console.log(`Vérification des interactions pour: ${medications.join(', ')}`);
    
    // Envoyer la requête d'analyse d'interactions
    const response = await axios.post(`${API_BASE_URL}/prescriptions/check-interactions`, {
      medications
    });
    
    // Afficher les résultats
    console.log('Réponse du serveur:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors du test d\'interactions médicamenteuses:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester les informations sur un médicament
async function testMedicationInfo() {
  try {
    console.log('\nTest du service d\'informations sur les médicaments');
    
    // Exemple de médicament à rechercher
    const medicationName = 'Metformin';
    console.log(`Recherche d'informations pour: ${medicationName}`);
    
    // Envoyer la requête d'informations sur le médicament
    const response = await axios.post(`${API_BASE_URL}/prescriptions/medication-info`, {
      medicationName
    });
    
    // Afficher les résultats
    console.log('Réponse du serveur:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations sur le médicament:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction principale pour exécuter tous les tests
async function runAllTests() {
  console.log('Démarrage des tests du service d\'analyse de prescriptions');
  console.log('============================================================');
  
  try {
    await testPrescriptionAnalysis();
    await testDrugInteractions();
    await testMedicationInfo();
    
    console.log('============================================================');
    console.log('Tous les tests ont été complétés avec succès!');
  } catch (error) {
    console.error('Les tests ont échoué:', error.message);
  }
}

// Exécuter les tests
runAllTests();