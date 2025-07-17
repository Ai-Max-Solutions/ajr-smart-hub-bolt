import { AlertCircle, Clock, Mail, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BlockingModalProps {
  isOpen: boolean;
  userName?: string;
}

export const BlockingModal = ({ isOpen, userName }: BlockingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            Account Under Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-gray-900 leading-relaxed">
                    Welcome {userName ? `${userName}, ` : ''}your account is currently under compliance review. 
                    Access to the dashboard is temporarily restricted while our team verifies your credentials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Review in Progress</h4>
                <p className="text-sm text-gray-600">Our compliance team is verifying your documents</p>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 ml-auto">
                ⏳ Pending
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Account Activation</h4>
                <p className="text-sm text-gray-600">You'll receive email confirmation when approved</p>
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-gray-50 to-blue-50">
            <CardContent className="pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                💬 Need Assistance?
              </h4>
              <div className="space-y-2">
                <a 
                  href="mailto:support@ajryan.co.uk" 
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">support@ajryan.co.uk</span>
                </a>
                <a 
                  href="tel:08001234567" 
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">0800 123 4567</span>
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Typical review time: 24-48 hours
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};