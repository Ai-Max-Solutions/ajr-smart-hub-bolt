import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, CheckCircle, AlertTriangle, Upload, User, Shield, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  description: string;
}

interface JobRole {
  id: string;
  name: string;
  description: string;
}

interface RAMSDocument {
  id: string;
  title: string;
  description: string;
  document_url: string;
  version: string;
  created_at: string;
}

const ContractorOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [ramsDocuments, setRAMSDocuments] = useState<RAMSDocument[]>([]);
  
  // Form data
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState({
    hasVehicle: false,
    vehicleType: '',
    weight: '',
    forsCertificate: null as File | null
  });
  const [signedRAMS, setSignedRAMS] = useState<{[key: string]: boolean}>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    relationship: ''
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCompaniesAndRoles();
  }, []);

  useEffect(() => {
    if (selectedCompany && selectedJobRole) {
      loadRAMSDocuments();
    }
  }, [selectedCompany, selectedJobRole]);

  const loadCompaniesAndRoles = async () => {
    try {
      const [companiesResult, rolesResult] = await Promise.all([
        supabase.from('contractor_companies').select('*').eq('is_active', true),
        supabase.from('contractor_job_roles').select('*').eq('is_active', true)
      ]);

      if (companiesResult.data) setCompanies(companiesResult.data);
      if (rolesResult.data) setJobRoles(rolesResult.data);
    } catch (error) {
      console.error('Error loading companies and roles:', error);
    }
  };

  const loadRAMSDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('rams_documents')
        .select('*')
        .contains('applicable_companies', [selectedCompany])
        .contains('applicable_job_roles', [selectedJobRole])
        .eq('is_active', true);

      if (error) throw error;
      setRAMSDocuments(data || []);
    } catch (error) {
      console.error('Error loading RAMS documents:', error);
    }
  };

  const handleStepComplete = async () => {
    setLoading(true);
    
    try {
      if (currentStep === 1) {
        // Validate company and job role selection
        if (!selectedCompany || !selectedJobRole) {
          toast({
            title: "Selection required",
            description: "Please select both company and job role to continue.",
            variant: "destructive"
          });
          return;
        }
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Validate vehicle details if applicable
        if (vehicleDetails.hasVehicle && (!vehicleDetails.vehicleType || !vehicleDetails.weight)) {
          toast({
            title: "Vehicle details required",
            description: "Please complete all vehicle information.",
            variant: "destructive"
          });
          return;
        }
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Validate RAMS signatures
        const allRAMSSigned = ramsDocuments.every(doc => signedRAMS[doc.id]);
        if (!allRAMSSigned) {
          toast({
            title: "RAMS signatures required",
            description: "Please review and sign all RAMS documents to continue.",
            variant: "destructive"
          });
          return;
        }
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Complete onboarding
        if (!agreedToTerms || !emergencyContact.name || !emergencyContact.phone) {
          toast({
            title: "Required information missing",
            description: "Please complete all required fields and agree to terms.",
            variant: "destructive"
          });
          return;
        }
        
        await completeOnboarding();
      }
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create contractor profile
      const { error: profileError } = await supabase
        .from('contractor_profiles')
        .insert({
          user_id: user.id,
          company_id: selectedCompany,
          job_role_id: selectedJobRole,
          vehicle_details: vehicleDetails,
          emergency_contact: emergencyContact,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Record RAMS signatures
      const signaturePromises = ramsDocuments.map(doc => 
        supabase.from('contractor_rams_signatures').insert({
          contractor_id: user.id,
          rams_document_id: doc.id,
          signed_at: new Date().toISOString(),
          signature_method: 'digital_consent',
          is_valid: true
        })
      );

      await Promise.all(signaturePromises);

      toast({
        title: "Onboarding completed successfully",
        description: "Welcome to the AJ Ryan contractor portal!",
      });

      navigate('/contractor/dashboard');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error completing onboarding",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const steps = [
    { number: 1, title: "Company & Role", icon: User },
    { number: 2, title: "Vehicle Details", icon: FileCheck },
    { number: 3, title: "RAMS Documents", icon: Shield },
    { number: 4, title: "Final Details", icon: CheckCircle }
  ];

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Contractor Onboarding</h1>
          <p className="text-muted-foreground">Complete your setup to access the AJ Ryan contractor portal</p>
        </div>

        {/* Progress Bar */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.number;
                  const isCompleted = currentStep > step.number;
                  
                  return (
                    <div key={step.number} className="flex flex-col items-center space-y-2">
                      <div className={`rounded-full p-2 ${
                        isCompleted ? 'bg-success text-success-foreground' :
                        isActive ? 'bg-primary text-primary-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs font-medium ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5" })}
              <span>Step {currentStep}: {steps[currentStep - 1].title}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Select Your Company *</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your contracting company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-xs text-muted-foreground">{company.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobRole">Select Your Job Role *</Label>
                  <Select value={selectedJobRole} onValueChange={setSelectedJobRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your primary job role" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-xs text-muted-foreground">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasVehicle"
                    checked={vehicleDetails.hasVehicle}
                    onCheckedChange={(checked) => 
                      setVehicleDetails(prev => ({ ...prev, hasVehicle: checked as boolean }))
                    }
                  />
                  <Label htmlFor="hasVehicle">I will be using a vehicle for deliveries to AJ Ryan sites</Label>
                </div>

                {vehicleDetails.hasVehicle && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleType">Vehicle Type *</Label>
                      <Input
                        id="vehicleType"
                        placeholder="e.g., Transit Van, 7.5T Lorry"
                        value={vehicleDetails.vehicleType}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, vehicleType: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Vehicle Weight (tonnes) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 3.5"
                        value={vehicleDetails.weight}
                        onChange={(e) => setVehicleDetails(prev => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>

                    {parseFloat(vehicleDetails.weight) > 3.5 && (
                      <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                          <div className="space-y-2">
                            <p className="font-medium text-warning">FORS Certificate Required</p>
                            <p className="text-sm text-muted-foreground">
                              Vehicles over 3.5 tonnes must have FORS Silver certification minimum.
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="forsUpload">Upload FORS Certificate *</Label>
                              <Input
                                id="forsUpload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setVehicleDetails(prev => ({ 
                                  ...prev, 
                                  forsCertificate: e.target.files?.[0] || null 
                                }))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Review and Sign RAMS Documents</h3>
                  <p className="text-muted-foreground">
                    The following Risk Assessments and Method Statements apply to your company and role.
                  </p>
                </div>

                {ramsDocuments.length === 0 ? (
                  <div className="text-center p-8 bg-muted/50 rounded-lg">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Loading RAMS documents for your selection...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ramsDocuments.map((doc) => (
                      <Card key={doc.id} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{doc.title}</CardTitle>
                              <CardDescription className="text-sm">
                                {doc.description}
                              </CardDescription>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline">Version {doc.version}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  Updated: {new Date(doc.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.document_url, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Document
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`rams-${doc.id}`}
                              checked={signedRAMS[doc.id] || false}
                              onCheckedChange={(checked) => 
                                setSignedRAMS(prev => ({ ...prev, [doc.id]: checked as boolean }))
                              }
                            />
                            <Label htmlFor={`rams-${doc.id}`} className="text-sm">
                              I have read, understood, and agree to comply with this RAMS document
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Emergency Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
                      <Input
                        id="emergencyName"
                        placeholder="Full name"
                        value={emergencyContact.name}
                        onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        placeholder="Phone number"
                        value={emergencyContact.phone}
                        onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                    <Input
                      id="emergencyRelationship"
                      placeholder="e.g., Spouse, Partner, Manager"
                      value={emergencyContact.relationship}
                      onChange={(e) => setEmergencyContact(prev => ({ ...prev, relationship: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Terms and Conditions</h3>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
                      I agree to AJ Ryan's contractor terms and conditions, site safety requirements, 
                      delivery notice policies, and understand that compliance with all RAMS documents 
                      is mandatory while working on AJ Ryan sites.
                    </Label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1 || loading}
              >
                Previous
              </Button>
              
              <Button
                onClick={handleStepComplete}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Processing...' : 
                 currentStep === steps.length ? 'Complete Onboarding' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractorOnboarding;