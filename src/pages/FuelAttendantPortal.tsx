import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Fuel, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
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
  const { data: fuelRecords, isLoading: recordsLoading } = useFuelRecords();
  const { data: trucks } = useTrucks();
  const { data: reserveTankData } = useReserveTank();
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fuel Attendant Portal</h1>
          <p className="text-muted-foreground">Daily fuel records and tank management</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isRefillTankOpen} onOpenChange={setIsRefillTankOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
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
              <Button className="flex items-center gap-2">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Records</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRecords.length}</div>
            <p className="text-xs text-muted-foreground">Fuel dispensing records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Fuel Dispensed</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayRecords.reduce((sum, record) => sum + record.liters, 0).toFixed(0)}L
            </div>
            <p className="text-xs text-muted-foreground">Total liters dispensed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserve Tank</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${reservePercentage < 25 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {reserveTank.current_level.toLocaleString()}L / {reserveTank.capacity.toLocaleString()}L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reserve Tank Status */}
      <Card>
        <CardHeader>
          <CardTitle>Reserve Tank Status</CardTitle>
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

      {/* Today's Records */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Fuel Records</CardTitle>
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
  );
}