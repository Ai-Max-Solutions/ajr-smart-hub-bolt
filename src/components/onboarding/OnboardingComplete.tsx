import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, ArrowRight, Download } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';

interface OnboardingCompleteProps {
  data: OnboardingData;
}

const OnboardingComplete = ({ data }: OnboardingCompleteProps) => {
  const handleDownloadCertificate = () => {
    // Mock download functionality
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'aj-ryan-onboarding-certificate.pdf';
    link.click();
  };

  const goToDashboard = () => {
    // In a real app, this would redirect to the main dashboard
    window.location.href = '/';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <Card className="card-hover border-success/50 bg-success/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-success mb-2">
              Onboarding Complete!
            </h1>
            <p className="text-muted-foreground">
              Welcome to AJ Ryan SmartWork Hub, {data.firstName} {data.lastName}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-primary">Onboarding Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Personal Details */}
          <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <h3 className="font-medium">Personal Details</h3>
                <p className="text-sm text-muted-foreground">Profile information verified</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success">
              Complete
            </Badge>
          </div>

          {/* Emergency Contact */}
          <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <h3 className="font-medium">Emergency Contact</h3>
                <p className="text-sm text-muted-foreground">Contact information added</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success">
              Complete
            </Badge>
          </div>

          {/* CSCS Card */}
          <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <h3 className="font-medium">CSCS Card</h3>
                <p className="text-sm text-muted-foreground">Pending verification</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              Under Review
            </Badge>
          </div>

          {/* Work Types & RAMS */}
          <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <h3 className="font-medium">Safety Documents (RAMS)</h3>
                <p className="text-sm text-muted-foreground">
                  {data.signedRAMS.length} documents signed for {data.selectedWorkTypes.length} work types
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success">
              Complete
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-primary">What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
              1
            </div>
            <div>
              <h3 className="font-medium">Admin Review</h3>
              <p className="text-sm text-muted-foreground">
                Our compliance team will verify your CSCS card and documents within 24 hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
              2
            </div>
            <div>
              <h3 className="font-medium">Account Activation</h3>
              <p className="text-sm text-muted-foreground">
                You'll receive an email confirmation once your account is fully activated.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
              3
            </div>
            <div>
              <h3 className="font-medium">Start Working</h3>
              <p className="text-sm text-muted-foreground">
                Access your dashboard to view assigned projects and submit timesheets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="card-hover border-warning/50 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning mb-2">Important Notice</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your account is pending final approval. You'll be notified via email once the verification process is complete. 
                Please ensure you have access to the email address you provided.
              </p>
              <p className="text-sm text-muted-foreground">
                If you need to update any information, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" onClick={handleDownloadCertificate} className="h-12">
          <Download className="w-4 h-4 mr-2" />
          Download Certificate
        </Button>
        <Button onClick={goToDashboard} className="h-12 btn-primary">
          <ArrowRight className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>

      {/* Contact Information */}
      <Card className="card-hover bg-muted/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Our support team is here to assist you with any questions.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="text-primary font-medium">📧 support@ajryan.co.uk</span>
              <span className="text-primary font-medium">📞 0800 123 4567</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingComplete;