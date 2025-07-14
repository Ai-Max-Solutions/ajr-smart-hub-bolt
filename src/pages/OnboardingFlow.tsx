import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import ProgressHeader from '@/components/onboarding/ProgressHeader';
import SignUp from '@/components/onboarding/SignUp';
import PersonalDetails from '@/components/onboarding/PersonalDetails';
import WorkTypeSelection from '@/components/onboarding/WorkTypeSelection';
import OnboardingComplete from '@/components/onboarding/OnboardingComplete';
import PersonalDetailsStep from '@/components/onboarding/PersonalDetailsStep';

export interface OnboardingData {
  // Sign up data
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreedToTerms: boolean;
  
  // Personal details
  cscsCard: {
    number: string;
    expiryDate: string;
    cardType: string;
    frontImage?: File;
    backImage?: File;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  
  // Work types and RAMS
  selectedWorkTypes: string[];
  signedRAMS: Array<{
    workType: string;
    documentId: string;
    signedAt: Date;
    signature: string;
  }>;
}

const OnboardingFlow = () => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    agreedToTerms: false,
    cscsCard: {
      number: '',
      expiryDate: '',
      cardType: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
    },
    selectedWorkTypes: [],
    signedRAMS: [],
  });

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <ProgressHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding/signup" replace />} />
          <Route 
            path="/signup" 
            element={
              <SignUp 
                data={onboardingData} 
                updateData={updateOnboardingData} 
              />
            } 
          />
           <Route 
             path="/personal-details" 
             element={<PersonalDetailsStep />} 
           />
          <Route 
            path="/work-types" 
            element={
              <WorkTypeSelection 
                data={onboardingData} 
                updateData={updateOnboardingData} 
              />
            } 
          />
          <Route 
            path="/complete" 
            element={
              <OnboardingComplete 
                data={onboardingData} 
              />
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default OnboardingFlow;