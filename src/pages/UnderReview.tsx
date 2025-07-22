import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ACTIVATION_STATUS } from "@/lib/constants";

export const UnderReview = () => {
  const navigate = useNavigate();
  const { signOut, userProfile, checkActivationStatus } = useAuth();
  
  const getStatusMessage = (status: string, expiry: Date | null, onboardingComplete: boolean) => {
    if (status === ACTIVATION_STATUS.PENDING) {
      return "Your account is pending admin activation after completing onboarding.";
    }
    if (status === ACTIVATION_STATUS.PROVISIONAL && expiry) {
      const hoursLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60)));
      if (hoursLeft > 0 && !onboardingComplete) {
        return `You have ${hoursLeft} hours remaining to complete onboarding.`;
      }
      return "Your provisional access has expired. Please wait for admin activation.";
    }
    return "Your account is under review.";
  };
  
  const currentStatus = checkActivationStatus(userProfile);
  const expiryDate = userProfile?.activation_expiry ? new Date(userProfile.activation_expiry) : null;
  const statusMessage = getStatusMessage(currentStatus, expiryDate, userProfile?.onboarding_completed);

  const handleBackToLogin = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Account Under Review</h1>
            <Badge variant="outline" className="text-warning border-warning">
              Pending Activation
            </Badge>
          </div>

          {/* Message */}
          <div className="space-y-4 text-muted-foreground">
            <p className="text-base leading-relaxed">
              {statusMessage}
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>You'll receive an email notification once approved</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Most reviews complete within 24 hours</span>
              </div>
            </div>

            <p className="text-sm font-medium text-foreground">
              Use this downtime to plan ahead - jobs will be flowing soon!
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleBackToLogin}
              variant="outline" 
              className="w-full"
            >
              Back to Login
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Questions? Contact your project manager for immediate assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
