import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, ArrowRight, Download, Loader2 } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingCompleteProps {
  data: OnboardingData;
}

const OnboardingComplete = ({ data }: OnboardingCompleteProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Save onboarding data to database when component mounts
    saveOnboardingData();
  }, []);

  const saveOnboardingData = async () => {
    if (!user || saved) return;

    setSaving(true);
    try {
      // Update user's basic information
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: `${data.firstName} ${data.lastName}`.trim(),
          phone: data.emergencyContact.phone, // Use emergency contact phone as primary phone for now
        })
        .eq('supabase_auth_id', user.id);

      if (userError) {
        console.error('Error updating user:', userError);
        throw userError;
      }

      // For now, we'll store the onboarding completion in localStorage
      // In a real implementation, you would create additional tables for:
      // - emergency_contacts
      // - cscs_cards  
      // - user_work_types
      // - signed_documents
      const onboardingRecord = {
        userId: user.id,
        completedAt: new Date().toISOString(),
        emergencyContact: data.emergencyContact,
        cscsCard: data.cscsCard,
        workTypes: data.selectedWorkTypes,
        signedRAMS: data.signedRAMS,
      };

      localStorage.setItem('onboardingCompleted', JSON.stringify(onboardingRecord));
      
      setSaved(true);
      toast({
        title: "Onboarding Complete!",
        description: "Your information has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Error saving data",
        description: "There was an issue saving your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCertificate = () => {
    // Mock download functionality
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'aj-ryan-onboarding-certificate.pdf';
    link.click();
  };

  const goToDashboard = () => {
    if (!saved && !saving) {
      toast({
        title: "Saving in progress",
        description: "Please wait while we save your information.",
        variant: "destructive"
      });
      return;
    }

    // Clear onboarding data from localStorage (but keep onboardingCompleted)
    localStorage.removeItem('onboardingData');
    
    // Use React Router navigation instead of window.location to avoid full page reload
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Success Header */}
      <Card className="card-hover border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
        <CardContent className="pt-8 pb-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              🎉 Onboarding Complete!
            </h1>
            <p className="text-lg text-gray-700 font-medium">
              Welcome to AJ Ryan SmartWork Hub, {data.firstName} {data.lastName}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card className="card-hover shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            📋 Onboarding Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {/* Personal Details */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Personal Details</h3>
                <p className="text-sm text-gray-600">Profile information verified</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold px-3 py-1">
              ✅ Complete
            </Badge>
          </div>

          {/* Emergency Contact */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Emergency Contact</h3>
                <p className="text-sm text-gray-600">Contact information added</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold px-3 py-1">
              ✅ Complete
            </Badge>
          </div>

          {/* CSCS Card */}
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-gray-900">CSCS Card</h3>
                <p className="text-sm text-gray-600">Pending verification</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-semibold px-3 py-1">
              ⏳ Under Review
            </Badge>
          </div>

          {/* Work Types & RAMS */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Safety Documents (RAMS)</h3>
                <p className="text-sm text-gray-600">
                  {data.signedRAMS.length} documents signed for {data.selectedWorkTypes.length} work types
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold px-3 py-1">
              ✅ Complete
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="card-hover shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🚀 What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 shadow-md">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Admin Review</h3>
              <p className="text-gray-700 mt-1">
                Our compliance team will verify your CSCS card and documents within 24 hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 shadow-md">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Account Activation</h3>
              <p className="text-gray-700 mt-1">
                You'll receive an email confirmation once your account is fully activated.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 shadow-md">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Start Working</h3>
              <p className="text-gray-700 mt-1">
                Access your dashboard to view assigned projects and submit timesheets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="card-hover border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-600 mt-1" />
            <div>
              <h3 className="font-bold text-orange-800 mb-3 text-lg">⚠️ Important Notice</h3>
              <p className="text-gray-900 mb-4 leading-relaxed">
                Your account is pending final approval. You'll be notified via email once the verification process is complete. 
                Please ensure you have access to the email address you provided.
              </p>
              <p className="text-gray-900 leading-relaxed">
                If you need to update any information, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Button 
          variant="outline" 
          onClick={handleDownloadCertificate} 
          className="h-14 text-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-md"
          disabled={saving}
        >
          <Download className="w-5 h-5 mr-3" />
          📄 Download Certificate
        </Button>
        <Button 
          onClick={goToDashboard} 
          className="h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
          disabled={saving || !saved}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              💾 Saving...
            </>
          ) : (
            <>
              <ArrowRight className="w-5 h-5 mr-3" />
              🚀 Go to Dashboard
            </>
          )}
        </Button>
      </div>

      {/* Contact Information */}
      <Card className="card-hover bg-gradient-to-br from-gray-50 to-blue-50 shadow-md">
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">💬 Need Help?</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Our support team is here to assist you with any questions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-base">
              <a 
                href="mailto:support@ajryan.co.uk" 
                className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                📧 support@ajryan.co.uk
              </a>
              <a 
                href="tel:08001234567" 
                className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                📞 0800 123 4567
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingComplete;