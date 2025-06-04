import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Request } from 'express'; // Express types ok pour req
import { createWriteStream } from 'fs';
import * as path from 'path';
import * as fs from 'fs-extra';
import pino from 'pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const logDir = configService.get<string>('LOG_DIR', 'logs');

        // Ensure log directory exists
        fs.ensureDirSync(logDir);

        // Create file transports
        const errorLogStream = createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });
        const appLogStream = createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });
        const httpLogStream = createWriteStream(path.join(logDir, 'http.log'), { flags: 'a' });

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                    ignore: 'pid,hostname',
                  },
                },
            customProps: (req: Request) => ({
              context: 'HTTP',
              user: req['user']?.id || 'anonymous',
              correlation: req.headers['x-correlation-id'] || 'none',
            }),
            serializers: {
              req: (req: Request) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                query: req.query,
                params: req.params,
                headers: {
                  'user-agent': req.headers['user-agent'],
                  'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
                  'x-correlation-id': req.headers['x-correlation-id'],
                  'authorization': req.headers['authorization'] ? '**present**' : '**none**',
                },
                body: isProduction ? '[redacted]' : (req.body || {}),
              }),
              res: (res: any) => ({
                statusCode: res.statusCode,
                headers:
                  typeof res.getHeaders === 'function'
                    ? res.getHeaders()
                    : res?.getHeader?.() || {},
              }),
              err: (err: Error) => ({
                type: err.constructor.name,
                message: err.message,
                stack: isProduction ? undefined : err.stack,
              }),
            },
            mixin: () => ({
              service: 'pharmacy-app-api',
              version: process.env.npm_package_version || 'unknown',
            }),
            stream: pino.multistream([
              { level: 'info', stream: appLogStream },
              { level: 'error', stream: errorLogStream },
              { level: 'trace', stream: httpLogStream },
              { level: 'debug', stream: process.stdout },
            ]),
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}