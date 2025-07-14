/**
 * Centralized validation utilities for forms and data
 */

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
  return password && password.length >= 8;
};

// Phone number validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone && phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// File validation
export const isValidFile = (file, options = {}) => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options; // 10MB default
  
  if (!file) return false;
  if (file.size > maxSize) return false;
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) return false;
  
  return true;
};

// Number validation
export const isValidNumber = (value, options = {}) => {
  const { min, max, integer = false } = options;
  const num = Number(value);
  
  if (isNaN(num)) return false;
  if (integer && !Number.isInteger(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};

// Required field validation
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = fieldRules.message || 'This field is required';
      return;
    }
    
    if (fieldRules.email && value && !isValidEmail(value)) {
      errors[field] = fieldRules.message || 'Invalid email address';
      return;
    }
    
    if (fieldRules.password && value && !isValidPassword(value)) {
      errors[field] = fieldRules.message || 'Password must be at least 8 characters';
      return;
    }
    
    if (fieldRules.phone && value && !isValidPhone(value)) {
      errors[field] = fieldRules.message || 'Invalid phone number';
      return;
    }
    
    if (fieldRules.url && value && !isValidUrl(value)) {
      errors[field] = fieldRules.message || 'Invalid URL';
      return;
    }
    
    if (fieldRules.number && value && !isValidNumber(value, fieldRules.numberOptions)) {
      errors[field] = fieldRules.message || 'Invalid number';
      return;
    }
    
    if (fieldRules.custom && value && !fieldRules.custom(value, data)) {
      errors[field] = fieldRules.message || 'Invalid value';
      return;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    email: true,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    password: true,
    message: 'Password must be at least 8 characters'
  },
  confirmPassword: (passwordField) => ({
    required: true,
    custom: (value, data) => value === data[passwordField],
    message: 'Passwords do not match'
  }),
  phone: {
    required: true,
    phone: true,
    message: 'Please enter a valid phone number'
  },
  url: {
    required: true,
    url: true,
    message: 'Please enter a valid URL'
  },
  price: {
    required: true,
    number: true,
    numberOptions: { min: 0 },
    message: 'Please enter a valid price'
  },
  quantity: {
    required: true,
    number: true,
    numberOptions: { min: 1, integer: true },
    message: 'Please enter a valid quantity'
  }
};