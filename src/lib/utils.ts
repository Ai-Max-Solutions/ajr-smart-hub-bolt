import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates and sanitizes signature data before saving to database
 * @param signatureData - The signature data URL from canvas
 * @returns Sanitized base64 string
 * @throws Error if signature is invalid
 */
export function validateAndSanitizeSignature(signatureData: string): string {
  if (!signatureData || typeof signatureData !== 'string') {
    throw new Error('Invalid signature. Please sign again.');
  }

  // Check if it's a data URL
  if (!signatureData.startsWith('data:image/')) {
    throw new Error('Invalid signature format. Please sign again.');
  }

  // Split on comma to separate metadata from base64 data
  const parts = signatureData.split(',');
  if (parts.length !== 2) {
    throw new Error('Invalid signature format. Please sign again.');
  }

  const [metadata, base64Data] = parts;

  // Validate metadata contains "base64"
  if (!metadata.includes('base64')) {
    throw new Error('Invalid signature encoding. Please sign again.');
  }

  // Validate base64 format using regex
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
  if (!base64Regex.test(base64Data)) {
    throw new Error('Invalid signature data. Please sign again.');
  }

  // Return sanitized base64 string
  return base64Data;
}
