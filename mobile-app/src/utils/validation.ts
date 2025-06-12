import * as Yup from 'yup';

// Phone number validation function
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Check if it's a valid format (starts with + and has 8-15 digits)
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  return phoneRegex.test(cleanPhone);
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// OTP validation
export const validateOtp = (otp: string): boolean => {
  // 6 digit OTP
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

// Validation schemas using Yup
export const loginSchema = Yup.object().shape({
  phone: Yup.string()
    .required('Numéro de téléphone requis')
    .test('phone', 'Numéro de téléphone invalide', (value) => {
      return value ? validatePhone(value) : false;
    }),
  password: Yup.string()
    .required('Mot de passe requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const otpSchema = Yup.object().shape({
  phone: Yup.string()
    .required('Numéro de téléphone requis')
    .test('phone', 'Numéro de téléphone invalide', (value) => {
      return value ? validatePhone(value) : false;
    }),
  otp: Yup.string()
    .required('Code OTP requis')
    .test('otp', 'Code OTP invalide', validateOtp),
});

export const registerSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('Prénom requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: Yup.string()
    .required('Nom requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: Yup.string()
    .required('Numéro de téléphone requis')
    .test('phone', 'Numéro de téléphone invalide', (value) => {
      return value ? validatePhone(value) : false;
    }),
  email: Yup.string()
    .email('Email invalide')
    .required('Email requis'),
  password: Yup.string()
    .required('Mot de passe requis')
    .test('password', 'Mot de passe invalide', validatePassword),
  confirmPassword: Yup.string()
    .required('Confirmation du mot de passe requise')
    .oneOf([Yup.ref('password')], 'Les mots de passe doivent correspondre'),
});

export const passwordResetSchema = Yup.object().shape({
  phone: Yup.string()
    .required('Numéro de téléphone requis')
    .test('phone', 'Numéro de téléphone invalide', (value) => {
      return value ? validatePhone(value) : false;
    }),
  otp: Yup.string()
    .required('Code OTP requis')
    .test('otp', 'Code OTP invalide', validateOtp),
  newPassword: Yup.string()
    .required('Nouveau mot de passe requis')
    .test('password', 'Mot de passe invalide', validatePassword),
  confirmPassword: Yup.string()
    .required('Confirmation du mot de passe requise')
    .oneOf([Yup.ref('newPassword')], 'Les mots de passe doivent correspondre'),
});

// Address validation
export const addressSchema = Yup.object().shape({
  street: Yup.string()
    .required('Rue requise')
    .min(5, 'L\'adresse doit être plus détaillée'),
  city: Yup.string()
    .required('Ville requise')
    .min(2, 'Nom de ville invalide'),
  postalCode: Yup.string()
    .required('Code postal requis')
    .matches(/^\d{5}$/, 'Code postal invalide'),
  country: Yup.string()
    .required('Pays requis'),
});

// Payment validation
export const paymentSchema = Yup.object().shape({
  cardNumber: Yup.string()
    .required('Numéro de carte requis')
    .matches(/^\d{16}$/, 'Numéro de carte invalide'),
  expiryDate: Yup.string()
    .required('Date d\'expiration requise')
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
  cvv: Yup.string()
    .required('CVV requis')
    .matches(/^\d{3,4}$/, 'CVV invalide'),
  cardholderName: Yup.string()
    .required('Nom du titulaire requis')
    .min(2, 'Nom invalide'),
});

// Mobile money validation
export const mobileMoneySchema = Yup.object().shape({
  phoneNumber: Yup.string()
    .required('Numéro de téléphone requis')
    .test('phone', 'Numéro de téléphone invalide', (value) => {
      return value ? validatePhone(value) : false;
    }),
  provider: Yup.string()
    .required('Fournisseur requis')
    .oneOf(['mtn', 'orange', 'airtel'], 'Fournisseur non supporté'),
});

export default {
  validatePhone,
  validateEmail,
  validatePassword,
  validateOtp,
  loginSchema,
  otpSchema,
  registerSchema,
  passwordResetSchema,
  addressSchema,
  paymentSchema,
  mobileMoneySchema,
};