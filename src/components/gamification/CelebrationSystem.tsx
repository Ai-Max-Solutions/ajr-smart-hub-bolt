import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CelebrationProps {
  show: boolean;
  onComplete: () => void;
  type: 'bonus' | 'completion' | 'achievement';
  message?: string;
  points?: number;
}

export const CelebrationSystem: React.FC<CelebrationProps> = ({
  show,
  onComplete,
  type,
  message,
  points = 0
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show) {
      setShowConfetti(true);
      
      // Play success sound (using Web Audio API)
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(900, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);

      // Show personalized toast
      const getPersonalizedMessage = () => {
        const firstName = (user as any)?.name?.split(' ')[0] || 'Mark';
        
        switch (type) {
          case 'bonus':
            return `🎉 Bonus unlocked, ${firstName}! ${message || 'Early finish for Maxwell\'s match!'}`;
          case 'completion':
            return `⚡ Smashed it, ${firstName}! ${message || 'Time for the boys!'} ${points > 0 ? `+${points} points` : ''}`;
          case 'achievement':
            return `🏆 Achievement unlocked, ${firstName}! ${message || 'You\'re on fire!'}`;
          default:
            return `🎯 Nice work, ${firstName}! ${message || 'Keep crushing it!'}`;
        }
      };

      toast({
        title: getPersonalizedMessage(),
        description: points > 0 ? `+${points} points earned` : undefined,
        duration: 5000,
      });

      // Auto-hide confetti after 3 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, type, message, points, user, toast, onComplete]);

  if (!showConfetti) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={type === 'achievement' ? 200 : 100}
        colors={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']}
      />
    </div>
  );
};

export default CelebrationSystem;