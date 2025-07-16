import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import ProgressHeader from '@/components/onboarding/ProgressHeader';
import SignUp from '@/components/onboarding/SignUp';
import PersonalDetails from '@/components/onboarding/PersonalDetails';
import WorkTypeSelection from '@/components/onboarding/WorkTypeSelection';
import OnboardingComplete from '@/components/onboarding/OnboardingComplete';
import { PersonalDetailsStep } from '@/components/onboarding/PersonalDetailsStep';

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
    uploadComplete?: boolean;
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
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    // Load existing data from localStorage if available
    const savedData = localStorage.getItem('onboardingData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Error parsing saved onboarding data:', error);
      }
    }
    
    return {
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
    };
  });

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    const newData = { ...onboardingData, ...data };
    setOnboardingData(newData);
    // Store in localStorage so it persists across routes
    localStorage.setItem('onboardingData', JSON.stringify(newData));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <ProgressHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding/personal-details" replace />} />
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
             element={
               <PersonalDetails 
                 data={onboardingData} 
                 updateData={updateOnboardingData} 
               />
             } 
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