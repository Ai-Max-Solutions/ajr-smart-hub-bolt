import { z } from 'zod';

// Enhanced input sanitization for frontend
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  
  // Remove dangerous patterns
  let sanitized = input
    .replace(/(--|\/\*|\*\/|;|\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bALTER\b|\bCREATE\b|\bEXEC\b|\bEXECUTE\b)/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b)/gi, '');
  
  // Limit length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized.trim();
};

// Enhanced validation schemas with sanitization
export const secureStringSchema = z.string()
  .max(1000, "Input too long")
  .transform(sanitizeInput)
  .refine(val => val.length > 0, "Field cannot be empty after sanitization");

export const secureTextSchema = z.string()
  .max(5000, "Input too long")
  .transform(sanitizeInput)
  .optional();

export const phoneSchema = z.string()
  .max(20, "Phone number too long")
  .regex(/^[\+]?[\d\s\-\(\)]+$/, "Invalid phone number format")
  .transform(sanitizeInput)
  .optional();

export const emailSchema = z.string()
  .max(254, "Email too long")
  .email("Invalid email format")
  .transform(sanitizeInput);

// User profile validation with enhanced security
export const userProfileSchema = z.object({
  firstName: z.string().max(50, "First name too long").transform(sanitizeInput),
  lastName: z.string().max(50, "Last name too long").transform(sanitizeInput),
  phone: phoneSchema,
  skills: z.array(z.string().transform(sanitizeInput)).optional(),
  emergencyContact: secureTextSchema,
  emergencyPhone: phoneSchema,
});

// Contractor profile validation
export const contractorProfileSchema = z.object({
  firstName: z.string().max(50, "First name too long").transform(sanitizeInput),
  lastName: z.string().max(50, "Last name too long").transform(sanitizeInput),
  email: emailSchema,
  phone: phoneSchema,
  jobRole: z.string().max(100, "Job role too long").transform(sanitizeInput),
  vehicleRegistration: z.string()
    .max(10, "Vehicle registration too long")
    .regex(/^[A-Z0-9\s]{2,10}$/, "Invalid vehicle registration")
    .transform(sanitizeInput)
    .optional(),
  emergencyContactName: secureTextSchema,
  emergencyContactPhone: phoneSchema,
});

// RAMS document validation
export const ramsDocumentSchema = z.object({
  title: z.string().max(200, "Title too long").transform(sanitizeInput),
  description: secureTextSchema,
  version: z.string()
    .max(10, "Version too long")
    .regex(/^\d+\.\d+$/, "Version must be in format X.Y")
    .transform(sanitizeInput),
  workActivities: z.array(z.string().transform(sanitizeInput)).min(1, "At least one work activity required"),
});

// Project validation
export const projectSchema = z.object({
  projectName: z.string().max(200, "Project name too long").transform(sanitizeInput),
  description: secureTextSchema,
  siteAddress: secureTextSchema,
  siteContact: secureTextSchema,
  sitePhone: phoneSchema,
});

// Rate limiting check
export const checkRateLimit = async (endpoint: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/check-rate-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    });
    
    if (!response.ok) {
      throw new Error('Rate limit check failed');
    }
    
    const data = await response.json();
    return data.allowed;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return false; // Fail closed
  }
};

// File upload validation
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = /(<script|javascript:|data:text\/html|\.exe|\.bat|\.sh)$/i;
  if (suspiciousPatterns.test(file.name)) {
    return { valid: false, error: 'Suspicious file name detected' };
  }
  
  return { valid: true };
};

// Content Security Policy headers
export const getCSPHeaders = () => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
});