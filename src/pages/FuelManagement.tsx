import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Fuel, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTrucks, useFuelRecords, useCreateFuelRecord } from "@/hooks/useSupabaseData";

interface FuelRecord {
  id: string;
  truck_id: string;
  liters: number;
  total_cost: number;
  fuel_date: string;
  odometer_reading?: number;
  fuel_station?: string;
  attendant_name?: string;
  receipt_number?: string;
  trucks?: {
    truck_number: string;
    make: string;
    model: string;
  };
}

interface FuelReserveTank {
  id: string;
  current_level: number;
  capacity: number;
  last_refill_date?: string;
  last_refill_amount?: number;
  cost_per_liter?: number;
}

// Mock data for reserve tank until database is updated
const mockReserveTank = {
  id: "1",
  current_level: 15000,
  capacity: 30000,
  last_refill_date: "2024-07-08",
  last_refill_amount: 10000,
  cost_per_liter: 165
};

export default function FuelManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const { data: fuelRecords, isLoading: recordsLoading } = useFuelRecords();
  const { data: trucks } = useTrucks();
  const createFuelRecord = useCreateFuelRecord();
  const reserveTank = mockReserveTank;

  const [newRecord, setNewRecord] = useState({
    truck_id: "",
    liters: "",
    total_cost: "",
    fuel_date: new Date().toISOString().split('T')[0],
    odometer_reading: "",
    station_name: "",
    attendant_name: "",
    receipt_number: "",
  });

  const [reserveUpdate, setReserveUpdate] = useState({
    refill_amount: "",
    cost_per_liter: "",
  });

  const handleAddRecord = async () => {
    const recordData = {
      truck_id: newRecord.truck_id,
      liters: parseFloat(newRecord.liters),
      total_cost: parseFloat(newRecord.total_cost),
      cost_per_liter: parseFloat(newRecord.total_cost) / parseFloat(newRecord.liters),
      odometer_reading: newRecord.odometer_reading ? parseInt(newRecord.odometer_reading) : null,
      fuel_date: new Date(newRecord.fuel_date).toISOString().split('T')[0],
      fuel_station: newRecord.station_name,
      attendant_name: newRecord.attendant_name,
      receipt_number: newRecord.receipt_number,
    };

    createFuelRecord.mutate(recordData);
    setIsAddDialogOpen(false);
    setNewRecord({
      truck_id: "",
      liters: "",
      total_cost: "",
      fuel_date: new Date().toISOString().split('T')[0],
      odometer_reading: "",
      station_name: "",
      attendant_name: "",
      receipt_number: "",
    });
  };

  const handleReserveRefill = async () => {
    toast({ title: "Reserve tank refill recorded successfully" });
    setIsReserveDialogOpen(false);
    setReserveUpdate({ refill_amount: "", cost_per_liter: "" });
  };

  const calculateFuelStats = () => {
    if (!fuelRecords) return { totalCost: 0, totalLiters: 0, avgEfficiency: 0 };
    
    const thisMonth = fuelRecords.filter(record => {
      const recordDate = new Date(record.fuel_date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    });

    const totalCost = thisMonth.reduce((sum, record) => sum + record.total_cost, 0);
    const totalLiters = thisMonth.reduce((sum, record) => sum + record.liters, 0);
    const avgEfficiency = thisMonth
      .filter(record => record.odometer_reading)
      .reduce((sum, record, _, arr) => {
        const efficiency = record.odometer_reading ? record.odometer_reading / record.liters : 0;
        return sum + efficiency / arr.length;
      }, 0);

    return { totalCost, totalLiters, avgEfficiency };
  };

  const stats = calculateFuelStats();
  const reservePercentage = reserveTank ? (reserveTank.current_level / reserveTank.capacity) * 100 : 0;

  if (recordsLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fuel Management</h1>
          <p className="text-muted-foreground">Track fuel consumption, costs, and reserve tank levels</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Fuel Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Fuel Record</DialogTitle>
              <DialogDescription>Record a new fuel purchase for a truck</DialogDescription>
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
                  <Label htmlFor="liters">Liters</Label>
                  <Input
                    id="liters"
                    type="number"
                    value={newRecord.liters}
                    onChange={(e) => setNewRecord({...newRecord, liters: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Total Cost (KSh)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={newRecord.total_cost}
                    onChange={(e) => setNewRecord({...newRecord, total_cost: e.target.value})}
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
                />
              </div>
              <div>
                <Label htmlFor="station">Fuel Station</Label>
                <Input
                  id="station"
                  value={newRecord.station_name}
                  onChange={(e) => setNewRecord({...newRecord, station_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attendant">Attendant</Label>
                  <Input
                    id="attendant"
                    value={newRecord.attendant_name}
                    onChange={(e) => setNewRecord({...newRecord, attendant_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="receipt">Receipt #</Label>
                  <Input
                    id="receipt"
                    value={newRecord.receipt_number}
                    onChange={(e) => setNewRecord({...newRecord, receipt_number: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddRecord}>Add Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Fuel Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {stats.totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Consumption</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLiters.toFixed(0)}L</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserve Tank</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${reservePercentage < 25 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservePercentage.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {reserveTank?.current_level.toLocaleString()}L / {reserveTank?.capacity.toLocaleString()}L
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgEfficiency.toFixed(1)} km/L</div>
          </CardContent>
        </Card>
      </div>

      {/* Reserve Tank Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reserve Tank Status</CardTitle>
              <CardDescription>30,000L Capacity Tank Management</CardDescription>
            </div>
            <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Refill Tank</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Refill Reserve Tank</DialogTitle>
                  <DialogDescription>Record a refill of the reserve tank</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="refill-amount">Refill Amount (Liters)</Label>
                    <Input
                      id="refill-amount"
                      type="number"
                      value={reserveUpdate.refill_amount}
                      onChange={(e) => setReserveUpdate({...reserveUpdate, refill_amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost-per-liter">Cost per Liter (KSh)</Label>
                    <Input
                      id="cost-per-liter"
                      type="number"
                      value={reserveUpdate.cost_per_liter}
                      onChange={(e) => setReserveUpdate({...reserveUpdate, cost_per_liter: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsReserveDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleReserveRefill}>Record Refill</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${reservePercentage < 25 ? 'bg-red-500' : reservePercentage < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${reservePercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span>Current: {reserveTank?.current_level.toLocaleString()}L</span>
              <span>Capacity: {reserveTank?.capacity.toLocaleString()}L</span>
            </div>
            {reserveTank?.last_refill_date && (
              <div className="text-sm text-muted-foreground">
                Last refill: {new Date(reserveTank.last_refill_date).toLocaleDateString()} 
                ({reserveTank.last_refill_amount?.toLocaleString()}L at KSh {reserveTank.cost_per_liter}/L)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fuel Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Fuel Records</CardTitle>
          <CardDescription>Track all fuel purchases and consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Truck</th>
                  <th className="text-left p-2">Liters</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Station</th>
                  <th className="text-left p-2">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {fuelRecords?.slice(0, 10).map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(record.fuel_date).toLocaleDateString()}</td>
                    <td className="p-2">
                      {record.trucks?.truck_number} - {record.trucks?.make}
                    </td>
                    <td className="p-2">{record.liters}L</td>
                    <td className="p-2">KSh {record.total_cost.toLocaleString()}</td>
                    <td className="p-2">{record.fuel_station || '-'}</td>
                    <td className="p-2">
                      {record.odometer_reading ? `${(record.odometer_reading / record.liters).toFixed(1)} km/L` : '-'}
                    </td>
                  </tr>
                ))}
                {(!fuelRecords || fuelRecords.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      No fuel records found
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