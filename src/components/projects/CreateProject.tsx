import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Building2, User, MapPin, FileText, ArrowLeft, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ProjectCreationSuccessDialog } from './ProjectCreationSuccessDialog';

// Mock project managers - in real app, fetch from backend
const projectManagers = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@ajryan.com' },
  { id: '2', name: 'Mike Wilson', email: 'mike.wilson@ajryan.com' },
  { id: '3', name: 'Emma Davis', email: 'emma.davis@ajryan.com' },
  { id: '4', name: 'Tom Brown', email: 'tom.brown@ajryan.com' }
];

const formSchema = z.object({
  code: z.string().min(1, 'Project code is required').regex(/^\d+$/, 'Project code must contain only numbers'),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  client: z.string().min(2, 'Client name is required'),
  description: z.string().optional(),
  address: z.string().min(5, 'Valid address is required'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  projectManagerId: z.string().min(1, 'Project manager is required'),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type FormData = z.infer<typeof formSchema>;

const CreateProject = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      client: '',
      description: '',
      address: '',
      projectManagerId: '',
    },
  });

  const checkProjectCodeUnique = async (code: string) => {
    if (!code || !/^\d+$/.test(code)) return true;
    
    setIsCheckingCode(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('code', code)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No record found, code is unique
        return true;
      }
      
      if (data) {
        // Code exists
        form.setError('code', { message: `Project code "${code}" is already in use` });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking project code:', error);
      return true; // Allow on error to not block user
    } finally {
      setIsCheckingCode(false);
    }
  };

  const waitForProjectAvailability = async (projectId: string, maxAttempts = 5) => {
    console.log('⏳ Waiting for project availability:', projectId);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, code, client')
          .eq('id', projectId)
          .single();

        if (data && !error) {
          console.log('✅ Project confirmed available for navigation:', data);
          return true;
        }
        
        console.log(`⏳ Project not yet available, attempt ${attempt}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error);
      }
    }
    
    console.warn('⚠️ Project availability timeout, proceeding anyway');
    return false;
  };

  const onSubmit = async (data: FormData) => {
    // Final code uniqueness check
    const isCodeUnique = await checkProjectCodeUnique(data.code);
    if (!isCodeUnique) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Creating project with data:', data);
      
      // Create project with user-provided code
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          code: data.code,
          name: data.name,
          client: data.client,
          start_date: format(data.startDate, 'yyyy-MM-dd'),
          end_date: format(data.endDate, 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Project created successfully:', project);
      
      // Set created project for dialog
      setCreatedProject(project);
      
      // Show success dialog first
      setShowSuccessDialog(true);
      
      toast({
        title: "Project Created",
        description: `${data.code} - ${data.name} has been created successfully.`,
      });
      
    } catch (error: any) {
      console.error('❌ Project creation error:', error);
      
      let errorMessage = "Failed to create project. Please try again.";
      if (error.message?.includes('duplicate key')) {
        errorMessage = `Project code "${data.code}" is already in use. Please choose a different code.`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessDialogClose = async () => {
    setShowSuccessDialog(false);
    
    if (createdProject) {
      console.log('🧭 Navigating to project:', createdProject.id);
      
      // Wait for project to be available before navigating
      await waitForProjectAvailability(createdProject.id);
      
      // Navigate to the project details page
      navigate(`/projects/${createdProject.id}`);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects/dashboard')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Create New Project</h1>
            <p className="text-muted-foreground">Set up a new project with all required details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-primary" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Project Code */}
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="form-field">
                        <FormLabel className="flex items-center">
                          <Hash className="w-4 h-4 mr-1" />
                          Project Code *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. 382, 379" 
                            {...field}
                            onBlur={async (e) => {
                              field.onBlur();
                              if (e.target.value) {
                                await checkProjectCodeUnique(e.target.value);
                              }
                            }}
                          />
                        </FormControl>
                        {isCheckingCode && (
                          <p className="text-xs text-muted-foreground">Checking code availability...</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Project Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="form-field md:col-span-2">
                        <FormLabel>Project Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Bow Common Phase 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Client */}
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem className="form-field">
                      <FormLabel>Client *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Riverside Holdings Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="form-field">
                      <FormLabel>Project Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the project scope and objectives..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="form-field">
                      <FormLabel className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Site Address *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="123 Project Street, City, Postcode" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Start Date */}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="form-field flex flex-col">
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Date */}
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="form-field flex flex-col">
                        <FormLabel>End Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Project Manager */}
                  <FormField
                    control={form.control}
                    name="projectManagerId"
                    render={({ field }) => (
                      <FormItem className="form-field">
                        <FormLabel className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          Project Manager *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectManagers.map((pm) => (
                              <SelectItem key={pm.id} value={pm.id}>
                                <div>
                                  <div className="font-medium">{pm.name}</div>
                                  <div className="text-xs text-muted-foreground">{pm.email}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/projects/dashboard')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting || isCheckingCode}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <ProjectCreationSuccessDialog
        open={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        project={createdProject}
      />
    </>
  );
};

export default CreateProject;
