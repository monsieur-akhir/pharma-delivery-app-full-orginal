const axios = require('axios');

// Configuration de base
const API_BASE_URL = 'http://192.168.1.3:8000/api';

// Fonction pour tester les endpoints de stock
async function testStockAPI() {
  console.log('🧪 Testing Stock Management API...\n');

  try {    // Test 1: Vérifier que l'API est accessible
    console.log('1. Testing API accessibility...');
    const baseResponse = await axios.get(`http://192.168.1.3:8000`);
    // Une erreur 404 est attendue, mais cela confirme que le serveur répond
    console.log('✅ API server is responding');

    // Test 2: Tester l'endpoint de stock d'une pharmacie
    console.log('\n2. Testing pharmacy stock endpoint...');
    try {
      const stockResponse = await axios.get(`${API_BASE_URL}/stock/pharmacy/1`);
      console.log('✅ Pharmacy stock endpoint is working');
      console.log('📊 Stock data:', stockResponse.data.slice(0, 2)); // Afficher les 2 premiers éléments
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ No stock found for pharmacy 1 (expected for new setup)');
      } else {
        console.log('❌ Pharmacy stock endpoint error:', error.response?.status, error.message);
      }
    }

    // Test 3: Tester l'endpoint de mouvements de stock
    console.log('\n3. Testing stock movements endpoint...');
    try {
      const movementsResponse = await axios.get(`${API_BASE_URL}/stock/pharmacy/1/movements`);
      console.log('✅ Stock movements endpoint is working');
      console.log('📈 Movements data:', movementsResponse.data.slice(0, 2));
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ No movements found for pharmacy 1 (expected for new setup)');
      } else {
        console.log('❌ Stock movements endpoint error:', error.response?.status, error.message);
      }
    }

    // Test 4: Tester l'endpoint de rapport de stock faible
    console.log('\n4. Testing low stock report endpoint...');
    try {
      const lowStockResponse = await axios.get(`${API_BASE_URL}/stock/pharmacy/1/low-stock-report`);
      console.log('✅ Low stock report endpoint is working');
      console.log('⚠️ Low stock items:', lowStockResponse.data.length);
    } catch (error) {
      console.log('❌ Low stock report error:', error.response?.status, error.message);
    }

    // Test 5: Tester l'endpoint de médicaments expirant
    console.log('\n5. Testing expiring medicines report endpoint...');
    try {
      const expiringResponse = await axios.get(`${API_BASE_URL}/stock/pharmacy/1/expiring-medicines-report`);
      console.log('✅ Expiring medicines report endpoint is working');
      console.log('📅 Expiring medicines:', expiringResponse.data.length);
    } catch (error) {
      console.log('❌ Expiring medicines report error:', error.response?.status, error.message);
    }

    // Test 6: Tester l'endpoint de résumé de stock
    console.log('\n6. Testing stock summary endpoint...');
    try {
      const summaryResponse = await axios.get(`${API_BASE_URL}/stock/pharmacy/1/summary`);
      console.log('✅ Stock summary endpoint is working');
      console.log('📋 Stock summary:', summaryResponse.data);
    } catch (error) {
      console.log('❌ Stock summary error:', error.response?.status, error.message);
    }

    console.log('\n🎉 Stock API testing completed!');

  } catch (error) {
    console.error('❌ Failed to connect to API:', error.message);
    console.log('Make sure the backend server is running on http://192.168.1.3:8000');
  }
}

// Exécuter les tests
testStockAPI();
