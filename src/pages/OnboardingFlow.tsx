import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import ProgressHeader from '@/components/onboarding/ProgressHeader';
import SignUp from '@/components/onboarding/SignUp';
import PersonalDetails from '@/components/onboarding/PersonalDetails';
import CSCSCard from '@/components/onboarding/CSCSCard';
import EmergencyContact from '@/components/onboarding/EmergencyContact';
import WorkTypeSelection from '@/components/onboarding/WorkTypeSelection';
import OnboardingComplete from '@/components/onboarding/OnboardingComplete';
import { OnboardingRouter } from '@/components/onboarding/OnboardingRouter';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';

export interface OnboardingData {
  // Sign up data
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreedToTerms: boolean;
  
  // Personal details
  phone: string;
  
  // CSCS card data
  cscsCard: {
    number: string;
    expiryDate: string;
    cardType: string;
    frontImage?: File;
    backImage?: File;
    uploadComplete?: boolean;
  };
  
  // Emergency contact data
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
      phone: '',
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
    <OnboardingRouter>
      <div className="min-h-screen bg-gradient-subtle">
        <OnboardingProgressBar />
        <OnboardingProgress />
        
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Routes>
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
              path="/cscs-card" 
              element={
                <CSCSCard 
                  data={onboardingData} 
                  updateData={updateOnboardingData} 
                />
              } 
            />
            <Route 
              path="/emergency-contact" 
              element={
                <EmergencyContact 
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
    </OnboardingRouter>
  );
};

export default OnboardingFlow;