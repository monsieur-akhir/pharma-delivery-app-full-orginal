const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const Queue = require('bull');

// Création de l'application Express
const app = express();
const port = process.env.PORT || 3000;

// Récupération de l'URL Redis depuis les variables d'environnement
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Création des adaptateurs pour les files d'attente
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/ui');

// Liste des files d'attente à surveiller
const queueNames = [
  'prescription-ocr',
  'email-notifications',
  'sms-notifications',
  'medication-reminders',
  'order-processing',
  'delivery-tracking',
  'ai-analysis'
];

// Création des files d'attente
const queues = queueNames.map(name => new Queue(name, redisUrl));

// Configuration du tableau de bord
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: queues.map(queue => new BullAdapter(queue)),
  serverAdapter: serverAdapter,
});

// Montage de l'interface utilisateur
app.use('/ui', serverAdapter.getRouter());

// Route par défaut
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>MediConnect - BullMQ Dashboard</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f7;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #3f51b5;
          }
          .btn {
            display: inline-block;
            background-color: #3f51b5;
            color: white;
            padding: 10px 20px;
            margin-top: 20px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
          .queue-list {
            text-align: left;
            margin: 20px auto;
            max-width: 400px;
          }
          .queue-item {
            padding: 8px;
            margin: 5px 0;
            background-color: #f0f0f0;
            border-left: 4px solid #3f51b5;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>MediConnect - BullMQ Dashboard</h1>
          <p>Tableau de bord de gestion des files d'attente pour les tâches asynchrones</p>
          
          <div class="queue-list">
            <h3>Files d'attente surveillées :</h3>
            ${queueNames.map(name => `<div class="queue-item">${name}</div>`).join('')}
          </div>
          
          <a href="/ui" class="btn">Accéder au tableau de bord</a>
        </div>
      </body>
    </html>
  `);
});

// Démarrage du serveur
app.listen(port, '0.0.0.0', () => {
  console.log(`BullMQ Dashboard running at http://localhost:${port}`);
  console.log(`UI available at http://localhost:${port}/ui`);
});