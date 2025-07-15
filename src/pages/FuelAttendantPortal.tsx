import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Fuel, AlertTriangle, TrendingUp, RefreshCw, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTrucks, useFuelRecords, useCreateFuelRecord, useReserveTank, useCreateTankRefill } from "@/hooks/useSupabaseData";

interface FuelRecord {
  id: string;
  truck_id: string;
  liters: number;
  total_cost: number;
  fuel_date: string;
  odometer_reading?: number;
  fuel_station?: string;
  receipt_number?: string;
  trucks?: {
    truck_number: string;
    make: string;
    model: string;
  };
}

interface ReserveTank {
  id: string;
  current_level: number;
  capacity: number;
  last_refill_date?: string;
  last_refill_amount?: number;
  cost_per_liter?: number;
}

export default function FuelAttendantPortal() {
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isRefillTankOpen, setIsRefillTankOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const { data: fuelRecords, isLoading: recordsLoading } = useFuelRecords();
  const { data: trucks } = useTrucks();
  const { data: reserveTankData } = useReserveTank();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const createFuelRecord = useCreateFuelRecord();
  const createTankRefill = useCreateTankRefill();

  // Use real reserve tank data or fallback
  const reserveTank = reserveTankData || {
    id: "1",
    current_level: 15000,
    capacity: 30000,
    last_refill_date: "2024-07-08",
    last_refill_amount: 10000,
    cost_per_liter: 165
  };

  const [newRecord, setNewRecord] = useState({
    truck_id: "",
    liters: "",
    total_cost: "",
    fuel_date: new Date().toISOString().split('T')[0],
    odometer_reading: "",
    receipt_number: "",
  });

  const [refillData, setRefillData] = useState({
    capacity_refilled: "",
    price_per_liter: "",
    total_cost: "",
    refill_date: new Date().toISOString().split('T')[0],
  });

  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    location: "",
    address: "",
    emergency_contact: "",
  });

  const handleAddRecord = async () => {
    if (!newRecord.truck_id || !newRecord.liters || !newRecord.total_cost) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all required fields",
        variant: "destructive" 
      });
      return;
    }

    const recordData = {
      truck_id: newRecord.truck_id,
      liters: parseFloat(newRecord.liters),
      total_cost: parseFloat(newRecord.total_cost),
      cost_per_liter: parseFloat(newRecord.total_cost) / parseFloat(newRecord.liters),
      odometer_reading: newRecord.odometer_reading ? parseInt(newRecord.odometer_reading) : null,
      fuel_date: new Date(newRecord.fuel_date).toISOString().split('T')[0],
      receipt_number: newRecord.receipt_number,
      fuel_station: "Company Reserve Tank", // Since this is from the reserve tank
    };

    try {
      createFuelRecord.mutate(recordData);
      
      toast({ 
        title: "Fuel Record Added", 
        description: "Daily fuel record has been successfully recorded"
      });
      
      setIsAddRecordOpen(false);
      setNewRecord({
        truck_id: "",
        liters: "",
        total_cost: "",
        fuel_date: new Date().toISOString().split('T')[0],
        odometer_reading: "",
        receipt_number: "",
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to add fuel record",
        variant: "destructive" 
      });
    }
  };

  const handleRefillTank = () => {
    if (!refillData.capacity_refilled || !refillData.price_per_liter || !refillData.total_cost) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all refill details",
        variant: "destructive" 
      });
      return;
    }

    createTankRefill.mutate({
      tank_id: reserveTank.id,
      refill_amount: parseFloat(refillData.capacity_refilled),
      cost_per_liter: parseFloat(refillData.price_per_liter),
      total_cost: parseFloat(refillData.total_cost),
      refill_date: refillData.refill_date
    });

    toast({ 
      title: "Tank Refilled Successfully", 
      description: `Added ${refillData.capacity_refilled}L to reserve tank`
    });

    setIsRefillTankOpen(false);
    setRefillData({
      capacity_refilled: "",
      price_per_liter: "",
      total_cost: "",
      refill_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out."
    });
  };

  const handleSaveProfile = async () => {
    try {
      const success = await updateProfile(profileData);
      if (success) {
        setIsEditingProfile(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelProfileEdit = () => {
    // Reset to original data
    setProfileData({
      full_name: profile?.full_name || user?.user_metadata?.full_name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      address: profile?.address || '',
      emergency_contact: profile?.emergency_contact || '',
    });
    setIsEditingProfile(false);
  };

  // Load profile data when available
  useEffect(() => {
    if (profile || user) {
      setProfileData({
        full_name: profile?.full_name || user?.user_metadata?.full_name || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        address: profile?.address || '',
        emergency_contact: profile?.emergency_contact || '',
      });
    }
  }, [profile, user]);

  const getUserDisplayName = () => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Fuel Attendant';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Calculate today's records
  const todayRecords = fuelRecords?.filter(record => {
    const recordDate = new Date(record.fuel_date).toDateString();
    const today = new Date().toDateString();
    return recordDate === today;
  }) || [];

  const reservePercentage = (reserveTank.current_level / reserveTank.capacity) * 100;

  if (recordsLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with Profile */}
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Fuel Attendant Portal
            </h1>
            <p className="text-muted-foreground mt-1">Daily fuel records and tank management</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-3 px-4 py-2 hover:bg-orange-50 border-orange-200">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-sm font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground">Fuel Attendant</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Action Buttons */}
            <Dialog open={isRefillTankOpen} onOpenChange={setIsRefillTankOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 hover:bg-orange-50 border-orange-200">
                  <RefreshCw className="w-4 h-4" />
                  Refill Tank
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Refill Reserve Tank</DialogTitle>
                <DialogDescription>Record tank refill details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="capacity">Capacity Refilled (L)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={refillData.capacity_refilled}
                    onChange={(e) => setRefillData({...refillData, capacity_refilled: e.target.value})}
                    placeholder="Enter liters refilled"
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_liter">Price per Liter (KSh)</Label>
                  <Input
                    id="price_per_liter"
                    type="number"
                    step="0.01"
                    value={refillData.price_per_liter}
                    onChange={(e) => setRefillData({...refillData, price_per_liter: e.target.value})}
                    placeholder="Enter price per liter"
                  />
                </div>
                <div>
                  <Label htmlFor="total_cost">Total Cost (KSh)</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    value={refillData.total_cost}
                    onChange={(e) => setRefillData({...refillData, total_cost: e.target.value})}
                    placeholder="Enter total cost"
                  />
                </div>
                <div>
                  <Label htmlFor="refill_date">Refill Date</Label>
                  <Input
                    id="refill_date"
                    type="date"
                    value={refillData.refill_date}
                    onChange={(e) => setRefillData({...refillData, refill_date: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRefillTankOpen(false)}>Cancel</Button>
                <Button onClick={handleRefillTank}>Refill Tank</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

            <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                  <Plus className="w-4 h-4" />
                  Add Daily Record
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Daily Fuel Record</DialogTitle>
                <DialogDescription>Record fuel dispensed to truck</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="truck">Truck</Label>
                  <Select value={newRecord.truck_id} onValueChange={(value) => setNewRecord({...newRecord, truck_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select truck" />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks?.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>
                          {truck.truck_number} - {truck.make} {truck.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="liters">Liters Dispensed</Label>
                    <Input
                      id="liters"
                      type="number"
                      value={newRecord.liters}
                      onChange={(e) => setNewRecord({...newRecord, liters: e.target.value})}
                      placeholder="Enter liters"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Total Cost (KSh)</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={newRecord.total_cost}
                      onChange={(e) => setNewRecord({...newRecord, total_cost: e.target.value})}
                      placeholder="Enter cost"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newRecord.fuel_date}
                    onChange={(e) => setNewRecord({...newRecord, fuel_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="odometer">Odometer Reading (km)</Label>
                  <Input
                    id="odometer"
                    type="number"
                    value={newRecord.odometer_reading}
                    onChange={(e) => setNewRecord({...newRecord, odometer_reading: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="receipt">Receipt Number</Label>
                  <Input
                    id="receipt"
                    value={newRecord.receipt_number}
                    onChange={(e) => setNewRecord({...newRecord, receipt_number: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddRecordOpen(false)}>Cancel</Button>
                <Button onClick={handleAddRecord}>Add Record</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Enhanced Profile Modal */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </DialogTitle>
              <DialogDescription>
                {isEditingProfile ? "Edit your profile information" : "Your account details and information"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-lg font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{getUserDisplayName()}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge className="mt-1 bg-orange-100 text-orange-700 hover:bg-orange-200">
                    Fuel Attendant
                  </Badge>
                </div>
              </div>

              {isEditingProfile ? (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      placeholder="Enter your location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      placeholder="Enter your address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact">Emergency Contact</Label>
                    <Input
                      id="emergency_contact"
                      value={profileData.emergency_contact}
                      onChange={(e) => setProfileData({...profileData, emergency_contact: e.target.value})}
                      placeholder="Enter emergency contact"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <p className="text-sm">{profile?.employee_id || user?.user_metadata?.employee_id || 'Not Set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-sm">{profile?.department || user?.user_metadata?.department || 'Fuel Management'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-sm">{profile?.phone || 'Not Set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="text-sm">{profile?.location || 'Not Set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="text-sm">{profile?.address || 'Not Set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
                    <p className="text-sm">{profile?.emergency_contact || 'Not Set'}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              {isEditingProfile ? (
                <>
                  <Button variant="outline" onClick={handleCancelProfileEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => setIsEditingProfile(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                    Edit Profile
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </DialogTitle>
              <DialogDescription>Configure your preferences and settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Notification Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Notifications</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS Notifications</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Desktop Notifications</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Display Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dark Mode</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compact View</span>
                    <input type="checkbox" className="rounded" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Security</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Two-Factor Authentication
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Close
              </Button>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Stats with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Today's Records</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">{todayRecords.length}</div>
              <p className="text-xs text-blue-600 mt-1">Fuel dispensing records</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Today's Fuel Dispensed</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Fuel className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">
                {todayRecords.reduce((sum, record) => sum + record.liters, 0).toFixed(0)}L
              </div>
              <p className="text-xs text-green-600 mt-1">Total liters dispensed</p>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            reservePercentage < 25 
              ? 'bg-gradient-to-br from-red-50 to-rose-50' 
              : 'bg-gradient-to-br from-orange-50 to-amber-50'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${
                reservePercentage < 25 ? 'text-red-700' : 'text-orange-700'
              }`}>Reserve Tank</CardTitle>
              <div className={`p-2 rounded-lg ${
                reservePercentage < 25 ? 'bg-red-100' : 'bg-orange-100'
              }`}>
                <AlertTriangle className={`h-4 w-4 ${
                  reservePercentage < 25 ? 'text-red-600' : 'text-orange-600'
                }`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                reservePercentage < 25 ? 'text-red-800' : 'text-orange-800'
              }`}>{reservePercentage.toFixed(1)}%</div>
              <p className={`text-xs mt-1 ${
                reservePercentage < 25 ? 'text-red-600' : 'text-orange-600'
              }`}>
                {reserveTank.current_level.toLocaleString()}L / {reserveTank.capacity.toLocaleString()}L
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reserve Tank Status with Enhanced Design */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-orange-50/50 hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Fuel className="w-5 h-5" />
              Reserve Tank Status
            </CardTitle>
            <CardDescription>Current fuel reserve levels and refill history</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div 
                className={`h-6 rounded-full transition-all ${
                  reservePercentage < 25 ? 'bg-red-500' : 
                  reservePercentage < 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${reservePercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span>Current: {reserveTank.current_level.toLocaleString()}L</span>
              <span>Capacity: {reserveTank.capacity.toLocaleString()}L</span>
            </div>
            {reserveTank.last_refill_date && (
              <div className="text-sm text-muted-foreground">
                Last refill: {new Date(reserveTank.last_refill_date).toLocaleDateString()} 
                ({reserveTank.last_refill_amount?.toLocaleString()}L at KSh {reserveTank.cost_per_liter}/L)
              </div>
            )}
            {reservePercentage < 25 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  Warning: Reserve tank is low! Consider refilling soon.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

        {/* Today's Records with Enhanced Design */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30 hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <TrendingUp className="w-5 h-5" />
              Today's Fuel Records
            </CardTitle>
            <CardDescription>All fuel dispensing records for today</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Truck</th>
                  <th className="text-left p-2">Liters</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Receipt #</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(record.fuel_date).toLocaleTimeString()}</td>
                    <td className="p-2">
                      {record.trucks?.truck_number} - {record.trucks?.make}
                    </td>
                    <td className="p-2">{record.liters}L</td>
                    <td className="p-2">KSh {record.total_cost.toLocaleString()}</td>
                    <td className="p-2">{record.receipt_number || '-'}</td>
                  </tr>
                ))}
                {todayRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No fuel records for today yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}