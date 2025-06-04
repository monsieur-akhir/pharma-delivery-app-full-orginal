const axios = require('axios');

async function testStockAPI() {
  console.log('🧪 Testing Stock Management API...\n');
  
  const API_BASE_URL = 'http://192.168.1.3:8000/api';

  try {
    console.log('1. Testing API accessibility...');
    try {
      await axios.get('http://192.168.1.3:8000');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ API server is responding (404 on root is expected)');
      } else {
        throw error;
      }
    }

    console.log('\n2. Testing pharmacy stock endpoint...');
    try {
      const stockResponse = await axios.get(`${API_BASE_URL}/stock/pharmacy/1`);
      console.log('✅ Pharmacy stock endpoint is working');
      console.log('📊 Stock data:', stockResponse.data);
    } catch (error) {
      console.log('❌ Pharmacy stock endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n3. Testing stock movements endpoint...');
    try {
      const movementsResponse = await axios.get(`${API_BASE_URL}/stock/pharmacy/1/movements`);
      console.log('✅ Stock movements endpoint is working');
      console.log('📈 Movements data:', movementsResponse.data);
    } catch (error) {
      console.log('❌ Stock movements endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n4. Testing low stock report endpoint...');
    try {
      const lowStockResponse = await axios.get(`${API_BASE_URL}/stock/pharmacy/1/low-stock-report`);
      console.log('✅ Low stock report endpoint is working');
      console.log('⚠️ Low stock report:', lowStockResponse.data);
    } catch (error) {
      console.log('❌ Low stock report error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Stock API testing completed!');

  } catch (error) {
    console.error('❌ Failed to connect to API:', error.message);
  }
}

testStockAPI();
