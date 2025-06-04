import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import path from 'path';

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly apiKeyMail: string;
  private readonly apiKeySms: string;
  private readonly emailFrom: string;
  private readonly smsSender: string;
  private readonly baseUrl = this.configService.get<string>('BREVO_MAIL_API_URL', 'https://api.brevo.com/v3');

  constructor(private readonly configService: ConfigService) {
    this.apiKeyMail = this.configService.get<string>('BREVO_API_KEY_MAIL', '');
    this.apiKeySms = this.configService.get<string>('BREVO_API_KEY_SMS', '');
    this.emailFrom = this.configService.get<string>('EMAIL_SENDER_ADDRESS', 'contact@pharmacy-app.com');
    this.smsSender = this.configService.get<string>('SMS_SENDER', 'PharmacyApp');
    
    if (!this.apiKeyMail) {
      this.logger.warn('BREVO_API_KEY_MAIL is not set. Email notifications will not work.');
    }
    
    if (!this.apiKeySms) {
      this.logger.warn('BREVO_API_KEY_SMS is not set. SMS notifications will not work.');
    }
  }

  /**
   * Charge un template depuis le système de fichiers avec support pour différents types de templates
   * @param name Nom du template sans extension
   * @param type Type de template (email ou sms)
   * @returns Contenu du template
   * @throws Error si le template n'est pas trouvé
   */
  private loadTemplate(name: string, type: 'email' | 'sms' = 'email'): string {
    // Construction du nom du fichier avec le type
    const fileName = type === 'sms' ? `${name}-sms.hbs` : `${name}-email.hbs`;
    const templatePath = path.join(process.cwd(), 'src', 'templates', fileName);
    
    if (!fs.existsSync(templatePath)) {
      // Essayer avec juste le nom sans type si le fichier avec type n'existe pas
      const fallbackPath = path.join(process.cwd(), 'src', 'templates', `${name}.hbs`);
      
      if (!fs.existsSync(fallbackPath)) {
        this.logger.error(`Template introuvable : ${templatePath} ou ${fallbackPath}`);
        throw new Error(`Template introuvable : ${name} (type: ${type})`);
      }
      
      this.logger.log(`Utilisation du template générique: ${fallbackPath}`);
      return fs.readFileSync(fallbackPath, 'utf8');
    }
    
    this.logger.log(`Chargement du template ${type}: ${templatePath}`);
    return fs.readFileSync(templatePath, 'utf8');
  }

  /**
   * Send an email using Brevo with a named template
   */
  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    data: any,
    fallbackTemplateName?: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKeyMail) {
      return { success: false, error: 'Brevo API key for email is not configured' };
    }
    
    try {
      // Récupérer le contenu du template
      // Utiliser la méthode adaptée pour les templates email
      let templateContent: string;
      
      try {
        // Essayer de charger le template email avec le type spécifié
        templateContent = this.loadTemplate(templateName, 'email');
      } catch (error) {
        // Si le template spécifique n'est pas trouvé, essayer un template générique
        if (fallbackTemplateName) {
          this.logger.warn(`Template ${templateName} non trouvé, utilisation du fallback: ${fallbackTemplateName}`);
          try {
            templateContent = this.loadTemplate(fallbackTemplateName, 'email');
          } catch (innerError) {
            // Si le fallback ne fonctionne pas non plus, utiliser un template en mémoire
            templateContent = this.getEmailTemplate(templateName) || 
                             this.getEmailTemplate(fallbackTemplateName) ||
                             this.getBasicTemplate('Notification', 'Message de notification générique');
          }
        } else {
          // Utiliser un template en mémoire
          templateContent = this.getEmailTemplate(templateName) || 
                           this.getBasicTemplate('Notification', 'Message de notification générique');
        }
      }
      
      // Ajouter l'année en cours et autres données contextuelles
      const enhancedData = {
        ...data,
        year: new Date().getFullYear(),
      };
      
      // Formater le contenu de l'email basé sur le template
      const { htmlContent, textContent } = this.formatEmailContent(templateContent, enhancedData);
      // Créer la charge utile de la requête
      const payload = {
        sender: {
          name: this.configService.get<string>('EMAIL_SENDER_NAME', 'Pharmacy App'),
          email: this.configService.get<string>('EMAIL_SENDER_ADDRESS', 'contact@pharmacy-app.com'),
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
        textContent: textContent,
      };
      
      // Envoyer l'email
      await axios.post(`${this.baseUrl}`, payload, {
        headers: {
          'api-key': this.apiKeyMail,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      this.logger.log(`📧 Email envoyé à ${to} avec le template ${templateName}`);
      return { success: true };
      
    } catch (error) {
      this.logger.error(`❌ Échec de l'envoi d'email à ${to}: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an SMS using Brevo
   */
  async sendSms(
    to: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKeySms) {
      return { success: false, error: 'Brevo API key for SMS is not configured' };
    }
    
    try {
      // Create the request payload
      const payload = {
        sender: this.smsSender,
        recipient: to,
        content: message,
        type: 'transactional',
      };
      
      // Send the SMS
      const response = await axios.post(`${this.baseUrl}/transactionalSMS/sms`, payload, {
        headers: {
          'api-key': this.apiKeySms,
          'Content-Type': 'application/json',
        },
      });
      
      this.logger.log(`📱 SMS envoyé à ${to}`);
      return { success: true };
      
    } catch (error) {
      this.logger.error(`❌ Échec de l'envoi SMS à ${to}: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie un email via l'API HTTP de Brevo avec un template Handlebars compilé
   */
  async sendTemplateEmail(
    to: string,
    subject: string,
    templateName: string,
    variables: Record<string, any>,
  ): Promise<void> {
    if (!this.apiKeyMail) {
      this.logger.error('Brevo API key for email is not configured');
      throw new Error('Brevo API key for email is not configured');
    }
    
    try {
      // Charger le template spécifiquement pour email
      const templateContent = this.loadTemplate(templateName, 'email');
      
      // Ajouter l'année en cours aux variables
      const enhancedVariables = {
        ...variables,
        year: new Date().getFullYear(),
      };
      
      // Compiler le template
      const compiled = handlebars.compile(templateContent);
      const htmlContent = compiled(enhancedVariables);

      const payload = {
        sender: {
          name: this.configService.get<string>('EMAIL_SENDER_NAME', 'Pharmacy App'),
          email: this.configService.get<string>('EMAIL_SENDER_ADDRESS', 'contact@pharmacy-app.com'),
        },
        to: [{ email: to }],
        subject,
        htmlContent,
      };

      await axios.post(this.baseUrl, payload, {
        headers: {
          'api-key': this.apiKeyMail,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      this.logger.log(`📧 Email envoyé à ${to} avec le template ${templateName}`);
    } catch (error) {
      this.logger.error(`❌ Échec de l'envoi d'email à ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Format email content based on template content and data
   */
  private formatEmailContent(templateContent: string, data: any): { htmlContent: string; textContent: string } {
    try {
      // Compiler directement le contenu du template avec Handlebars
      const template = handlebars.compile(templateContent);
      const htmlContent = template(data);
      
      // Générer le contenu texte en supprimant les balises HTML
      const textContent = htmlContent.replace(/<[^>]*>/g, '');
      
      return { htmlContent, textContent };
    } catch (error) {
      this.logger.error(`Erreur lors de la compilation du template: ${error.message}`);
      
      // En cas d'erreur, utiliser un template basique
      const fallbackHtml = this.getBasicTemplate(
        data.title || 'Notification', 
        data.message || JSON.stringify(data)
      );
      
      return {
        htmlContent: fallbackHtml,
        textContent: fallbackHtml.replace(/<[^>]*>/g, '')
      };
    }
  }
  
  /**
   * Get a basic HTML email template
   */
  private getBasicTemplate(title: string, message: string): string {
    return `
      <html>
        <body>
          <h1>${title}</h1>
          <p>${message}</p>
        </body>
      </html>
    `;
  }
  
  /**
   * Récupère un template email depuis la collection en mémoire
   * @param templateName Nom du template
   * @returns Le contenu du template ou undefined si non trouvé
   */
  private getEmailTemplate(templateName: string): string | undefined {
    const templates = this.getEmailTemplates();
    return templates[templateName];
  }
  
  /**
   * Get the collection of email templates
   */
  private getEmailTemplates(): Record<string, string> {
    return {
      'otp': `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4A90E2; color: white; padding: 10px 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .code { font-size: 24px; font-weight: bold; text-align: center; 
                      margin: 20px 0; padding: 10px; background: #e9e9e9; 
                      letter-spacing: 5px; color: #333; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pharmacy App</h1>
              </div>
              <div class="content">
                <h2>Votre Code de Vérification</h2>
                <p>Bonjour {{firstName}},</p>
                <p>Utilisez le code suivant pour vérifier votre identité:</p>
                <div class="code">{{otp}}</div>
                <p>Ce code expirera dans {{expiresIn}}.</p>
                <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet email ou contacter notre support.</p>
              </div>
              <div class="footer">
                <p>&copy; {{year}} Pharmacy App. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      'password_reset': `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4A90E2; color: white; padding: 10px 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .code { font-size: 24px; font-weight: bold; text-align: center; 
                      margin: 20px 0; padding: 10px; background: #e9e9e9; 
                      letter-spacing: 5px; color: #333; }
              .button { display: inline-block; padding: 10px 20px; 
                       background-color: #4A90E2; color: white; 
                       text-decoration: none; border-radius: 4px; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pharmacy App</h1>
              </div>
              <div class="content">
                <h2>Réinitialisation de Mot de Passe</h2>
                <p>Bonjour,</p>
                <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
                <p>Utilisez le code suivant pour réinitialiser votre mot de passe:</p>
                <div class="code">{{code}}</div>
                <p>Ce code expirera dans {{expiresIn}}.</p>
                <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email ou contacter notre support.</p>
              </div>
              <div class="footer">
                <p>&copy; {{year}} Pharmacy App. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      'order_confirmation': `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4A90E2; color: white; padding: 10px 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .order-details { margin: 20px 0; background: white; padding: 15px; border: 1px solid #ddd; }
              .item { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .total { border-top: 2px solid #ddd; font-weight: bold; padding-top: 10px; }
              .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pharmacy App</h1>
              </div>
              <div class="content">
                <h2>Confirmation de Commande</h2>
                <p>Bonjour {{firstName}},</p>
                <p>Votre commande #{{orderId}} a bien été confirmée.</p>
                <div class="order-details">
                  <h3>Détails de la commande:</h3>
                  {{#if items}}
                    {{#each items}}
                    <div class="item">
                      <span>{{this.name}} x {{this.quantity}}</span>
                      <span>{{this.price}}</span>
                    </div>
                    {{/each}}
                  {{/if}}
                  <div class="total">
                    <span>Total</span>
                    <span>{{total}}</span>
                  </div>
                </div>
                <p>Date de livraison estimée: {{deliveryDate}}</p>
                <p>Vous recevrez un email de suivi une fois votre commande expédiée.</p>
              </div>
              <div class="footer">
                <p>&copy; {{year}} Pharmacy App. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };
  }

  /**
   * Envoyer un SMS avec un template nommé
   * @param to Numéro de téléphone du destinataire
   * @param templateName Nom du template à utiliser
   * @param data Données à injecter dans le template
   * @returns Statut de succès et erreur éventuelle
   */
  async sendTemplateSms(
    to: string,
    templateName: string,
    data: Record<string, any>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.apiKeySms) {
        return { success: false, error: 'Brevo API key for SMS is not configured' };
      }

      // Charger le template spécifiquement pour SMS
      let templateContent;
      try {
        // Essayer d'abord de charger un template spécifique SMS
        templateContent = this.loadTemplate(templateName, 'sms');
      } catch (error) {
        this.logger.warn(`Template SMS ${templateName}-sms.hbs non trouvé, essai avec ${templateName}.hbs`);
        
        // Si exception, cela signifie qu'aucun template spécifique SMS n'a été trouvé
        // On utilise alors un template générique si possible
        const fallbackPath = path.join(process.cwd(), 'src', 'templates', `${templateName}.hbs`);
        if (fs.existsSync(fallbackPath)) {
          templateContent = fs.readFileSync(fallbackPath, 'utf8');
          this.logger.log(`Utilisation du template générique pour SMS: ${fallbackPath}`);
        } else {
          return { success: false, error: `Aucun template trouvé pour SMS: ${templateName}` };
        }
      }

      // Compiler le template avec les données
      const enhancedData = {
        ...data,
        year: new Date().getFullYear(),
      };
      
      const template = handlebars.compile(templateContent);
      const message = template(enhancedData);

      // Envoyer le SMS
      return this.sendSms(to, message);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du SMS template: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
