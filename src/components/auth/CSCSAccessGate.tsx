import React from 'react';

interface CSCSAccessGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const CSCSAccessGate: React.FC<CSCSAccessGateProps> = ({ 
  children 
}) => {
  // 🚫 CSCS validation temporarily disabled
  console.info('[CSCS] Gate fully disabled – no checks run.');
  return <>{children}</>;
};