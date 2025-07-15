import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CSCSCardUploader } from '@/components/ui/cscs-card-uploader';
import { ProfilePictureUploader } from '@/components/ui/profile-picture-uploader';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Shield,
  Edit,
  Save,
  X
} from 'lucide-react';

const MyProfile = () => {
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    cscsNumber: '',
    cscsExpiry: '',
    cscsType: '',
    avatarUrl: ''
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('Users')
          .select('*')
          .eq('supabase_auth_id', authUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user profile:', error);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          setUserProfile(data);
          setFormData({
            firstName: data.firstname || '',
            lastName: data.lastname || '',
            email: data.email || authUser.email || '',
            phone: data.phone || '',
            address: data.address || '',
            emergencyContact: data.emergencycontact || '',
            emergencyPhone: data.emergencyphone || '',
            cscsNumber: data.cscscardnumber || '',
            cscsExpiry: data.cscsexpirydate || '',
            cscsType: '',
            avatarUrl: data.avatar_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  const handleSave = async () => {
    try {
      if (!authUser?.id || !userProfile?.whalesync_postgres_id) {
        toast({
          title: "Error",
          description: "User not found. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }

      // Update user profile in the database
      const { error } = await supabase
        .from('Users')
        .update({
          firstname: formData.firstName,
          lastname: formData.lastName,
          fullname: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          address: formData.address,
          emergencycontact: formData.emergencyContact,
          emergencyphone: formData.emergencyPhone,
          cscscardnumber: formData.cscsNumber,
          cscsexpirydate: formData.cscsExpiry || null,
        })
        .eq('whalesync_postgres_id', userProfile.whalesync_postgres_id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstname || '',
        lastName: userProfile.lastname || '',
        email: userProfile.email || authUser?.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        emergencyContact: userProfile.emergencycontact || '',
        emergencyPhone: userProfile.emergencyphone || '',
        cscsNumber: userProfile.cscscardnumber || '',
        cscsExpiry: userProfile.cscsexpirydate || '',
        cscsType: '',
        avatarUrl: userProfile.avatar_url || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and CSCS details
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-accent text-accent-foreground">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} className="bg-accent text-accent-foreground">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Profile Picture Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Picture</span>
            </CardTitle>
            <CardDescription>
              Upload a selfie or let our AI create something amazing for you!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfilePictureUploader
              currentAvatarUrl={formData.avatarUrl}
              userName={`${formData.firstName} ${formData.lastName}`.trim()}
              userRole={userProfile?.role || 'Site Operative'}
              userSkills={userProfile?.skills || []}
              cscsLevel={userProfile?.cscs_validation_status || 'Pending'}
              onAvatarUpdate={(url) => setFormData({ ...formData, avatarUrl: url })}
            />
          </CardContent>
        </Card>

        {/* Profile Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center overflow-hidden">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-accent" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {formData.firstName} {formData.lastName}
                </CardTitle>
                <CardDescription className="text-lg">
                  {userProfile?.role || 'Site Operative'}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 ml-auto">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter your address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Emergency Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter emergency contact name"
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Enter emergency contact phone"
                />
              </div>
            </CardContent>
          </Card>

          {/* CSCS Information */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              {isEditing ? (
                <CSCSCardUploader
                  data={{
                    number: formData.cscsNumber,
                    expiryDate: formData.cscsExpiry,
                    cardType: formData.cscsType || '',
                  }}
                  updateData={(cscsData) => setFormData({
                    ...formData,
                    cscsNumber: cscsData.number || formData.cscsNumber,
                    cscsExpiry: cscsData.expiryDate || formData.cscsExpiry,
                    cscsType: cscsData.cardType || formData.cscsType,
                  })}
                  onAnalysisComplete={(analysis) => {
                    toast({
                      title: "CSCS Card Analyzed",
                      description: `Successfully detected ${analysis.card_color} ${analysis.card_type} card`,
                    });
                  }}
                  required={false}
                />
              ) : (
                <div className="p-6">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>CSCS Card Information</span>
                    </CardTitle>
                  </CardHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>CSCS Card Number</Label>
                        <div className="p-2 bg-muted rounded text-sm">
                          {formData.cscsNumber || 'Not provided'}
                        </div>
                      </div>
                      
                      <div>
                        <Label>CSCS Expiry Date</Label>
                        <div className="p-2 bg-muted rounded text-sm">
                          {formData.cscsExpiry || 'Not provided'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-medium">CSCS Status</span>
                      </div>
                      <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                        Keep your CSCS card information up to date. This is required for site access.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you need to update information that you cannot change here, or if you're having 
              trouble with your CSCS verification, please contact your supervisor or HR.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyProfile;