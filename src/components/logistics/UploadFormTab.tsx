import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ParsedForm {
  deliveryDate: string;
  deliveryTime: string;
  supplier: string;
  items: Array<{
    item: string;
    quantity: number;
  }>;
  deliveryMethod: any;
  vehicleDetails: any;
}

interface Props {
  projectId: string;
}

export const UploadFormTab = ({ projectId }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedForm | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.name.endsWith('.docx')) {
      setParseError('Please upload a DOCX file');
      return;
    }

    setUploading(true);
    setParseError(null);
    setParsedData(null);
    setSummary(null);

    try {
      // Read file content (simplified - in real implementation you'd use a DOCX parser)
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileContent = e.target?.result as string;
          
          // For demo purposes, simulate DOCX parsing
          const sampleText = `
            Delivery Request Form
            Date: 21/07/2025
            Preferred Time: 10:00 AM
            Supplier: AJ Ryan Suppliers Ltd
            
            Items:
            DE6-ES: 1
            DS1A-NES: 1
            
            Delivery Method:
            Pallets: 2
            Unload Method: Forklift
            
            Vehicle Details:
            Type: 18 ton rigid
            Supplier: Transport Co
            Over 3.5T: Yes
            Weight: 18 ton
            FORS Number: 004886
            Colour: Silver
          `;

          // Call AI parsing edge function
          const { data, error } = await supabase.functions.invoke('parse-delivery-form', {
            body: { formText: sampleText }
          });

          if (error) throw error;

          if (data.error) {
            setParseError(data.error);
            if (data.parsedData) {
              setParsedData(data.parsedData);
            }
            return;
          }

          setParsedData(data.parsedData);
          setSummary(data.summary);
          
          toast({
            title: 'Form Parsed Successfully',
            description: data.summary,
          });

        } catch (error) {
          console.error('Error parsing form:', error);
          setParseError('Failed to parse the document');
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setParseError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const handleSubmitRequest = async () => {
    if (!parsedData || !user || !projectId) return;

    try {
      setUploading(true);

      const requestId = `REQ-${Date.now()}`;
      
      const { error } = await supabase
        .from('delivery_bookings')
        .insert({
          project_id: projectId,
          request_id: requestId,
          submitted_by: user.id,
          supplier: parsedData.supplier,
          delivery_date: parsedData.deliveryDate,
          delivery_time: parsedData.deliveryTime,
          items_json: parsedData.items,
          delivery_method: parsedData.deliveryMethod,
          vehicle_details: parsedData.vehicleDetails,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: `Delivery request ${requestId} has been submitted for review`,
      });

      // Reset form
      setParsedData(null);
      setSummary(null);
      setParseError(null);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit delivery request',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Delivery Request Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Processing document...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop the DOCX file here' : 'Drag & drop a DOCX file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to select a delivery request form
                </p>
                <Badge variant="outline" className="mt-2">
                  Only .docx files are supported
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parse Error */}
      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {/* AI Summary */}
      {summary && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{summary}</AlertDescription>
        </Alert>
      )}

      {/* Parsed Data Preview */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Form Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Delivery Details</h4>
                <p><strong>Date:</strong> {format(new Date(parsedData.deliveryDate), 'dd/MM/yyyy')}</p>
                <p><strong>Time:</strong> {parsedData.deliveryTime}</p>
                <p><strong>Supplier:</strong> {parsedData.supplier}</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Vehicle Details</h4>
                <p><strong>Type:</strong> {parsedData.vehicleDetails?.type || 'Not specified'}</p>
                <p><strong>Over 3.5T:</strong> {parsedData.vehicleDetails?.over35T ? 'Yes' : 'No'}</p>
                {parsedData.vehicleDetails?.weight && (
                  <p><strong>Weight:</strong> {parsedData.vehicleDetails.weight}</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="border rounded">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-left">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.items?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.item}</td>
                        <td className="p-2">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Method */}
            <div>
              <h4 className="font-semibold">Delivery Method</h4>
              {parsedData.deliveryMethod?.pallets && (
                <p><strong>Pallets:</strong> {parsedData.deliveryMethod.pallets}</p>
              )}
              <p><strong>Unload Method:</strong> {parsedData.deliveryMethod?.unloadMethod || 'Not specified'}</p>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSubmitRequest} 
                disabled={uploading || !!parseError}
                className="w-full md:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Delivery Request'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};