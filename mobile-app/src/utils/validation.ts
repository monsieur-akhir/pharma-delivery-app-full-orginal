
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
