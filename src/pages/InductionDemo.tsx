import React from 'react';
import InductionQRDemo from '@/components/inductions/InductionQRDemo';

const InductionDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <InductionQRDemo 
        showVoiceGuide={true}
        allowLanguageSwitch={true}
        onComplete={() => {
          console.log('Induction completed successfully');
        }}
      />
    </div>
  );
};

export default InductionDemo;