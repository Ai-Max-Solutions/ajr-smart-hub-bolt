import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, 
  Building2, 
  Layers3, 
  Home, 
  Sparkles, 
  Loader2, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const projectSchema = z.object({
  code: z.string().min(1, 'Project code is required').regex(/^\d+$/, 'Project code must contain only numbers'),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  client: z.string().min(2, 'Client name is required'),
  description: z.string().optional(),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  templateId: z.string().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

const blockSchema = z.object({
  code: z.string().min(1, 'Block code is required'),
  name: z.string().min(1, 'Block name is required'),
  levels: z.number().min(1, 'At least 1 level required'),
  unitsPerLevel: z.number().min(1, 'At least 1 unit per level required'),
  includeGroundFloor: z.boolean().default(true),
  includeBasement: z.boolean().default(false),
  includeMezzanine: z.boolean().default(false),
  customLevelCodes: z.array(z.string()).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type BlockFormData = z.infer<typeof blockSchema>;

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  building_type: string;
  default_blocks: number;
  default_levels: number;
  default_units_per_level: number;
  includes_ground_floor: boolean;
  includes_basement: boolean;
  includes_mezzanine: boolean;
}

export const ProjectSetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectFormData | null>(null);
  const [blocks, setBlocks] = useState<BlockFormData[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [customLevelInput, setCustomLevelInput] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const blockForm = useForm<BlockFormData>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      includeGroundFloor: true,
      includeBasement: false,
      includeMezzanine: false,
    }
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('building_type');
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load project templates",
        variant: "destructive",
      });
    }
  };

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
        return true;
      }
      
      if (data) {
        projectForm.setError('code', { message: `Project code "${code}" is already in use` });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking project code:', error);
      return true;
    } finally {
      setIsCheckingCode(false);
    }
  };

  const generateProject = async () => {
    if (!projectData || blocks.length === 0) return;

    setIsGenerating(true);
    
    const retryRequest = async (attempt: number): Promise<any> => {
      try {
        console.log(`🚀 Starting project generation attempt ${attempt} with data:`, { 
          projectCode: projectData.code,
          projectName: projectData.name,
          blocksCount: blocks.length 
        });

        const projectPayload = {
          projectData: {
            code: projectData.code,
            name: projectData.name,
            client: projectData.client,
            startDate: format(projectData.startDate, 'yyyy-MM-dd'),
            endDate: format(projectData.endDate, 'yyyy-MM-dd'),
            blocks: blocks.map(block => ({
              code: block.code,
              name: block.name,
              levels: block.levels,
              unitsPerLevel: block.unitsPerLevel,
              includeGroundFloor: block.includeGroundFloor,
              includeBasement: block.includeBasement,
              includeMezzanine: block.includeMezzanine,
            }))
          },
          applyTemplate: true
        };

        console.log(`📤 Sending payload to bulk generator (attempt ${attempt}):`, projectPayload);

        const { data: generationResult, error: generationError } = await supabase.functions.invoke('project-bulk-generator', {
          body: projectPayload
        });

        if (generationError) {
          console.error(`💥 Generation error (attempt ${attempt}):`, generationError);
          
          let errorMessage = 'Unknown function error occurred';
          let errorCode = 'UNKNOWN_ERROR';
          let shouldRetry = true;
          
          if (generationError.name === 'FunctionsHttpError') {
            try {
              const errorBody = generationError.context?.json || {};
              errorMessage = errorBody.message || errorBody.error || 'Function returned error response';
              errorCode = errorBody.code || 'HTTP_ERROR';
              
              if (generationError.status >= 400 && generationError.status < 500) {
                shouldRetry = false;
              }
              
            } catch (parseError) {
              console.error('Could not parse error response:', parseError);
              errorMessage = `HTTP ${generationError.status}: Function error`;
            }
          } else if (generationError.context?.json) {
            const errorData = generationError.context.json;
            errorMessage = errorData.message || errorData.error || 'Function context error';
            errorCode = errorData.code || 'CONTEXT_ERROR';
          } else if (generationError.message) {
            errorMessage = generationError.message;
            errorCode = 'BASIC_ERROR';
          }
          
          const structuredError = new Error(errorMessage);
          structuredError.name = errorCode;
          (structuredError as any).shouldRetry = shouldRetry;
          throw structuredError;
        }

        console.log(`✅ Generation result (attempt ${attempt}):`, generationResult);

        if (generationResult?.success) {
          const { totalUnits, results, samplePlots, projectCode, projectId } = generationResult;
          const totalBlocks = results?.length || 0;
          const totalLevels = results?.reduce((sum: number, result: any) => sum + (result.levelsCreated || 0), 0) || 0;
          
          toast({
            title: "🎉 PM Nailed It!",
            description: `${projectCode} - ${projectData.name}: Pipeline flowing! ${totalBlocks} blocks, ${totalLevels} levels, ${totalUnits} units—job done! 🚧💪`,
            duration: 6000,
          });

          console.log(`✅ Project summary: ${totalBlocks} blocks, ${totalLevels} levels, ${totalUnits} plots created`);

          navigate(`/projects/${projectId}`);
          return generationResult;
        } else {
          const errorMessage = generationResult?.message || generationResult?.error || 'Generation failed without details';
          const errorCode = generationResult?.code || 'GENERATION_FAILED';
          
          const failError = new Error(errorMessage);
          failError.name = errorCode;
          (failError as any).shouldRetry = false;
          throw failError;
        }
      } catch (error: any) {
        console.error(`💥 Project generation error (attempt ${attempt}):`, error);
        
        const shouldRetry = error.shouldRetry !== false && attempt < 3;
        
        if (shouldRetry) {
          const delay = attempt * 1000;
          console.log(`⏰ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryRequest(attempt + 1);
        }
        
        let userMessage = "Pipeline blocked! Check the flow and try again! 🔧";
        const errorMsg = error.message || '';
        const errorCode = error.name || '';
        
        if (errorCode === 'DUPLICATE_CODE' || errorMsg.includes('collision') || errorMsg.includes('already exists')) {
          userMessage = `Project code "${projectData.code}" collision detected—try a different code! 🔧`;
        } else if (errorCode === 'VALIDATION_ERROR' || errorMsg.includes('validation')) {
          userMessage = `Data validation failed: ${errorMsg} 📋`;
        } else if (errorCode === 'DUPLICATE_BLOCK' || errorCode === 'DUPLICATE_LEVEL' || errorCode === 'DUPLICATE_PLOT') {
          userMessage = `Database conflict detected: ${errorMsg} 🔧`;
        } else if (errorCode === 'CONSTRAINT_VIOLATION') {
          userMessage = `Database constraint error: ${errorMsg} 🗄️`;
        } else if (errorMsg.includes('RLS') || errorMsg.includes('permission')) {
          userMessage = `Security check failed—check permissions? 🔒`;
        } else if (errorCode === 'INVALID_JSON') {
          userMessage = `Data format error: ${errorMsg} 📋`;
        }
        
        toast({
          title: "🚨 Generation Failed!",
          description: userMessage,
          variant: "destructive",
          duration: 8000,
        });
        
        throw error;
      }
    };

    try {
      await retryRequest(1);
    } catch (error) {
      console.error('💥 All retry attempts failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onProjectSubmit = async (data: ProjectFormData) => {
    console.log('🚀 Project form submitted:', data);
    setProjectData(data);
    setCurrentStep(2);
  };

  const addBlock = (data: BlockFormData) => {
    console.log('➕ Adding new block:', data);
    setBlocks(prev => [...prev, data]);
    blockForm.reset();
    toast({
      title: "Block Added",
      description: `Block "${data.name}" has been added to the project`,
    });
  };

  const removeBlock = (index: number) => {
    const removedBlock = blocks[index];
    console.log('➖ Removing block:', removedBlock);
    setBlocks(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Block Removed",
      description: `Block "${removedBlock.name}" has been removed`,
    });
  };

  const totalUnits = blocks.reduce((sum, block) => {
    const specialLevels = 
      (block.includeGroundFloor ? 1 : 0) + 
      (block.includeBasement ? 1 : 0) + 
      (block.includeMezzanine ? 1 : 0);
    const totalLevels = block.levels + specialLevels;
    return sum + (totalLevels * block.unitsPerLevel);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
          <h1 className="text-2xl font-bold text-primary">Project Setup Wizard</h1>
          <p className="text-muted-foreground">Create a new project with AI-assisted setup</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center space-x-2", currentStep >= 1 && "text-primary")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2", 
                currentStep >= 1 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
              )}>
                {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
              </div>
              <span className="font-medium">Project Details</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-muted mx-4" />
            
            <div className={cn("flex items-center space-x-2", currentStep >= 2 && "text-primary")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2", 
                currentStep >= 2 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
              )}>
                {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : "2"}
              </div>
              <span className="font-medium">Blocks & Levels</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-muted mx-4" />
            
            <div className={cn("flex items-center space-x-2", currentStep >= 3 && "text-primary")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2", 
                currentStep >= 3 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
              )}>
                {currentStep > 3 ? <CheckCircle className="w-4 h-4" /> : "3"}
              </div>
              <span className="font-medium">Review & Generate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-primary" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...projectForm}>
                  <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={projectForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
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
                              <p className="text-xs text-muted-foreground">Checking availability...</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={projectForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Project Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Bow Common Phase 1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={projectForm.control}
                      name="client"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Riverside Holdings Ltd" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={projectForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of the project..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={projectForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
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
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={projectForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
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
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={projectForm.control}
                        name="templateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Template</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                const template = templates.find(t => t.id === value);
                                setSelectedTemplate(template || null);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templates.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    <div>
                                      <div className="font-medium">{template.name}</div>
                                      <div className="text-xs text-muted-foreground">{template.building_type}</div>
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

                    <div className="flex justify-end">
                      <Button type="submit" className="btn-primary" disabled={isCheckingCode}>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Continue to Blocks Setup
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-primary" />
                  AI Assistant
                  {isLoadingAI && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Fill in your project details and I'll suggest the best template and setup for your project! 🤖⚡
                </p>
              </CardContent>
            </Card>

            {selectedTemplate && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Selected Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">{selectedTemplate.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Blocks: {selectedTemplate.default_blocks}</div>
                      <div>Levels: {selectedTemplate.default_levels}</div>
                      <div>Units/Level: {selectedTemplate.default_units_per_level}</div>
                      <div>Ground Floor: {selectedTemplate.includes_ground_floor ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {currentStep === 2 && projectData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers3 className="w-5 h-5 mr-2 text-primary" />
                  Add Block
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...blockForm}>
                  <form onSubmit={blockForm.handleSubmit(addBlock)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={blockForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Block Code</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. A, B1, Tower East" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={blockForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Block Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Block A, East Tower" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={blockForm.control}
                        name="levels"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Standard Levels</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="10" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={blockForm.control}
                        name="unitsPerLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Units per Level</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="12" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={blockForm.control}
                        name="includeGroundFloor"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="rounded"
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Include Ground Floor (GF)</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={blockForm.control}
                        name="includeBasement"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="rounded"
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Include Basement (B)</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={blockForm.control}
                        name="includeMezzanine"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="rounded"
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Include Mezzanine (M)</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4">
                      <FormLabel className="text-sm font-medium">Custom Level Codes (Optional)</FormLabel>
                      <div className="mt-2">
                        <Input
                          placeholder="e.g. GF, 01, 02, 03, M, PH (comma-separated)"
                          value={customLevelInput}
                          onChange={(e) => {
                            setCustomLevelInput(e.target.value);
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Override default numbering with custom codes like GF, B1, M, etc.
                        </p>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      Add Block
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {blocks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Configured Blocks ({blocks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {blocks.map((block, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{block.code}</Badge>
                            <span className="font-medium">{block.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {block.levels} levels, {block.unitsPerLevel} units/level
                            {block.includeGroundFloor && ' (+ Ground Floor)'}
                            {block.includeBasement && ' (+ Basement)'}
                            {block.includeMezzanine && ' (+ Mezzanine)'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBlock(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {blocks.length > 0 && (
                <Button onClick={() => setCurrentStep(3)} className="btn-primary">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Review & Generate
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="w-5 h-5 mr-2 text-primary" />
                  Project Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">{projectData.code} - {projectData.name}</h4>
                    <p className="text-sm text-muted-foreground">{projectData.client}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Blocks:</span>
                      <span className="font-medium">{blocks.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Units:</span>
                      <span className="font-medium">{totalUnits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Units/Block:</span>
                      <span className="font-medium">{blocks.length > 0 ? Math.round(totalUnits / blocks.length) : 0}</span>
                    </div>
                  </div>

                  {selectedTemplate && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">Based on template:</p>
                        <p className="text-sm font-medium">{selectedTemplate.name}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {currentStep === 3 && projectData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-primary" />
              Review & Generate Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Project Details</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Code:</strong> {projectData.code}</p>
                  <p><strong>Name:</strong> {projectData.name}</p>
                  <p><strong>Client:</strong> {projectData.client}</p>
                  <p><strong>Start:</strong> {format(projectData.startDate, 'PPP')}</p>
                  <p><strong>End:</strong> {format(projectData.endDate, 'PPP')}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Structure Overview</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Blocks:</strong> {blocks.length}</p>
                  <p><strong>Total Units:</strong> {totalUnits}</p>
                  <p><strong>Template:</strong> {selectedTemplate?.name || 'Custom'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Generation Preview</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Standard Tasks:</strong> 11 per unit</p>
                  <p><strong>Total Tasks:</strong> {totalUnits * 11}</p>
                  <p><strong>Estimated Duration:</strong> {Math.round(totalUnits * 0.5)} weeks</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Block Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {blocks.map((block, index) => {
                  const specialLevels = 
                    (block.includeGroundFloor ? 1 : 0) + 
                    (block.includeBasement ? 1 : 0) + 
                    (block.includeMezzanine ? 1 : 0);
                  const totalLevels = block.levels + specialLevels;
                  const totalUnitsInBlock = totalLevels * block.unitsPerLevel;
                  
                  return (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge>{block.code}</Badge>
                        <span className="font-medium text-sm">{block.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{totalLevels} levels × {block.unitsPerLevel} units = {totalUnitsInBlock} units</p>
                        {block.includeGroundFloor && <p>✓ Ground Floor (GF)</p>}
                        {block.includeBasement && <p>✓ Basement (B)</p>}
                        {block.includeMezzanine && <p>✓ Mezzanine (M)</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blocks
              </Button>
              <Button 
                onClick={generateProject} 
                disabled={isGenerating}
                className="btn-primary"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Project...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Generate Project
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
