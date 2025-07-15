import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  X,
  Camera,
  Shield,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContractorProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_role: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  vehicle_registration?: string;
  vehicle_type?: string;
  vehicle_weight_category?: string;
  fors_level?: string;
  assigned_work_activities?: string[];
  created_at: string;
  company: {
    company_name: string;
    primary_contact_email: string;
    primary_contact_phone: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    accreditations?: string[];
    status: string;
  };
}

export const ContractorProfile = () => {
  const [profile, setProfile] = useState<ContractorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ContractorProfileData>>({});
  const [saving, setSaving] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('contractor_profiles')
        .select(`
          *,
          company:contractor_companies(*)
        `)
        .eq('auth_user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditData(data);
      
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('contractor_profiles')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          phone: editData.phone,
          job_role: editData.job_role,
          emergency_contact_name: editData.emergency_contact_name,
          emergency_contact_phone: editData.emergency_contact_phone,
          vehicle_registration: editData.vehicle_registration,
          vehicle_type: editData.vehicle_type,
          vehicle_weight_category: editData.vehicle_weight_category,
          fors_level: editData.fors_level
        })
        .eq('id', profile?.id);

      if (error) throw error;
      
      await loadProfile();
      setEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
      
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile || {});
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="contractor-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold contractor-accent-text">Contractor Profile</h1>
          <p className="text-muted-foreground">Manage your personal and company information</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="contractor-button">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} className="contractor-button">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="contractor-card">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" />
                <AvatarFallback className="bg-contractor-accent text-white text-lg">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="contractor-accent-text flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your personal details and contact information</CardDescription>
              </div>
              {editing && (
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                {editing ? (
                  <Input
                    id="first_name"
                    value={editData.first_name || ''}
                    onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.first_name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                {editing ? (
                  <Input
                    id="last_name"
                    value={editData.last_name || ''}
                    onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-contractor-accent" />
                <p className="text-sm">{profile.email}</p>
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {editing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  placeholder="Your phone number"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-contractor-accent" />
                  <p className="text-sm">{profile.phone || 'Not provided'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_role">Job Role</Label>
              {editing ? (
                <Input
                  id="job_role"
                  value={editData.job_role || ''}
                  onChange={(e) => setEditData({...editData, job_role: e.target.value})}
                  placeholder="Your job role"
                />
              ) : (
                <p className="text-sm font-medium">{profile.job_role}</p>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-contractor-accent" />
                Emergency Contact
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  {editing ? (
                    <Input
                      id="emergency_contact_name"
                      value={editData.emergency_contact_name || ''}
                      onChange={(e) => setEditData({...editData, emergency_contact_name: e.target.value})}
                      placeholder="Emergency contact name"
                    />
                  ) : (
                    <p className="text-sm">{profile.emergency_contact_name || 'Not provided'}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                  {editing ? (
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      value={editData.emergency_contact_phone || ''}
                      onChange={(e) => setEditData({...editData, emergency_contact_phone: e.target.value})}
                      placeholder="Emergency contact phone"
                    />
                  ) : (
                    <p className="text-sm">{profile.emergency_contact_phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <div className="space-y-6">
          <Card className="contractor-card">
            <CardHeader>
              <CardTitle className="contractor-accent-text flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Your company details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{profile.company.company_name}</h3>
                <Badge 
                  variant={profile.company.status === 'active' ? 'default' : 'secondary'}
                  className={profile.company.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                >
                  {profile.company.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-contractor-accent" />
                  <span className="text-sm">{profile.company.primary_contact_email}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-contractor-accent" />
                  <span className="text-sm">{profile.company.primary_contact_phone}</span>
                </div>

                {profile.company.address_line_1 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-contractor-accent mt-0.5" />
                    <div className="text-sm">
                      <p>{profile.company.address_line_1}</p>
                      {profile.company.address_line_2 && <p>{profile.company.address_line_2}</p>}
                      <p>{profile.company.city} {profile.company.postal_code}</p>
                      <p>{profile.company.country}</p>
                    </div>
                  </div>
                )}
              </div>

              {profile.company.accreditations && profile.company.accreditations.length > 0 && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium mb-2">Accreditations</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.company.accreditations.map((accreditation, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {accreditation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card className="contractor-card">
            <CardHeader>
              <CardTitle className="contractor-accent-text">Vehicle Information</CardTitle>
              <CardDescription>Details about your work vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  {editing ? (
                    <Input
                      id="vehicle_type"
                      value={editData.vehicle_type || ''}
                      onChange={(e) => setEditData({...editData, vehicle_type: e.target.value})}
                      placeholder="e.g., Van, Truck, Car"
                    />
                  ) : (
                    <p className="text-sm">{profile.vehicle_type || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_registration">Registration</Label>
                  {editing ? (
                    <Input
                      id="vehicle_registration"
                      value={editData.vehicle_registration || ''}
                      onChange={(e) => setEditData({...editData, vehicle_registration: e.target.value})}
                      placeholder="Vehicle registration number"
                    />
                  ) : (
                    <p className="text-sm font-mono">{profile.vehicle_registration || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_weight_category">Weight Category</Label>
                  {editing ? (
                    <Input
                      id="vehicle_weight_category"
                      value={editData.vehicle_weight_category || ''}
                      onChange={(e) => setEditData({...editData, vehicle_weight_category: e.target.value})}
                      placeholder="e.g., 3.5t, 7.5t, HGV"
                    />
                  ) : (
                    <p className="text-sm">{profile.vehicle_weight_category || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fors_level">FORS Level</Label>
                  {editing ? (
                    <Input
                      id="fors_level"
                      value={editData.fors_level || ''}
                      onChange={(e) => setEditData({...editData, fors_level: e.target.value})}
                      placeholder="e.g., Bronze, Silver, Gold"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{profile.fors_level || 'Not provided'}</p>
                      {profile.fors_level && (
                        <Badge variant="outline" className="text-xs">
                          Certified
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Timeline */}
          <Card className="contractor-card">
            <CardHeader>
              <CardTitle className="contractor-accent-text flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Account Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-contractor-accent rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Account Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                

                {profile.assigned_work_activities && profile.assigned_work_activities.length > 0 && (
                  <div className="pt-3 border-t">
                    <h4 className="font-medium mb-2">Assigned Work Activities</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.assigned_work_activities.map((activity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};