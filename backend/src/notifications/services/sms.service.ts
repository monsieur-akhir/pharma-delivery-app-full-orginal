import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';
import { ConfigService } from '@nestjs/config';
import { BrevoSmsService } from './brevo-sms.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio;
  private twilioPhoneNumber: string;
  private isTwilioConfigured: boolean = false;
  private preferredProvider: 'twilio' | 'brevo' = 'twilio';

  constructor(
    private readonly configService: ConfigService,
    private readonly brevoSmsService: BrevoSmsService
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    // Déterminer le fournisseur préféré basé sur la configuration
    this.preferredProvider = this.configService.get<'twilio' | 'brevo'>('PREFERRED_SMS_PROVIDER', 'twilio');

    // Configurer Twilio
    if (accountSid && authToken && this.twilioPhoneNumber) {
      this.twilioClient = twilio(accountSid, authToken);
      this.isTwilioConfigured = true;
      this.logger.log('Twilio SMS service initialized successfully');
    } else {
      this.logger.warn('Twilio credentials not configured');
    }
    
    // Si aucun fournisseur n'est configuré, afficher un avertissement
    if (!this.isTwilioConfigured && !this.brevoSmsService.configured) {
      this.logger.warn('No SMS provider configured. SMS functionality will be simulated.');
    } else {
      this.logger.log(`Using ${this.preferredProvider} as preferred SMS provider`);
    }
  }

  /**
   * Send SMS to a phone number using the preferred provider
   * @param to - Recipient phone number (E.164 format)
   * @param message - SMS content
   * @param provider - Optional override for the provider to use
   * @returns Message details or simulation response
   */
  async sendSms(to: string, message: string, provider?: 'twilio' | 'brevo'): Promise<any> {
    try {
      // Validate phone number (basic validation)
      if (!this.isValidPhoneNumber(to)) {
        throw new Error(`Invalid phone number format: ${to}. Use E.164 format (e.g., +14155552671)`);
      }

      // Determine which provider to use
      const useProvider = provider || this.preferredProvider;
      
      // Si Brevo est demandé et configuré, utiliser Brevo
      if (useProvider === 'brevo' && this.brevoSmsService.configured) {
        return await this.brevoSmsService.sendSms(to, message);
      }
      
      // Si Twilio est demandé et configuré, utiliser Twilio
      if (useProvider === 'twilio' && this.isTwilioConfigured) {
        // Send actual SMS via Twilio
        const result = await this.twilioClient.messages.create({
          body: message,
          from: this.twilioPhoneNumber,
          to: to
        });

        this.logger.log(`SMS sent successfully to ${to} via Twilio. SID: ${result.sid}`);
        return result;
      }
      
      // Si aucun des fournisseurs demandés n'est configuré, essayer l'autre fournisseur
      if (useProvider === 'brevo' && !this.brevoSmsService.configured && this.isTwilioConfigured) {
        this.logger.warn(`Brevo SMS not configured, falling back to Twilio`);
        return this.sendSms(to, message, 'twilio');
      }
      
      if (useProvider === 'twilio' && !this.isTwilioConfigured && this.brevoSmsService.configured) {
        this.logger.warn(`Twilio SMS not configured, falling back to Brevo`);
        return this.sendSms(to, message, 'brevo');
      }

      // Si aucun fournisseur n'est configuré, simuler l'envoi
      this.logger.log(`[SIMULATED SMS] To: ${to}, Message: ${message}`);
      return {
        simulated: true,
        to,
        message,
        status: 'delivered',
        sid: `sim_${Date.now()}`
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a medication reminder
   * @param phoneNumber - Recipient's phone number
   * @param medicineName - Name of the medicine
   * @param dosage - Dosage information
   * @param time - Time to take medicine
   * @returns SMS sending result
   */
  async sendMedicationReminder(
    phoneNumber: string,
    medicineName: string,
    dosage: string,
    time: string
  ): Promise<any> {
    const message = `RAPPEL MÉDICAMENT: Il est temps de prendre ${medicineName} (${dosage}) à ${time}. Ne manquez pas votre dose!`;
    
    return this.sendSms(phoneNumber, message);
  }

  /**
   * Send order status update notification
   * @param phoneNumber - Customer's phone number
   * @param orderNumber - Order reference number
   * @param status - New order status
   * @returns SMS sending result
   */
  async sendOrderStatusUpdate(
    phoneNumber: string,
    orderNumber: string,
    status: string
  ): Promise<any> {
    const statusMessages: Record<string, string> = {
      PROCESSING: `Votre commande #${orderNumber} est en cours de traitement.`,
      READY: `Votre commande #${orderNumber} est prête et en attente de livraison.`,
      IN_TRANSIT: `Votre commande #${orderNumber} est en route! Suivez la livraison dans l'application.`,
      DELIVERED: `Votre commande #${orderNumber} a été livrée. Merci d'avoir utilisé notre service!`,
      CANCELLED: `Votre commande #${orderNumber} a été annulée. Contactez-nous pour plus d'informations.`
    };
    
    const message = statusMessages[status] || `Mise à jour de la commande #${orderNumber}: ${status}`;
    
    return this.sendSms(phoneNumber, message);
  }

  /**
   * Validate phone number format (basic validation)
   * @param phoneNumber - Phone number to validate
   * @returns true if phone number format is valid
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation (starts with + followed by digits)
    return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
  }
}