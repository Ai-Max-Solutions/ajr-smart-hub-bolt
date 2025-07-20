import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Users, 
  Wand2, 
  Save, 
  Plus,
  TrendingUp,
  Calculator,
  Star
} from 'lucide-react';

interface UserRate {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  role: string;
  hourly_rate: number;
  bonus_rate: number;
  effective_from: string;
  effective_to?: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

const AdminRates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRates, setUserRates] = useState<UserRate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newRate, setNewRate] = useState<string>('');
  const [newBonusRate, setNewBonusRate] = useState<string>('');
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: {rate: number, bonus: number}}>({});

  useEffect(() => {
    loadRatesData();
  }, []);

  const loadRatesData = async () => {
    try {
      // Load user rates
      const { data: ratesData, error: ratesError } = await supabase
        .from('user_job_rates')
        .select(`
          id,
          role,
          hourly_rate,
          bonus_rate,
          effective_from,
          effective_to,
          user:users!inner(id, name, role)
        `)
        .order('effective_from', { ascending: false });

      if (ratesError) throw ratesError;
      setUserRates(ratesData || []);

      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, role')
        .order('name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

    } catch (error) {
      console.error('Error loading rates data:', error);
      toast({
        title: "Error",
        description: "Failed to load rates data",
        variant: "destructive"
      });
    }
  };

  const updateRate = async (rateId: string, newHourlyRate: number, newBonusRateValue: number) => {
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('user_job_rates')
        .update({
          hourly_rate: newHourlyRate,
          bonus_rate: newBonusRateValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', rateId);

      if (error) throw error;

      toast({
        title: "Rate Updated! 💰",
        description: "User rate has been successfully updated",
      });

      loadRatesData();
    } catch (error) {
      console.error('Error updating rate:', error);
      toast({
        title: "Error",
        description: "Failed to update rate",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addNewRate = async () => {
    if (!selectedUser || !selectedRole || !newRate) return;

    setIsSaving(true);
    
    try {
      // End current rate if exists
      const { error: endError } = await supabase
        .from('user_job_rates')
        .update({ effective_to: new Date().toISOString().split('T')[0] })
        .eq('user_id', selectedUser)
        .eq('role', selectedRole as "Operative" | "Supervisor" | "Admin" | "PM" | "Director")
        .is('effective_to', null);

      if (endError) throw endError;

      // Add new rate
      const { error } = await supabase
        .from('user_job_rates')
        .insert({
          user_id: selectedUser,
          role: selectedRole as any,
          hourly_rate: parseFloat(newRate),
          bonus_rate: parseFloat(newBonusRate) || 0,
          effective_from: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "New Rate Added! 🎉",
        description: `Rate of £${newRate}/hr added successfully`,
      });

      setIsAddingRate(false);
      setSelectedUser('');
      setSelectedRole('');
      setNewRate('');
      setNewBonusRate('');
      loadRatesData();
      
    } catch (error) {
      console.error('Error adding rate:', error);
      toast({
        title: "Error",
        description: "Failed to add new rate",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateAISuggestion = async (userId: string, role: string) => {
    try {
      // Simulate AI rate suggestion based on role and performance
      // In real implementation, would call OpenAI API
      const baseSuggestions = {
        'Operative': { base: 25, bonus: 5 },
        'Supervisor': { base: 35, bonus: 8 },
        'PM': { base: 45, bonus: 12 },
        'Admin': { base: 30, bonus: 6 },
        'Director': { base: 60, bonus: 15 }
      };

      const suggestion = baseSuggestions[role as keyof typeof baseSuggestions] || { base: 25, bonus: 5 };
      
      // Add some random variation for "AI" feel
      const variance = 0.1; // 10% variance
      const rateVariation = (Math.random() - 0.5) * variance;
      const bonusVariation = (Math.random() - 0.5) * variance;
      
      const suggestedRate = Math.round(suggestion.base * (1 + rateVariation));
      const suggestedBonus = Math.round(suggestion.bonus * (1 + bonusVariation));

      setAiSuggestions(prev => ({
        ...prev,
        [userId]: { rate: suggestedRate, bonus: suggestedBonus }
      }));

      toast({
        title: "AI Suggestion Generated! 🤖",
        description: `Suggested £${suggestedRate}/hr + £${suggestedBonus} bonus rate`,
      });

    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestion",
        variant: "destructive"
      });
    }
  };

  const applyAISuggestion = (userId: string, rateId: string) => {
    const suggestion = aiSuggestions[userId];
    if (suggestion) {
      updateRate(rateId, suggestion.rate, suggestion.bonus);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Director': return 'bg-purple-500';
      case 'PM': return 'bg-blue-500';
      case 'Supervisor': return 'bg-green-500';
      case 'Admin': return 'bg-orange-500';
      case 'Operative': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const currentRates = userRates.filter(rate => !rate.effective_to);
  const historicalRates = userRates.filter(rate => rate.effective_to);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Job Rates</h1>
          <p className="text-muted-foreground">Manage rates, bonuses, and AI optimization</p>
        </div>
        
        <Dialog open={isAddingRate} onOpenChange={setIsAddingRate}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User Rate</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Job Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operative">Operative</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="PM">Project Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hourly Rate (£)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    placeholder="25.00"
                  />
                </div>
                
                <div>
                  <Label>Bonus Rate (£)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    value={newBonusRate}
                    onChange={(e) => setNewBonusRate(e.target.value)}
                    placeholder="5.00"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddingRate(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={addNewRate}
                  disabled={!selectedUser || !selectedRole || !newRate || isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Rate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Rates</p>
                <p className="text-2xl font-bold">{currentRates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Hourly Rate</p>
                <p className="text-2xl font-bold">
                  £{currentRates.length > 0 ? 
                    (currentRates.reduce((sum, rate) => sum + rate.hourly_rate, 0) / currentRates.length).toFixed(2) : 
                    '0.00'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Bonus Rate</p>
                <p className="text-2xl font-bold">
                  £{currentRates.length > 0 ? 
                    (currentRates.reduce((sum, rate) => sum + (rate.bonus_rate || 0), 0) / currentRates.length).toFixed(2) : 
                    '0.00'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cost/Week</p>
                <p className="text-2xl font-bold">
                  £{(currentRates.reduce((sum, rate) => sum + (rate.hourly_rate * 40), 0)).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Current Rates ({currentRates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentRates.map((rate) => (
              <div key={rate.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{rate.user.name}</h3>
                      <Badge className={getRoleColor(rate.role)}>
                        {rate.role}
                      </Badge>
                      <Badge variant="outline">
                        {rate.user.role}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">Hourly Rate</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.50"
                            defaultValue={rate.hourly_rate}
                            className="w-24"
                            onBlur={(e) => {
                              const newValue = parseFloat(e.target.value);
                              if (newValue !== rate.hourly_rate) {
                                updateRate(rate.id, newValue, rate.bonus_rate);
                              }
                            }}
                          />
                          <span className="text-sm text-muted-foreground">/hr</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Bonus Rate</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.50"
                            defaultValue={rate.bonus_rate || 0}
                            className="w-24"
                            onBlur={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              if (newValue !== rate.bonus_rate) {
                                updateRate(rate.id, rate.hourly_rate, newValue);
                              }
                            }}
                          />
                          <span className="text-sm text-muted-foreground">/hr</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Weekly Cost</Label>
                        <p className="text-lg font-semibold">£{(rate.hourly_rate * 40).toFixed(0)}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Effective From</Label>
                        <p className="text-sm">{new Date(rate.effective_from).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateAISuggestion(rate.user.id, rate.role)}
                    >
                      <Wand2 className="h-4 w-4 mr-1" />
                      AI Suggest
                    </Button>
                    
                    {aiSuggestions[rate.user.id] && (
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                          AI: £{aiSuggestions[rate.user.id].rate}/hr + £{aiSuggestions[rate.user.id].bonus} bonus
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1"
                          onClick={() => applyAISuggestion(rate.user.id, rate.id)}
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {currentRates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active rates found. Add some rates to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rate History */}
      {historicalRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Rate History ({historicalRates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historicalRates.slice(0, 10).map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-3 border rounded text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{rate.user.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {rate.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>£{rate.hourly_rate}/hr + £{rate.bonus_rate || 0} bonus</span>
                    <span>
                      {new Date(rate.effective_from).toLocaleDateString()} - {new Date(rate.effective_to!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminRates;