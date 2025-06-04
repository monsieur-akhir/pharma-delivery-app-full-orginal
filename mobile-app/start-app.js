const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const app = express();
const port = 5000;

// Ensure directories exist
fs.ensureDirSync(path.join(__dirname, 'assets'));

// Create mock Expo server for development preview
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Main route that serves the mock Expo interface
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medi-Delivery Mobile App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f7f7f7;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        header {
          background-color: #0C6B58;
          color: white;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        main {
          flex: 1;
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        footer {
          background-color: #0C6B58;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 14px;
        }
        .phone-container {
          position: relative;
          width: 320px;
          height: 650px;
          margin: 40px auto;
          border-radius: 36px;
          background-color: #111;
          padding: 10px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .phone-screen {
          width: 100%;
          height: 100%;
          background-color: white;
          border-radius: 30px;
          overflow: hidden;
          position: relative;
        }
        .status-bar {
          height: 30px;
          background-color: #0C6B58;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 15px;
          color: white;
          font-size: 14px;
        }
        .app-screen {
          height: calc(100% - 30px);
          display: flex;
          flex-direction: column;
        }
        .header {
          background-color: #0C6B58;
          color: white;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 {
          margin: 0;
          font-size: 20px;
        }
        .content {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
        }
        .map-container {
          width: 100%;
          height: 300px;
          background-color: #e0e0e0;
          margin-bottom: 15px;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        .map-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #777;
          font-size: 14px;
          background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNlM2UzZTMiIG9mZnNldD0iMCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZDdkN2Q3IiBvZmZzZXQ9IjEwMCUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBmaWxsPSJ1cmwoI2EpIiBkPSJNMCAwaDMwMHYzMDBIMHoiLz48cGF0aCBkPSJNMTUxIDEwNGMtMjEuNSAwLTM5IDE3LjUtMzkgMzlzMTcuNSAzOSAzOSAzOSAzOS0xNy41IDM5LTM5LTE3LjUtMzktMzktMzl6bTAgNTNjLTcuNyAwLTE0LTYuMy0xNC0xNHM2LjMtMTQgMTQtMTQgMTQgNi4zIDE0IDE0LTYuMyAxNC0xNCAxNHoiIGZpbGw9IiM2NjYiLz48cGF0aCBkPSJNMTUxLjUgNDhjLTI3LjYgMC01MyAxMi4yLTcwLjQgMzMuNS0xNy4yIDIxLjItMjQuMiA0OC43LTE5LjIgNzUuNSA1IDI2LjggMjIuMSA0OS44IDQ2LjcgNjIuNyAzLjEgMS42IDYuMyAzIDkuNSA0LjIgMy4yIDEuMiA2LjcgMi4yIDEwLjIgM2w3LjkgMS44YzEuNC4zIDIuOC4zIDQuMSAwaDE0LjhjNy4xLTEuMiAxNC4zLTMuMyAyMS4yLTYuMiAyOS02LjEgNTIuNC0yNy4yIDYwLjYtNTUuNiA4LjEtMjguMy0uMS01OC45LTIxLjMtNzkuNi0yMS4xLTIwLjgtNTIuNS0zMC0wMC42LTI1Ljd6bS4xIDExMWMtMTYuMSAwLTMwLjEtOC45LTM3LjUtMjNzLTQuOS0zMC44IDYtNDEuOCAxOC4yLTE3LjQgNDEuOS0xMy41YzE0LjEgMi4zIDI1LjggMTEuMiAzMi4yIDI0LjMgNi40IDEzLjEgNi4yIDI4LjItLjUgNDEuMi02LjggMTIuOS0xOS42IDIxLjItMzQuMSAyMS44eiIgZmlsbD0iIzY2NiIvPjxwYXRoIGQ9Ik0yNTguOCA5OS40cy0zMC42LTYuOS0xLTE0LjZjLTMuNC0uOS03LjctMi4xLTEyLTMuNGwtNC45LTIuMXY4LjRsLTg5LjEgNzEuM3Y0OC42bDU4LjggNDNoOGwyLTg5LjggOTAuOS01NS42eiIgZmlsbD0iI2M4YzhjOCIvPjxwYXRoIGQ9Ik0yMTEuMiA1OS45cy05OC40IDc1LjgtNTkuMyA4OS45Yy0zOS4xIDE0LjEtMzguMi0uMy0zOS4yIDIyLjMgMCAyMi43LTIyLjYgNTQuNi0yOS41IDc2LjggMjMuOCAxNy4xIDUyLjcgMjYuMyA4Mi44IDI2LjMgNzkuNyAwIDE0NC40LTY0LjcgMTQ0LjQtMTQ0LjQgMC0yOS45LTktNTgtMjQuOC04MS42TDIxMS4yIDU5Ljl6IiBmaWxsPSIjZTJlMmUyIiBvcGFjaXR5PSIuNSIvPjxwYXRoIGQ9Ik0yMTEuMiA1OS45cy02MC40IDM0LjEtNzIuNSA1Ny41LTMyLjIgNTUuNi0yNi44IDU0LjdjNS40LS45IDE3LjUtMzYuOSAyNi44LTU0LjcgOS4zLTE3LjggNzIuNS01Ny41IDcyLjUtNTcuNXoiIGZpbGw9IiNhOGE4YTgiIG9wYWNpdHk9Ii41Ii8+PHBhdGggZD0iTTQxLjIgMTcyLjJzNjAuNC0zNC4xIDcyLjUtNTcuNSAzMi4yLTU1LjYgMjYuOC01NC43Yy01LjQuOS0xNy41IDM2LjktMjYuOCA1NC43cy03Mi41IDU3LjUtNzIuNSA1Ny41eiIgZmlsbD0iI2E4YThhOCIgb3BhY2l0eT0iLjUiLz48L3N2Zz4=');
          background-size: cover;
          background-position: center;
        }
        .delivery-details {
          background-color: #f1f1f1;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .delivery-details h2 {
          margin-top: 0;
          font-size: 18px;
          color: #0C6B58;
        }
        .delivery-details p {
          margin: 5px 0;
          font-size: 14px;
          color: #333;
        }
        .delivery-status {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #4CAF50;
          margin-right: 10px;
        }
        .status-text {
          font-weight: bold;
          color: #4CAF50;
        }
        .eta {
          background-color: white;
          border-radius: 8px;
          padding: 10px 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .eta-label {
          font-size: 14px;
          color: #666;
        }
        .eta-time {
          font-size: 18px;
          font-weight: bold;
          color: #0C6B58;
        }
        .navigation-bar {
          display: flex;
          height: 60px;
          background-color: white;
          border-top: 1px solid #e0e0e0;
        }
        .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #777;
          font-size: 12px;
        }
        .nav-item.active {
          color: #0C6B58;
        }
        .nav-icon {
          margin-bottom: 4px;
          font-size: 24px;
        }
        .info {
          background-color: #f0f8ff;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .info h2 {
          margin-top: 0;
          color: #0C6B58;
        }
        .info p {
          margin-bottom: 0;
        }
        .logo {
          display: flex;
          align-items: center;
        }
        .logo img {
          height: 40px;
          margin-right: 10px;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        .feature-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .feature-card h3 {
          margin-top: 0;
          color: #0C6B58;
        }
        .qr-code {
          text-align: center;
          margin: 30px 0;
        }
        .qr-code img {
          width: 150px;
          height: 150px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .qr-code p {
          margin-top: 10px;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <header>
        <div class="logo">
          <img src="/assets/icon.png" alt="Medi-Delivery Logo" style="width: 40px; height: 40px;">
          <h1>Medi-Delivery Mobile App</h1>
        </div>
      </header>
      
      <main>
        <div class="phone-container">
          <div class="phone-screen">
            <div class="status-bar">
              <div>9:41</div>
              <div>📶 📶 🔋</div>
            </div>
            <div class="app-screen">
              <div class="header">
                <h1>Delivery Tracking</h1>
                <div>⋮</div>
              </div>
              <div class="content">
                <div class="map-container">
                  <div class="map-placeholder"></div>
                </div>
                
                <div class="eta">
                  <div class="eta-label">Estimated Arrival</div>
                  <div class="eta-time">15 minutes</div>
                </div>
                
                <div class="delivery-details">
                  <div class="delivery-status">
                    <div class="status-dot"></div>
                    <div class="status-text">In transit</div>
                  </div>
                  <h2>Order #12345</h2>
                  <p><strong>From:</strong> Central Pharmacy</p>
                  <p><strong>Items:</strong> Prescription medications (3)</p>
                  <p><strong>Delivery Address:</strong> 123 Main St</p>
                </div>
              </div>
              
              <div class="navigation-bar">
                <div class="nav-item">🏠<div>Home</div></div>
                <div class="nav-item active">🚚<div>Track</div></div>
                <div class="nav-item">💊<div>Meds</div></div>
                <div class="nav-item">👤<div>Profile</div></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="info">
          <h2>Development Preview</h2>
          <p>This is a simplified development preview of the Medi-Delivery mobile app. The actual mobile app would require a physical device or emulator to run the full React Native application. The backend API is fully functional and the mobile app code is ready for testing once you have the appropriate environment set up.</p>
        </div>
        
        <div class="features">
          <div class="feature-card">
            <h3>Real-time Delivery Tracking</h3>
            <p>Track your medication deliveries in real-time with accurate GPS location data, estimated arrival times, and delivery status updates.</p>
          </div>
          <div class="feature-card">
            <h3>Prescription Management</h3>
            <p>Upload prescriptions using your camera, receive AI-powered analysis, and manage your medication schedule with automated reminders.</p>
          </div>
          <div class="feature-card">
            <h3>Secure Payments</h3>
            <p>Pay securely using various payment methods including credit cards via Stripe and Mobile Money options for the African market.</p>
          </div>
        </div>
        
        <div class="qr-code">
          <p>To test on a physical device, scan this QR code with the Expo Go app:</p>
          <div style="width: 150px; height: 150px; background-color: #f1f1f1; margin: 0 auto; display: flex; justify-content: center; align-items: center;">QR Code</div>
          <p>Note: This is a placeholder. In a real deployment, this would be a functional QR code.</p>
        </div>
      </main>
      
      <footer>
        <p>Medi-Delivery App • Mobile Medication Management Platform</p>
      </footer>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Mobile App Development Server running at http://localhost:${port}/`);
  console.log('---------------------------------------------------');
  console.log('Note: This is a simplified development preview server');
  console.log('The actual mobile app would require a physical device or');
  console.log('emulator to run the full React Native application.');
  console.log('---------------------------------------------------');
});