/**
 * Utility functions for personalized greetings across the application
 */

export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const getPersonalizedGreeting = (firstName?: string, fallbackEmail?: string): string => {
  const timeGreeting = getTimeBasedGreeting();
  
  if (firstName && firstName.trim()) {
    return `${timeGreeting}, ${firstName}`;
  }
  
  if (fallbackEmail) {
    return `${timeGreeting}, ${fallbackEmail}`;
  }
  
  return timeGreeting;
};

export const getWelcomeMessage = (firstName?: string): string => {
  if (firstName && firstName.trim()) {
    return `Welcome back, ${firstName}`;
  }
  return "Welcome back";
};