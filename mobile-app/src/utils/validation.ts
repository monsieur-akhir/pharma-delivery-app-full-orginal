import * as yup from 'yup';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation for international formats
export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+[1-9]\d{1,14}|0[1-9]\d{7,9})$/;
  return phoneRegex.test(cleanPhone);
};

// Password validation
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation schemas with Yup
export const authSchemas = {
  login: yup.object().shape({
    email: yup
      .string()
      .email('Email invalide')
      .required('Email requis'),
    password: yup
      .string()
      .min(6, 'Mot de passe trop court')
      .required('Mot de passe requis'),
  }),

  register: yup.object().shape({
    firstName: yup
      .string()
      .min(2, 'Prénom trop court')
      .required('Prénom requis'),
    lastName: yup
      .string()
      .min(2, 'Nom trop court')
      .required('Nom requis'),
    email: yup
      .string()
      .email('Email invalide')
      .required('Email requis'),
    phone: yup
      .string()
      .test('phone', 'Numéro de téléphone invalide', validatePhone)
      .required('Numéro de téléphone requis'),
    password: yup
      .string()
      .min(8, 'Mot de passe trop court')
      .required('Mot de passe requis'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
      .required('Confirmation requise'),
  }),

  otp: yup.object().shape({
    code: yup
      .string()
      .length(6, 'Le code doit contenir 6 chiffres')
      .matches(/^\d+$/, 'Le code doit contenir uniquement des chiffres')
      .required('Code OTP requis'),
  }),
};

export const prescriptionSchemas = {
  upload: yup.object().shape({
    image: yup
      .mixed()
      .required('Image de prescription requise'),
    notes: yup
      .string()
      .max(500, 'Notes trop longues (max 500 caractères)')
      .optional(),
  }),
};

export const orderSchemas = {
  create: yup.object().shape({
    pharmacyId: yup
      .string()
      .required('Pharmacie requise'),
    deliveryAddress: yup
      .string()
      .min(10, 'Adresse trop courte')
      .required('Adresse de livraison requise'),
    paymentMethod: yup
      .string()
      .oneOf(['card', 'mobile_money', 'cash'], 'Méthode de paiement invalide')
      .required('Méthode de paiement requise'),
  }),
};

export const paymentSchemas = {
  card: yup.object().shape({
    cardNumber: yup
      .string()
      .matches(/^\d{16}$/, 'Numéro de carte invalide')
      .required('Numéro de carte requis'),
    expiryDate: yup
      .string()
      .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Date d\'expiration invalide (MM/YY)')
      .required('Date d\'expiration requise'),
    cvv: yup
      .string()
      .matches(/^\d{3,4}$/, 'CVV invalide')
      .required('CVV requis'),
    holderName: yup
      .string()
      .min(2, 'Nom du porteur requis')
      .required('Nom du porteur requis'),
  }),

  mobileMoney: yup.object().shape({
    phoneNumber: yup
      .string()
      .test('phone', 'Numéro de téléphone invalide', validatePhone)
      .required('Numéro de téléphone requis'),
    provider: yup
      .string()
      .oneOf(['orange', 'mtn', 'moov'], 'Opérateur invalide')
      .required('Opérateur requis'),
  }),
};

// Helper function to validate against schema
export const validateSchema = async (schema: yup.Schema, data: any): Promise<{
  isValid: boolean;
  errors: Record<string, string>;
}> => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Erreur de validation' } };
  }
};

export const ValidationRules = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'Ce champ est requis';
    }
    return null;
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Format d\'email invalide';
    }
    return null;
  },

  phone: (value: string) => {
    const phoneRegex = /^(\+225)?[0-9]{8,10}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Numéro de téléphone invalide';
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `Minimum ${min} caractères requis`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return `Maximum ${max} caractères autorisés`;
    }
    return null;
  }
};

export const validateForm = (values: Record<string, any>, rules: Record<string, Function[]>) => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = values[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return errors;
};