
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface PersonalDetailsStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({ onNext, onSkip }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async ({ firstName, lastName }: { firstName: string; lastName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Call the complete_user_profile function
      const { data, error } = await supabase.rpc('complete_user_profile', {
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      onNext();
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter both first and last name');
      return;
    }

    updateProfileMutation.mutate({ firstName, lastName });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-ajryan-dark">
          Welcome to AJ Ryan SmartWork Hub
        </CardTitle>
        <CardDescription>
          Let's start by getting your basic details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className="space-y-2 pt-4">
            <Button
              type="submit"
              className="w-full bg-ajryan-yellow hover:bg-ajryan-yellow/90 text-ajryan-dark"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Continue'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onSkip}
            >
              Skip for now
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
