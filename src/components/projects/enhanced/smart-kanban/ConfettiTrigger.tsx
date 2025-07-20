import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';

export const ConfettiTrigger: React.FC = () => {
  useEffect(() => {
    // Trigger confetti animation
    const triggerConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#047857'],
      });
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(triggerConfetti, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute top-2 right-2 animate-bounce">
      <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
        <Trophy className="h-3 w-3" />
        <span>Unit Complete!</span>
      </div>
    </div>
  );
};