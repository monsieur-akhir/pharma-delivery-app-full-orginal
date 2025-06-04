import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import compression from 'compression';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { QueueService } from './queue/queue.service';
import type { Express } from 'express';

async function bootstrap() {
  // Création du logger Winston
  const winstonLogger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ms }) => {
            return `${timestamp} [${context}] ${level}: ${message} ${ms}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  // Création de l'application NestJS
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:4200',
        'capacitor://localhost',
        'http://localhost',
      ],
      credentials: true,
    },
  });
  const configService = app.get(ConfigService);

  // Préfixe global, versioning et middleware
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(compression());
  app.use(
    helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }),
  );

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Bull Board UI (dev uniquement)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const queueService = app.get(QueueService);
      const serverAdapter = new ExpressAdapter();
      serverAdapter.setBasePath('/admin/queues');

      createBullBoard({
        queues: [
          new BullAdapter(queueService.ocrQueue),
          new BullAdapter(queueService.prescriptionQueue),
          new BullAdapter(queueService.notificationQueue),
        ],
        serverAdapter,
      });
      app.use('/admin/queues', serverAdapter.getRouter());
      winstonLogger.log({ level: 'info', message: 'Bull Board UI disponible sur /admin/queues', context: 'Bootstrap' });
    } catch (error) {
      winstonLogger.error('Erreur lors de la configuration de Bull Board', { context: 'Bootstrap', error });
    }
  }

  // Swagger (dev uniquement)
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const docConfig = new DocumentBuilder()
      .setTitle('Pharmacy App API')
      .setDescription('API for mobile-based pharmacy management and delivery')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth')
      .addTag('users')
      .addTag('pharmacies')
      .addTag('medicines')
      .addTag('orders')
      .addTag('prescriptions')
      .addTag('payments')
      .addTag('chat')
      .addTag('reminders')
      .addTag('admin')
      .addTag('health')
      .build();

    const document = SwaggerModule.createDocument(app, docConfig);
    SwaggerModule.setup('docs', app, document);
    winstonLogger.log({ level: 'info', message: 'Swagger documentation available at /docs', context: 'Bootstrap' });
  }

  // Log des routes Express
  try {
    const expressApp = app.getHttpAdapter().getInstance() as Express;
    if (expressApp._router?.stack) {
      winstonLogger.log({ level: 'info', message: 'Registered Express routes:', context: 'Bootstrap' });
      expressApp._router.stack
        .filter(layer => layer.route)
        .forEach(layer => {
          const method = Object.keys(layer.route.methods)[0].toUpperCase();
          const path = layer.route.path;
          winstonLogger.log({ level: 'info', message: `${method} ${path}`, context: 'Bootstrap' });
        });
    } else {
      winstonLogger.warn('Express router stack is undefined', { context: 'Bootstrap' });
    }
  } catch (err) {
    winstonLogger.error('Error while logging Express routes', { context: 'Bootstrap', error: err.stack });
  }

  // Endpoint de test statique
  const expressInstance = app.getHttpAdapter().getInstance() as Express;
  expressInstance.get('/api/pharmacy-stats-test', (req, res) => {
    winstonLogger.log({ level: 'info', message: 'GET /api/pharmacy-stats-test called', context: 'Bootstrap' });
    return res.json({ total: 42, pending: 10, approved: 25, suspended: 5, rejected: 2 });
  });

  // Démarrage du serveur
  const port = configService.get<number>('PORT', 8000);
  const host = configService.get<string>('HOST', '0.0.0.0');
  await app.listen(port, host);

  winstonLogger.log({ level: 'info', message: `Application is running on: ${await app.getUrl()}`, context: 'Bootstrap' });
  winstonLogger.log({ level: 'info', message: `Environment: ${process.env.NODE_ENV || 'development'}`, context: 'Bootstrap' });
}

// Shutdown gracieux
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

bootstrap();
