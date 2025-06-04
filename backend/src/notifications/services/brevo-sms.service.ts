import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as handlebars from 'handlebars';

@Injectable()
export class BrevoSmsService {
  private readonly logger = new Logger(BrevoSmsService.name);
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly smsApiUrl: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY_SMS');
    this.sender = this.configService.get<string>('SMS_SENDER', 'PharmacyApp');
    this.smsApiUrl = this.configService.get<string>('BREVO_SMS_API_URL', 'https://api.brevo.com/v3/transactionalSMS/sms');
    
    this.isConfigured = !!this.apiKey;
    
    if (!this.isConfigured) {
      this.logger.warn('BREVO_API_KEY_SMS is not set. Brevo SMS notifications will not work.');
    } else {
      this.logger.log('Brevo SMS service initialized successfully');
    }
  }

  /**
   * Vérifie si le service est correctement configuré
   */
  get configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Envoie un SMS simple via l'API Brevo
   * @param to Numéro de téléphone du destinataire
   * @param message Contenu du SMS
   * @returns Résultat de l'envoi avec statut et erreur éventuelle
   */
  async sendSms(to: string, message: string): Promise<any> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED BREVO SMS] To: ${to}, Message: ${message}`);
      return {
        simulated: true,
        to,
        message,
        status: 'delivered',
        id: `brevo_sim_${Date.now()}`
      };
    }
    
    try {
      const payload = {
        sender: this.sender,
        recipient: to,
        content: message,
        type: 'transactional',
      };

      const response = await axios.post(this.smsApiUrl, payload, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      this.logger.log(`📱 SMS envoyé à ${to} via Brevo`);
      return {
        success: true,
        messageId: response.data?.messageId || `brevo_${Date.now()}`,
        to,
        message
      };
    } catch (error) {
      this.logger.error(`❌ Erreur d'envoi SMS via Brevo à ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Envoie un SMS basé sur un template avec des variables
   * @param to Numéro de téléphone du destinataire
   * @param template Template à utiliser
   * @param variables Variables à remplacer dans le template
   * @returns Résultat de l'envoi
   */
  async sendTemplateSms(to: string, template: string, variables: Record<string, any>): Promise<any> {
    try {
      // Ajouter l'année courante aux variables si elle n'est pas déjà présente
      const enhancedVariables = {
        year: new Date().getFullYear(),
        ...variables
      };
      
      // Utiliser Handlebars pour le remplacement de variables (cohérent avec le service mail)
      const compiled = handlebars.compile(template);
      const message = compiled(enhancedVariables);
      
      return await this.sendSms(to, message);
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la compilation du template SMS Brevo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envoie un SMS basé sur un template prédéfini
   * @param to Numéro de téléphone du destinataire
   * @param templateName Nom du template à utiliser
   * @param variables Variables à remplacer dans le template
   * @returns Résultat de l'envoi
   */
  async sendSmsWithPresetTemplate(to: string, templateName: string, variables: Record<string, any>): Promise<any> {
    // Récupérer le template par son nom
    const template = this.getSmsTemplate(templateName);
    if (!template) {
      throw new Error(`Template SMS "${templateName}" not found`);
    }
    
    return await this.sendTemplateSms(to, template, variables);
  }

  /**
   * Récupère le contenu d'un template prédéfini
   * @param templateName Nom du template
   * @returns Contenu du template ou null si non trouvé
   */
  private getSmsTemplate(templateName: string): string | null {
    const templates = this.getSmsTemplates();
    return templates[templateName] || null;
  }

  /**
   * Collection de templates SMS prédéfinis
   */
  private getSmsTemplates(): Record<string, string> {
    return {
      'otp': 'Votre code de vérification PharmacyApp: {{otp}}. Valide {{expiresIn}}.',
      
      'password_reset': 'PharmacyApp: Code de réinitialisation de mot de passe: {{code}}. Valide {{expiresIn}}. Ne le partagez avec personne.',
      
      'order_confirmation': 'PharmacyApp: Votre commande #{{orderId}} est confirmée. Total: {{total}}. Livraison prévue: {{deliveryDate}}. Merci!',
      
      'delivery_update': 'PharmacyApp: Votre commande #{{orderId}} est {{status}}. {{#if estimatedTime}}Livraison estimée: {{estimatedTime}}{{/if}}',
      
      'prescription_status': 'PharmacyApp: Votre prescription {{prescriptionId}} est désormais {{status}}. {{#if additionalInfo}}{{additionalInfo}}{{/if}}',
      
      'reminder': 'PharmacyApp: Rappel pour votre médicament {{medicineName}} à {{time}}. {{#if instructions}}Instructions: {{instructions}}{{/if}}'
    };
  }

  /**
   * Méthode simple pour remplacer des variables dans un template sans utiliser Handlebars
   * Utile pour des cas simples ou lorsque Handlebars n'est pas disponible
   * @param template Template avec variables au format {{variable}}
   * @param variables Variables à remplacer
   * @returns Template compilé avec variables remplacées
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce(
      (msg, [key, value]) => msg.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value),
      template,
    );
  }

  /**
   * Envoie un rappel de médicament (compatible avec le service Twilio existant)
   */
  async sendMedicationReminder(
    phoneNumber: string,
    medicineName: string,
    dosage: string,
    time: string
  ): Promise<any> {
    return this.sendSmsWithPresetTemplate(phoneNumber, 'reminder', {
      medicineName,
      time,
      instructions: dosage
    });
  }

  /**
   * Envoie une mise à jour de statut de commande (compatible avec le service Twilio existant)
   */
  async sendOrderStatusUpdate(
    phoneNumber: string,
    orderNumber: string,
    status: string
  ): Promise<any> {
    // Mapper le status à un texte en français pour la variable status
    const statusInFrench: Record<string, string> = {
      PROCESSING: 'en cours de traitement',
      READY: 'prête pour livraison',
      IN_TRANSIT: 'en route',
      DELIVERED: 'livrée',
      CANCELLED: 'annulée'
    };

    return this.sendSmsWithPresetTemplate(phoneNumber, 'delivery_update', {
      orderId: orderNumber,
      status: statusInFrench[status] || status
    });
  }
}
