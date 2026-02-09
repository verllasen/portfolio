import type { ValidationRule } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateCode = (code: string, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'regex':
        try {
          const regex = new RegExp(rule.value, 'i'); // Case insensitive by default
          if (!regex.test(code)) {
            errors.push(rule.errorMsg);
          }
        } catch (e) {
          console.error('Invalid regex in rule:', rule);
          errors.push(`System Error: Invalid validation rule ${rule.id}`);
        }
        break;

      case 'includes':
        if (!code.includes(rule.value)) {
          errors.push(rule.errorMsg);
        }
        break;

      case 'notIncludes':
        if (code.includes(rule.value)) {
          errors.push(rule.errorMsg);
        }
        break;

      case 'minLength':
        if (code.length < parseInt(rule.value, 10)) {
          errors.push(rule.errorMsg);
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
