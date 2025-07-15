
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit3, 
  Save, 
  X,
  Camera,
  Bell,
  Lock,
  Activity,
  Award,
  Briefcase
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { profile, loading, updateProfile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    employeeId: '',
    joinDate: '',
    location: '',
    bio: '',
    address: '',
    emergencyContact: '',
    licenseNumber: '',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  });
  
  const [originalData, setOriginalData] = useState(profileData);

  // Load profile data when available
  useEffect(() => {
    if (profile && user) {
      const formattedData = {
        fullName: profile.full_name || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        role: profile.role || user.user_metadata?.role || '',
        department: profile.department || user.user_metadata?.department || '',
        employeeId: profile.employee_id || user.user_metadata?.employee_id || '',
        joinDate: profile.join_date || new Date().toISOString().split('T')[0],
        location: profile.location || '',
        bio: '',
        address: profile.address || '',
        emergencyContact: profile.emergency_contact || '',
        licenseNumber: profile.license_number || '',
        notifications: {
          email: profile.email_notifications ?? true,
          sms: profile.sms_notifications ?? false,
          push: profile.push_notifications ?? true
        }
      };
      setProfileData(formattedData);
      setOriginalData(formattedData);
    }
  }, [profile, user]);

  const handleSave = async () => {
    const updates = {
      full_name: profileData.fullName,
      phone: profileData.phone,
      department: profileData.department,
      location: profileData.location,
      address: profileData.address,
      emergency_contact: profileData.emergencyContact,
      license_number: profileData.licenseNumber,
      email_notifications: profileData.notifications.email,
      sms_notifications: profileData.notifications.sms,
      push_notifications: profileData.notifications.push,
    };

    const success = await updateProfile(updates);
    if (success) {
      setIsEditing(false);
      setOriginalData(profileData);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData(originalData);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => {
        const parentObj = prev[parent as keyof typeof prev];
        if (typeof parentObj === 'object' && parentObj !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'Fleet Manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Admin': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Driver': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Supervisor': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'activity', label: 'Activity Log', icon: Activity }
  ];

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <User className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              User Profile
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your account information and preferences</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto">
                    <AvatarImage src="" alt={profileData.fullName} />
                    <AvatarFallback className="text-lg sm:text-xl font-bold bg-primary text-primary-foreground">
                      {profileData.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full w-6 h-6 sm:w-8 sm:h-8 p-0">
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                </div>
                
                <h3 className="text-base sm:text-lg font-bold text-foreground">{profileData.fullName}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-all">{profileData.email}</p>
                
                <Badge className={getRoleColor(profileData.role) + " mb-4 text-xs"}>
                  <Shield className="w-3 h-3 mr-1" />
                  {profileData.role}
                </Badge>
                
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{profileData.department}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Joined {new Date(profileData.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{profileData.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 mb-4 sm:mb-6 p-1 bg-muted rounded-lg overflow-x-auto">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                  size="sm"
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </Button>
              ))}
            </div>

            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
                    <CardDescription className="text-sm">Your basic profile and contact information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          disabled={!isEditing}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="employeeId" className="text-sm">Employee ID</Label>
                        <Input
                          id="employeeId"
                          value={profileData.employeeId}
                          disabled
                          className="bg-muted text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role" className="text-sm">Role</Label>
                        <Input
                          id="role"
                          value={profileData.role}
                          disabled
                          className="bg-muted text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="department" className="text-sm">Department</Label>
                        <Input
                          id="department"
                          value={profileData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          disabled={!isEditing}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Address & Emergency Contact</CardTitle>
                    <CardDescription className="text-sm">Additional contact information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="address" className="text-sm">Address</Label>
                        <Textarea
                          id="address"
                          value={profileData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          className="text-sm resize-none"
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="emergencyContact" className="text-sm">Emergency Contact</Label>
                          <Input
                            id="emergencyContact"
                            value={profileData.emergencyContact}
                            onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                            disabled={!isEditing}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="licenseNumber" className="text-sm">License Number</Label>
                          <Input
                            id="licenseNumber"
                            value={profileData.licenseNumber}
                            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                            disabled={!isEditing}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Professional Bio</CardTitle>
                    <CardDescription className="text-sm">Tell us about your experience and expertise</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Share your professional background, experience, and expertise..."
                      className="text-sm resize-none"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Notification Preferences</CardTitle>
                  <CardDescription className="text-sm">Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <div>
                          <p className="font-medium text-sm">Email Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch 
                        checked={profileData.notifications.email} 
                        onCheckedChange={(checked) => handleInputChange('notifications.email', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <div>
                          <p className="font-medium text-sm">SMS Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive updates via SMS</p>
                        </div>
                      </div>
                      <Switch 
                        checked={profileData.notifications.sms} 
                        onCheckedChange={(checked) => handleInputChange('notifications.sms', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        <div>
                          <p className="font-medium text-sm">Push Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive browser notifications</p>
                        </div>
                      </div>
                      <Switch 
                        checked={profileData.notifications.push} 
                        onCheckedChange={(checked) => handleInputChange('notifications.push', checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Password & Security</CardTitle>
                    <CardDescription className="text-sm">Manage your account security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full sm:w-auto text-sm">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2 text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline" className="text-sm">
                        <Shield className="w-4 h-4 mr-2" />
                        Enable 2FA
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === 'activity' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">Your recent system activities and login history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Profile updated', time: '2 hours ago', icon: User },
                      { action: 'Password changed', time: '1 day ago', icon: Lock },
                      { action: 'Login from Nairobi', time: '2 days ago', icon: MapPin },
                      { action: 'Trip created', time: '3 days ago', icon: Activity }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <activity.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
