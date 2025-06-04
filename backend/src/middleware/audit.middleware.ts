import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('AuditMiddleware');
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Add unique request ID for correlation
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    req.headers['x-request-id'] = requestId;
    
    // Add correlation ID for distributed tracing
    const correlationId = req.headers['x-correlation-id'] as string || requestId;
    req.headers['x-correlation-id'] = correlationId;
    
    // Log the request
    const startTime = Date.now();
    const requestBody = req.method !== 'GET' ? { ...req.body } : undefined;
    
    // Remove sensitive data from logs
    if (requestBody) {
      if (requestBody.password) requestBody.password = '***REDACTED***';
      if (requestBody.passwordConfirmation) requestBody.passwordConfirmation = '***REDACTED***';
      if (requestBody.newPassword) requestBody.newPassword = '***REDACTED***';
      if (requestBody.confirmPassword) requestBody.confirmPassword = '***REDACTED***';
      if (requestBody.creditCard) requestBody.creditCard = '***REDACTED***';
      if (requestBody.token) requestBody.token = '***REDACTED***';
      if (requestBody.resetCode) requestBody.resetCode = '***REDACTED***';
    }
    
    this.logger.log(`Request started: ${req.method} ${req.url}`, {
      requestId,
      correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req['user']?.id || 'anonymous',
      body: requestBody,
    });
    
    // Capture response data
    const originalSend = res.send;
    res.send = function (...args) {
      res.send = originalSend;
      return originalSend.apply(res, args);
    };
    
    // Log once the response is finished
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const logMethod = res.statusCode >= 400 ? 'warn' : 'log';
      
      this.logger[logMethod](`Request completed: ${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`, {
        requestId,
        correlationId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime,
        userId: req['user']?.id || 'anonymous',
      });
      
      // Log to database for audit if it's a significant operation
      if (this.isSignificantOperation(req)) {
        this.logger.logBusinessEvent('AUDIT', {
          requestId,
          correlationId,
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          userId: req['user']?.id || 'anonymous',
          body: requestBody,
          timestamp: new Date().toISOString(),
        });
      }
    });
    
    next();
  }
  
  /**
   * Determine if an operation is significant enough to be logged to the database
   */
  private isSignificantOperation(req: Request): boolean {
    // Define the patterns for significant operations
    const significantOperations = [
      // Auth operations
      { method: 'POST', pathPattern: /\/api\/auth\/.*/ },
      // User operations
      { method: 'PUT', pathPattern: /\/api\/users\/.*/ },
      { method: 'DELETE', pathPattern: /\/api\/users\/.*/ },
      // Order operations
      { method: 'POST', pathPattern: /\/api\/orders/ },
      { method: 'PUT', pathPattern: /\/api\/orders\/.*/ },
      { method: 'DELETE', pathPattern: /\/api\/orders\/.*/ },
      // Payment operations
      { method: 'POST', pathPattern: /\/api\/payments\/.*/ },
      // Admin operations
      { method: 'POST', pathPattern: /\/api\/admin\/.*/ },
      { method: 'PUT', pathPattern: /\/api\/admin\/.*/ },
      { method: 'DELETE', pathPattern: /\/api\/admin\/.*/ },
    ];
    
    // Check if the request matches any significant operation pattern
    return significantOperations.some(operation => 
      req.method === operation.method && 
      operation.pathPattern.test(req.originalUrl || req.url)
    );
  }
}