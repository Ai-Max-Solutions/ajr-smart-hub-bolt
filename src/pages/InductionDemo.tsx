import React from 'react';
import { InductionQRDemo } from '@/components/inductions/InductionQRDemo';

const InductionDemo: React.FC = () => {
  const handleComplete = () => {
    console.log('Induction demo completed');
  };

  return (
    <div>
      <InductionQRDemo onComplete={handleComplete} />
    </div>
  );
};

export default InductionDemo;