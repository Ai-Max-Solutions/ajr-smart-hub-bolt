import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Building2, Mail, Lock, AlertCircle, Apple } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-[#F0F8FF] to-[#E0FFFF] flex items-center justify-center p-4">
      {/* Main Container - Split Screen Layout */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
        
        {/* Left Side - Form Area (40% on desktop) */}
        <div className="lg:w-2/5 p-8 lg:p-12 flex flex-col justify-center">
          {/* Logo Button */}
          <div className="mb-8">
            <button className="bg-aj-yellow text-aj-navy-deep px-6 py-3 rounded-full font-bold text-xl hover:scale-105 transition-all duration-300 shadow-lg">
              AJ Ryan
            </button>
          </div>

          {/* Main Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-aj-navy-deep mb-2">
              {isSignIn ? 'Sign In to Contractor Portal' : 'Join Our Contractor Network'}
            </h2>
            <p className="text-lg text-gray-600">
              Secure access to your dedicated dashboard for approved subcontractors
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isSignIn && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-aj-navy-deep font-medium">
                    Company *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Enter your company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="pl-11 h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-aj-blue-accent focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-aj-navy-deep font-medium">
                    Contact Name *
                  </Label>
                  <Input
                    id="contactName"
                    type="text"
                    placeholder="Your full name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-aj-blue-accent focus:border-transparent transition-all duration-200"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-aj-navy-deep font-medium">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-11 h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-aj-blue-accent focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-aj-navy-deep font-medium">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignIn ? "Enter your password" : "Create a secure password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-11 pr-11 h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-aj-blue-accent focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-aj-navy-deep font-medium">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-11 h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-aj-blue-accent focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-aj-yellow to-yellow-500 hover:from-yellow-500 hover:to-aj-yellow text-aj-navy-deep font-semibold rounded-full transition-all duration-300 ease-in-out hover:scale-105 shadow-lg"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isSignIn ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          {/* Social Sign-in */}
          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 bg-black text-white border-black hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <Apple className="h-5 w-5 mr-2" />
              Apple
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-3">
            <button
              onClick={() => {
                setIsSignIn(!isSignIn);
                setError('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setCompanyName('');
                setContactName('');
              }}
              className="text-aj-blue-accent hover:underline transition-colors duration-200"
            >
              {isSignIn 
                ? "New to AJ Ryan? Register a Contractor's Contact" 
                : "Already have an account? Sign in"
              }
            </button>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>Help? Contact us at <a href="mailto:info@ajryan.co.uk" className="text-aj-blue-accent hover:underline">info@ajryan.co.uk</a></p>
              <p>By signing in you agree to our <a href="/terms" className="text-aj-blue-accent hover:underline">terms and conditions</a></p>
            </div>
          </div>
        </div>

        {/* Right Side - Image/Visual Area (60% on desktop) */}
        <div className="lg:w-3/5 relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80')",
            }}
          />
          
          {/* Yellow Overlay */}
          <div className="absolute inset-0 bg-aj-yellow bg-opacity-20"></div>

          {/* Floating UI Elements */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between animate-fade-in">
            
            {/* Top-right floating bubble */}
            <div className="self-end animate-float-1">
              <div className="bg-yellow-100 border-2 border-aj-yellow p-4 rounded-xl shadow-lg max-w-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                  <span className="text-sm font-medium text-aj-navy-deep">Task Review With Team</span>
                </div>
                <p className="text-xs text-gray-600">09:30am-10:00am</p>
              </div>
            </div>

            {/* Bottom-center calendar */}
            <div className="self-center animate-float-2">
              <div className="bg-white rounded-lg shadow-xl p-4 max-w-xs">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-aj-navy-deep">This Week</h3>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs text-center mb-3">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={idx} className="font-medium text-gray-600">{day}</div>
                  ))}
                  {[22, 23, 24, 25, 26, 27, 28].map((date, idx) => (
                    <div 
                      key={idx} 
                      className={`p-1 rounded ${date === 25 ? 'bg-aj-yellow text-aj-navy-deep font-semibold' : 'text-gray-600'}`}
                    >
                      {date}
                    </div>
                  ))}
                </div>
                <div className="text-xs bg-aj-yellow bg-opacity-20 p-2 rounded text-aj-navy-deep">
                  Daily Meeting 12:00pm-01:00pm
                </div>
                <div className="flex -space-x-2 mt-2">
                  {[1, 2, 3].map((_, idx) => (
                    <div key={idx} className="w-6 h-6 bg-aj-blue-accent rounded-full border-2 border-white"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom-right collaboration popup */}
            <div className="self-end animate-float-3">
              <div className="bg-white rounded-xl shadow-lg p-4 max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-aj-blue-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👋</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-aj-navy-deep">Team Collaboration</p>
                    <p className="text-xs text-gray-600">Interactive workflow</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ContractorAuth;