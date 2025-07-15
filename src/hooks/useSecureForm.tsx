import { useState } from 'react';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';

interface UseSecureFormOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  rateLimitEndpoint?: string;
}

export const useSecureForm = <T,>({ schema, onSubmit, rateLimitEndpoint }: UseSecureFormOptions<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const checkRateLimit = async (endpoint: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/check-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint })
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.allowed;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false; // Fail closed for security
    }
  };

  const validateAndSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setErrors({});

      // Check rate limit if endpoint specified
      if (rateLimitEndpoint) {
        const rateLimitOk = await checkRateLimit(rateLimitEndpoint);
        if (!rateLimitOk) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please try again later.",
            variant: "destructive"
          });
          return;
        }
      }

      // Sanitize all string inputs recursively
      const sanitizedData = sanitizeFormData(formData);

      // Validate with schema
      const validatedData = schema.parse(sanitizedData);

      // Submit the validated data
      await onSubmit(validatedData);

      toast({
        title: "Success",
        description: "Form submitted successfully",
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);

        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive"
        });
      } else {
        console.error('Form submission error:', error);
        toast({
          title: "Submission Error",
          description: "Failed to submit form. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sanitizeFormData = (data: any): any => {
    if (typeof data === 'string') {
      return sanitizeInput(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(sanitizeFormData);
    }
    
    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = sanitizeFormData(value);
      }
      return sanitized;
    }
    
    return data;
  };

  const getFieldError = (fieldName: string) => errors[fieldName];

  const clearError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  return {
    validateAndSubmit,
    isSubmitting,
    errors,
    getFieldError,
    clearError
  };
};