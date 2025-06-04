## Améliorations du Service d'Emails Brevo

### Résumé des modifications
Ce document résume les améliorations apportées au service d'emails Brevo de l'application Pharmacy App.
### Modifications principales
1. **Intégration de Handlebars**
   - Ajout de la bibliothèque Handlebars pour le templating d'emails
   - Création d'une méthode `sendTemplateEmail` pour utiliser directement des templates Handlebars personnalisés

2. **Templates basés sur des fichiers**
   - Ajout d'un dossier `templates` pour stocker les templates HTML d'emails
   - Implémentation du chargement de templates depuis des fichiers
   - Création de templates pour les cas d'usage courants (OTP, réinitialisation de mot de passe, etc.)

3. **Amélioration des templates existants**
   - Design responsive et moderne pour les emails
   - Support des variables dynamiques (prénom, code OTP, date d'expiration, etc.)
   - Meilleure présentation des informations importantes

4. **Gestion améliorée des erreurs**
   - Meilleure journalisation des erreurs d'envoi
   - Fallback en cas d'échec de chargement ou de compilation des templates
   - Messages d'erreur explicites pour faciliter le débogage

### Comment utiliser les templates

#### Envoi d'email avec template intégré
```typescript
// Exemple d'envoi d'un email pour l'OTP
await brevoService.sendEmail(
  'utilisateur@example.com',
  'Votre code de vérification',
  'otp',
  { 
    otp: '123456', 
    expiresIn: '10 minutes',
    firstName: 'Jean'
  }
);
```

#### Envoi d'email avec template personnalisé
```typescript
// Exemple d'envoi d'un email avec un template Handlebars personnalisé
const template = `
  <html>
    <body>
      <h1>{{title}}</h1>
      <p>Bonjour {{name}},</p>
      <p>{{message}}</p>
    </body>
  </html>
`;

await brevoService.sendTemplateEmail(
  'utilisateur@example.com',
  'Notification personnalisée',
  template,
  {
    title: 'Notification importante',
    name: 'Jean',
    message: 'Votre commande est prête'
  }
);
```
### Templates disponibles
1. **otp** - Code de vérification OTP
2. **password_reset** - Réinitialisation de mot de passe
3. **order_confirmation** - Confirmation de commande

### Scripts de test
Un script de test a été créé pour vérifier le bon fonctionnement du service :
```bash
node scripts/test-brevo-email.js
```
### Configuration requise
Les variables d'environnement suivantes doivent être configurées :
- `BREVO_API_KEY_MAIL` - Clé API Brevo pour l'envoi d'emails
- `BREVO_API_KEY_SMS` - Clé API Brevo pour l'envoi de SMS (optionnel)
- `EMAIL_FROM` - Adresse email d'expédition
- `SMS_SENDER` - Nom de l'expéditeur pour les SMS (optionnel)