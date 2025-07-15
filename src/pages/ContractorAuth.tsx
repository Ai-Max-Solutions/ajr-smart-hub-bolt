import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const ContractorAuth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignIn) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate('/contractor/dashboard');
        }
      } else {
        // Sign up validation
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }

        const { error } = await signUp(email, password, {
          full_name: contactName,
          company_name: companyName,
          user_type: 'contractor'
        });
        
        if (error) {
          setError(error.message);
        } else {
          toast({
            title: "Account created successfully",
            description: "Please complete your onboarding to access the contractor portal.",
          });
          navigate('/contractor/onboarding');
        }
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* AJ Ryan Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-primary">AJ Ryan</h1>
              <p className="text-sm text-muted-foreground">Mechanical Services</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            External Contractor Portal
          </h2>
          <p className="text-sm text-muted-foreground">
            Secure access for approved subcontractors
          </p>
        </div>

        <Card className="w-full shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">
              {isSignIn ? 'Sign In' : 'Register Your Company'}
            </CardTitle>
            <CardDescription>
              {isSignIn 
                ? 'Access your contractor dashboard' 
                : 'Create an account for your contracting company'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Your contracting company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="form-field"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      type="text"
                      placeholder="Your full name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="form-field"
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="company@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-field pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignIn ? "Enter your password" : "Create a secure password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-field pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              {!isSignIn && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="form-field pl-10"
                    />
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isSignIn ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <Separator />
              
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsSignIn(!isSignIn);
                    setError('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setCompanyName('');
                    setContactName('');
                  }}
                  className="text-accent hover:text-accent/80"
                >
                  {isSignIn 
                    ? "New contractor? Register your company" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>
                  By signing {isSignIn ? 'in' : 'up'}, you agree to AJ Ryan's contractor terms and conditions.
                </p>
                <p className="mt-1">
                  Need help? Contact: contractors@ajryan.co.uk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Values footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p className="font-medium">AJ Ryan Values:</p>
          <p>Integrity | Teamwork | Passion | Inclusion | Quality | Accessibility</p>
        </div>
      </div>
    </div>
  );
};

export default ContractorAuth;