import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService implements NestLoggerService {
  private currentContext: string;

  constructor(private readonly logger: PinoLogger) {
    // Set the context for all logs from this instance
    this.setContext('LoggerService');
  }

  /**
   * Set the context for all subsequent logs
   */
  setContext(context: string) {
    this.logger.setContext(context);
    this.currentContext = context;
  }

  /**
   * Log a verbose message
   */
  verbose(message: any, ...optionalParams: any[]) {
    this.logger.trace(this.formatMessage(message, optionalParams));
  }

  /**
   * Log a debug message
   */
  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(this.formatMessage(message, optionalParams));
  }

  /**
   * Log an informational message
   */
  log(message: any, ...optionalParams: any[]) {
    this.logger.info(this.formatMessage(message, optionalParams));
  }

  /**
   * Log a warning message
   */
  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(this.formatMessage(message, optionalParams));
  }

  /**
   * Log an error message
   */
  error(message: any, ...optionalParams: any[]) {
    // If the message is an Error object, we extract the stack trace
    if (message instanceof Error) {
      this.logger.error(
        { 
          err: message,
          stack: message.stack,
          ...this.extractMetadata(optionalParams),
        },
        message.message
      );
      return;
    }

    this.logger.error(this.formatMessage(message, optionalParams));
  }

  /**
   * Log an exception with stack trace
      { 
        err: error,
        stack: error.stack,
        context: context || this.currentContext
      },
      error.message
    );
      },
      error.message
    );
  }

  /**
   * Log a business event
   */
  logBusinessEvent(eventType: string, data: Record<string, any>) {
    this.logger.info({ eventType, data }, `Business event: ${eventType}`);
  }

  /**
   * Log a database operation
   */
  logDatabaseOperation(operation: string, tableName: string, data?: Record<string, any>) {
    this.logger.debug(
      { operation, tableName, data },
      `Database operation: ${operation} on ${tableName}`
    );
  }

  /**
   * Log a security event
   */
  logSecurityEvent(eventType: string, userId: string | number, details: Record<string, any>) {
    this.logger.info(
      { eventType, userId, details },
      `Security event: ${eventType} for user ${userId}`
    );
  }

  /**
   * Log an API request
   */
  logApiRequest(method: string, path: string, userId?: string | number, requestBody?: Record<string, any>) {
    this.logger.info(
      { method, path, userId, requestBody },
      `API Request: ${method} ${path}${userId ? ` by user ${userId}` : ''}`
    );
  }

  /**
   * Format the message with optional parameters
   */
  private formatMessage(message: any, optionalParams: any[]): any {
    if (optionalParams.length === 0) {
      return message;
    }

    // If we have a single object as the first optional parameter,
    // we'll merge it with the message if message is a string
    if (
      optionalParams.length === 1 &&
      typeof optionalParams[0] === 'object' &&
      optionalParams[0] !== null &&
      !Array.isArray(optionalParams[0])
    ) {
      return typeof message === 'string'
        ? { msg: message, ...optionalParams[0] }
        : { msg: message, data: optionalParams[0] };
    }

    // Otherwise, we'll include the optional params as an array
    return { msg: message, params: optionalParams };
  }

  /**
   * Extract metadata from optional parameters
   */
  private extractMetadata(optionalParams: any[]): Record<string, any> {
    if (optionalParams.length === 0) {
      return {};
    }

    // If the first parameter is an object, we'll use it as metadata
    if (
      typeof optionalParams[0] === 'object' &&
      optionalParams[0] !== null &&
      !Array.isArray(optionalParams[0])
    ) {
      return optionalParams[0];
    }

    // Otherwise, we'll include all params as a single metadata field
    return { params: optionalParams };
  }
}