import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
export const Auth = () => {
  const {
    user,
    loading,
    signIn,
    signUp,
    resetPassword
  } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/';

  // If user is already authenticated, redirect them
  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const {
      error
    } = await signIn(email, password);
    if (error) {
      setError(error.message || 'Failed to sign in');
    }
    setIsLoading(false);
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }
    const {
      error
    } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim()
    });
    if (error) {
      setError(error.message || 'Failed to create account');
    }
    setIsLoading(false);
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const {
      error
    } = await resetPassword(email);
    if (!error) {
      setShowResetForm(false);
      setEmail('');
    } else {
      setError(error.message || 'Failed to send reset email');
    }
    setIsLoading(false);
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-aj-navy-deep to-aj-navy-light flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>;
  }
  if (showResetForm) {
    return <div className="min-h-screen bg-gradient-to-br from-aj-navy-deep to-aj-navy-light flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-card/95 border-white/10 animate-fade-in">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>}
              
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading || !email}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowResetForm(false)} disabled={isLoading}>
                  Back to Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-aj-navy-deep to-aj-navy-light flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-card/95 border-white/10 animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/lovable-uploads/0b275deb-8a7d-4a00-85a3-ae746d59b6f1.png" alt="A&J Ryan Logo" className="w-[180px] mr-2 rounded-[5px]" />
            
          </div>
          <CardTitle>SmartWork Hub</CardTitle>
          <CardDescription>
            Secure access to your construction management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>}
                
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
                </div>

                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                  
                  <Button type="button" variant="link" className="w-full text-sm" onClick={() => setShowResetForm(true)} disabled={isLoading}>
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>}
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} minLength={8} />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isLoading} />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !email || !password || !confirmPassword || !firstName || !lastName}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Secure access protected by enterprise-grade security</p>
          </div>
        </CardContent>
      </Card>
    </div>;
};

export default Auth;