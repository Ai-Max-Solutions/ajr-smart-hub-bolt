import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const AccountBlocked = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleBackToLogin = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Account Blocked</h1>
            <Badge variant="outline" className="text-destructive border-destructive">
              Access Denied
            </Badge>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p className="text-base leading-relaxed">
              Your account access has been restricted. This may be due to security concerns 
              or policy violations.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>Contact your project manager for assistance</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span>Call the main office for immediate support</span>
              </div>
            </div>

            <p className="text-sm font-medium text-foreground">
              If you believe this is an error, please contact support immediately.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleBackToLogin}
              variant="outline" 
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
