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
import { FileText, CheckCircle, AlertTriangle, Upload, User, Shield, FileCheck, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  company_name: string;
  company_type: string;
  preferred_work_types: string[];
}

interface TrainingDocumentType {
  id: string;
  name: string;
  description: string;
  is_mandatory: boolean;
  requires_expiry: boolean;
  icon_name: string;
}

interface RAMSDocument {
  id: string;
  title: string;
  description: string;
  document_url: string;
  version: string;
  created_at: string;
}

interface UploadedDocument {
  document_type_id: string;
  file: File;
  issue_date?: string;
  expiry_date?: string;
}

const ContractorOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [trainingDocTypes, setTrainingDocTypes] = useState<TrainingDocumentType[]>([]);
  const [ramsDocuments, setRAMSDocuments] = useState<RAMSDocument[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Company & Personal Details
    selectedCompany: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobRole: '',
    
    // Step 2: Vehicle Details
    hasVehicle: false,
    vehicleType: '',
    vehicleWeight: '',
    vehicleRegistration: '',
    forsLevel: '',
    
    // Step 3: Training Documents
    uploadedDocuments: {} as Record<string, UploadedDocument>,
    willUseLifts: false,
    
    // Step 4: Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Step 5: RAMS Agreement
    signedRAMS: {} as Record<string, boolean>,
    
    // Step 6: Terms
    agreedToTerms: false,
    agreedToDeliveryTerms: false,
    agreedToSiteRules: false
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.selectedCompany && formData.jobRole) {
      loadRAMSDocuments();
    }
  }, [formData.selectedCompany, formData.jobRole]);

  const loadInitialData = async () => {
    try {
      // Mock data for companies
      const mockCompanies: Company[] = [
        {
          id: '1',
          company_name: 'ABC Construction Ltd',
          company_type: 'General Building',
          preferred_work_types: ['construction', 'renovation']
        },
        {
          id: '2',
          company_name: 'DEF Electrical Services',
          company_type: 'Electrical',
          preferred_work_types: ['electrical', 'maintenance']
        }
      ];

      // Mock data for training document types
      const mockTrainingTypes: TrainingDocumentType[] = [
        {
          id: '1',
          name: 'CSCS Card',
          description: 'Construction Skills Certification Scheme card',
          is_mandatory: true,
          requires_expiry: true,
          icon_name: 'card'
        },
        {
          id: '2',
          name: 'First Aid Certificate',
          description: 'Basic first aid training certificate',
          is_mandatory: true,
          requires_expiry: true,
          icon_name: 'medical'
        },
        {
          id: '3',
          name: 'IPAF Certificate',
          description: 'International Powered Access Federation certificate',
          is_mandatory: false,
          requires_expiry: true,
          icon_name: 'lift'
        }
      ];

      setCompanies(mockCompanies);
      setTrainingDocTypes(mockTrainingTypes);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadRAMSDocuments = async () => {
    try {
      // This would load RAMS documents based on company and job role
      // For now, we'll use sample data
      setRAMSDocuments([
        {
          id: '1',
          title: 'General Site Safety RAMS',
          description: 'General risk assessment and method statement for all site workers',
          document_url: '/sample-rams.pdf',
          version: '2.1',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error loading RAMS documents:', error);
    }
  };

  const handleFileUpload = async (documentTypeId: string, file: File, issueDate?: string, expiryDate?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentTypeId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contractor-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setFormData(prev => ({
        ...prev,
        uploadedDocuments: {
          ...prev.uploadedDocuments,
          [documentTypeId]: {
            document_type_id: documentTypeId,
            file,
            issue_date: issueDate,
            expiry_date: expiryDate
          }
        }
      }));

      toast({
        title: "Document uploaded successfully",
        description: "Your training document has been uploaded and saved.",
      });

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.selectedCompany && formData.firstName && formData.lastName && 
               formData.email && formData.phone && formData.jobRole;
      case 2:
        if (!formData.hasVehicle) return true;
        return formData.vehicleType && formData.vehicleWeight && formData.vehicleRegistration &&
               (parseFloat(formData.vehicleWeight) <= 3.5 || formData.forsLevel);
      case 3:
        const mandatoryDocs = trainingDocTypes.filter(type => type.is_mandatory);
        const uploadedMandatory = mandatoryDocs.filter(type => formData.uploadedDocuments[type.id]);
        
        // Check IPAF requirement
        if (formData.willUseLifts) {
          const ipafType = trainingDocTypes.find(type => type.name.includes('IPAF'));
          if (ipafType && !formData.uploadedDocuments[ipafType.id]) {
            return false;
          }
        }
        
        return uploadedMandatory.length === mandatoryDocs.length;
      case 4:
        return formData.emergencyContactName && formData.emergencyContactPhone;
      case 5:
        return ramsDocuments.every(doc => formData.signedRAMS[doc.id]);
      case 6:
        return formData.agreedToTerms && formData.agreedToDeliveryTerms && formData.agreedToSiteRules;
      default:
        return false;
    }
  };

  const handleStepComplete = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Required information missing",
        description: "Please complete all required fields before continuing.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
      } else {
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

      // Mock successful onboarding completion
      console.log('Mock onboarding completion for user:', user.id);
      console.log('Form data:', formData);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

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
    { number: 1, title: "Company & Personal", icon: User },
    { number: 2, title: "Vehicle Details", icon: FileCheck },
    { number: 3, title: "Training Documents", icon: CreditCard },
    { number: 4, title: "Emergency Contact", icon: User },
    { number: 5, title: "RAMS Documents", icon: Shield },
    { number: 6, title: "Terms & Conditions", icon: CheckCircle }
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
            {/* Step 1: Company & Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Select Your Company *</Label>
                  <Select value={formData.selectedCompany} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, selectedCompany: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your contracting company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <div>
                            <div className="font-medium">{company.company_name}</div>
                            <div className="text-xs text-muted-foreground">{company.company_type}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobRole">Primary Job Role *</Label>
                  <Select value={formData.jobRole} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, jobRole: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrician">Electrician</SelectItem>
                      <SelectItem value="plumber">Plumber</SelectItem>
                      <SelectItem value="general_builder">General Builder</SelectItem>
                      <SelectItem value="plant_operator">Plant Operator</SelectItem>
                      <SelectItem value="delivery_driver">Delivery Driver</SelectItem>
                      <SelectItem value="site_manager">Site Manager</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasVehicle"
                    checked={formData.hasVehicle}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, hasVehicle: checked as boolean }))
                    }
                  />
                  <Label htmlFor="hasVehicle">I will be using a vehicle for deliveries to AJ Ryan sites</Label>
                </div>

                {formData.hasVehicle && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type *</Label>
                        <Input
                          id="vehicleType"
                          placeholder="e.g., Transit Van, 7.5T Lorry"
                          value={formData.vehicleType}
                          onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleRegistration">Registration *</Label>
                        <Input
                          id="vehicleRegistration"
                          placeholder="e.g., AB12 CDE"
                          value={formData.vehicleRegistration}
                          onChange={(e) => setFormData(prev => ({ ...prev, vehicleRegistration: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicleWeight">Vehicle Weight (tonnes) *</Label>
                      <Input
                        id="vehicleWeight"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 3.5"
                        value={formData.vehicleWeight}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleWeight: e.target.value }))}
                      />
                    </div>

                    {parseFloat(formData.vehicleWeight) > 3.5 && (
                      <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                          <div className="space-y-2">
                            <p className="font-medium text-warning">FORS Certificate Required</p>
                            <p className="text-sm text-muted-foreground">
                              Vehicles over 3.5 tonnes must have FORS Silver certification minimum.
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="forsLevel">FORS Level *</Label>
                              <Select value={formData.forsLevel} onValueChange={(value) => 
                                setFormData(prev => ({ ...prev, forsLevel: value }))
                              }>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select FORS level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="silver">FORS Silver</SelectItem>
                                  <SelectItem value="gold">FORS Gold</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Training Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Upload Training Documents</h3>
                  <p className="text-muted-foreground">
                    Please upload all required training certificates and qualifications.
                  </p>
                </div>

                {/* IPAF Check */}
                <div className="p-4 bg-info/10 border border-info rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="willUseLifts"
                      checked={formData.willUseLifts}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, willUseLifts: checked as boolean }))
                      }
                    />
                    <Label htmlFor="willUseLifts" className="font-medium">
                      Will you be using lifts, MEWPs or access platforms on site?
                    </Label>
                  </div>
                  {formData.willUseLifts && (
                    <p className="text-sm text-muted-foreground mt-2">
                      You will need to upload a valid IPAF certificate.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {trainingDocTypes.map((docType) => {
                    const isIPAF = docType.name.includes('IPAF');
                    const shouldShow = docType.is_mandatory || (isIPAF && formData.willUseLifts) || 
                                     (!docType.is_mandatory && !isIPAF);
                    
                    if (!shouldShow) return null;

                    const isRequired = docType.is_mandatory || (isIPAF && formData.willUseLifts);
                    const uploaded = formData.uploadedDocuments[docType.id];

                    return (
                      <Card key={docType.id} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center space-x-2">
                                <span>{docType.name}</span>
                                {isRequired && <Badge variant="destructive">Required</Badge>}
                                {uploaded && <CheckCircle className="h-4 w-4 text-success" />}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {docType.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`file-${docType.id}`}>
                                Upload Document {isRequired && '*'}
                              </Label>
                              <Input
                                id={`file-${docType.id}`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const uploaded = formData.uploadedDocuments[docType.id];
                                    handleFileUpload(
                                      docType.id, 
                                      file, 
                                      uploaded?.issue_date, 
                                      uploaded?.expiry_date
                                    );
                                  }
                                }}
                              />
                            </div>

                            {docType.requires_expiry && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor={`issue-${docType.id}`}>Issue Date</Label>
                                  <Input
                                    id={`issue-${docType.id}`}
                                    type="date"
                                    onChange={(e) => {
                                      const uploaded = formData.uploadedDocuments[docType.id];
                                      if (uploaded) {
                                        handleFileUpload(
                                          docType.id, 
                                          uploaded.file, 
                                          e.target.value, 
                                          uploaded.expiry_date
                                        );
                                      }
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`expiry-${docType.id}`}>
                                    Expiry Date {isRequired && '*'}
                                  </Label>
                                  <Input
                                    id={`expiry-${docType.id}`}
                                    type="date"
                                    onChange={(e) => {
                                      const uploaded = formData.uploadedDocuments[docType.id];
                                      if (uploaded) {
                                        handleFileUpload(
                                          docType.id, 
                                          uploaded.file, 
                                          uploaded.issue_date, 
                                          e.target.value
                                        );
                                      }
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {uploaded && (
                            <div className="flex items-center space-x-2 text-sm text-success">
                              <CheckCircle className="h-4 w-4" />
                              <span>Document uploaded successfully</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Emergency Contact */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Emergency Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyName"
                      placeholder="Full name"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      placeholder="Phone number"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input
                    id="emergencyRelationship"
                    placeholder="e.g., Spouse, Partner, Manager"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Step 5: RAMS Agreement */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Review and Sign RAMS Documents</h3>
                  <p className="text-muted-foreground">
                    The following Risk Assessments and Method Statements apply to your company and role.
                  </p>
                </div>

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
                            checked={formData.signedRAMS[doc.id] || false}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ 
                                ...prev, 
                                signedRAMS: { ...prev.signedRAMS, [doc.id]: checked as boolean }
                              }))
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
              </div>
            )}

            {/* Step 6: Terms & Conditions */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Terms and Conditions</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, agreedToTerms: checked as boolean }))
                      }
                    />
                    <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
                      I agree to AJ Ryan's contractor terms and conditions, site safety requirements, 
                      and understand that compliance with all RAMS documents is mandatory while working on AJ Ryan sites.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeDeliveryTerms"
                      checked={formData.agreedToDeliveryTerms}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, agreedToDeliveryTerms: checked as boolean }))
                      }
                    />
                    <Label htmlFor="agreeDeliveryTerms" className="text-sm leading-relaxed">
                      I agree to the delivery notice policies (minimum 24-hour notice required for all deliveries, 
                      subject to project-specific requirements).
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeSiteRules"
                      checked={formData.agreedToSiteRules}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, agreedToSiteRules: checked as boolean }))
                      }
                    />
                    <Label htmlFor="agreeSiteRules" className="text-sm leading-relaxed">
                      I agree to comply with all site rules including: no artic lorries on site, 
                      FORS Silver minimum for vehicles over 3.5T, and mandatory edge protection requirements.
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
                disabled={loading || !validateCurrentStep()}
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