
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

export const getConstructionGreeting = (firstName?: string): string => {
  const timeGreeting = getTimeBasedGreeting();
  
  if (firstName && firstName.trim()) {
    return `${timeGreeting}, ${firstName}—let's smash today's jobs!`;
  }
  
  return `${timeGreeting}—let's get building!`;
};

export const getMotivationalMessage = (firstName?: string): string => {
  const messages = [
    "Time to build something amazing!",
    "Every project starts with a strong foundation!",
    "Safety first, excellence always!",
    "Building the future, one project at a time!"
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  if (firstName && firstName.trim()) {
    return `${firstName}, ${randomMessage.toLowerCase()}`;
  }
  
  return randomMessage;
};

export const getProjectSuccessMessage = (firstName?: string, projectName?: string): string => {
  if (firstName && firstName.trim()) {
    return `Brilliant work, ${firstName}! ${projectName || 'Project'} is ready to roll—efficiency at its finest! 🚧💪`;
  }
  
  return `Project created successfully! Ready to build something amazing! 🚧💪`;
};
