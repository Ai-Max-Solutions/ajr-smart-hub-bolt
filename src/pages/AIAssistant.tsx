import React from 'react';
import { AIDashboard } from '@/components/ai/AIDashboard';
import { RouteProtection } from '@/components/auth/RouteProtection';

const AIAssistant = () => {
  return (
    <RouteProtection fallbackPath="/auth">
      <div className="min-h-screen bg-background">
        <AIDashboard />
      </div>
    </RouteProtection>
  );
};

export default AIAssistant;