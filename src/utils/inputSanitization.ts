/**
 * Input sanitization utilities for security
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize user input for database queries - Enhanced version
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break queries
    .replace(/[;&|`$]/g, '') // Remove command injection characters
    .replace(/--/g, '') // Remove SQL comment markers
    .replace(/\/\*/g, '') // Remove SQL block comment start
    .replace(/\*\//g, '') // Remove SQL block comment end
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize work log data with comprehensive validation
 */
export function sanitizeWorkLogData(data: any): {
  isValid: boolean;
  sanitizedData?: any;
  errors?: string[];
} {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate required fields
  if (!data.plot_id || typeof data.plot_id !== 'string') {
    errors.push('Valid plot ID is required');
  } else {
    sanitized.plot_id = data.plot_id;
  }

  if (!data.work_category_id || typeof data.work_category_id !== 'string') {
    errors.push('Valid work category ID is required');
  } else {
    sanitized.work_category_id = data.work_category_id;
  }

  // Sanitize and validate hours
  const hours = parseFloat(data.hours);
  if (isNaN(hours) || hours <= 0 || hours > 24) {
    errors.push('Hours must be between 0 and 24');
  } else {
    sanitized.hours = hours;
  }

  // Sanitize text fields
  if (data.notes) {
    sanitized.notes = sanitizeInput(data.notes);
  }

  if (data.voice_transcript) {
    sanitized.voice_transcript = sanitizeInput(data.voice_transcript);
  }

  // Validate status
  const validStatuses = ['pending', 'in_progress', 'completed'];
  if (data.status && validStatuses.includes(data.status)) {
    sanitized.status = data.status;
  } else {
    sanitized.status = 'pending';
  }

  return {
    isValid: errors.length === 0,
    sanitizedData: errors.length === 0 ? sanitized : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate user role to prevent privilege escalation
 */
export function validateUserRole(role: string): boolean {
  const validRoles = ['Operative', 'Supervisor', 'PM', 'Admin', 'Director'];
  return validRoles.includes(role);
}

/**
 * Sanitize file names for uploads
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .substring(0, 255); // Limit filename length
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
} {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must contain an uppercase letter' };
  }
  
  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must contain a lowercase letter' };
  }
  
  if (!hasNumbers) {
    return { isValid: false, message: 'Password must contain a number' };
  }
  
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain a special character' };
  }

  return { isValid: true, message: 'Password strength is good' };
}

/**
 * Rate limiting for client-side actions
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const keyAttempts = this.attempts.get(key)!;
    
    // Remove old attempts outside the window
    const recentAttempts = keyAttempts.filter(time => time > windowStart);
    this.attempts.set(key, recentAttempts);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    return true;
  }
}

export const rateLimiter = new RateLimiter();