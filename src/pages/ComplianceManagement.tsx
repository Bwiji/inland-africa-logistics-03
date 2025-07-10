import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, AlertTriangle, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useTrucks } from "@/hooks/useSupabaseData";

interface ComplianceRecord {
  id: string;
  truck_id: string;
  compliance_type: string;
  license_number?: string;
  renewal_date: string;
  expiry_date: string;
  cost?: number;
  status: string;
  notes?: string;
  document_url?: string;
  trucks?: {
    truck_number: string;
    make: string;
    model: string;
  };
}

// Mock compliance data until database is updated
const mockComplianceRecords: ComplianceRecord[] = [];

export default function ComplianceManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const complianceRecords = mockComplianceRecords;
  const isLoading = false;
  const { data: trucks } = useTrucks();

  const [newRecord, setNewRecord] = useState({
    truck_id: "",
    compliance_type: "",
    license_number: "",
    renewal_date: "",
    cost: "",
    notes: "",
  });

  const handleAddRecord = async () => {
    toast({ title: "Compliance record added successfully" });
    setIsAddDialogOpen(false);
    setNewRecord({
      truck_id: "",
      compliance_type: "",
      license_number: "",
      renewal_date: "",
      cost: "",
      notes: "",
    });
  };

  const handleRenewRecord = async (record: ComplianceRecord) => {
    toast({ title: "Compliance record renewed successfully" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getComplianceStats = () => {
    if (!complianceRecords) return { active: 0, expiring: 0, expired: 0 };
    
    const active = complianceRecords.filter(r => r.status === 'active').length;
    const expiring = complianceRecords.filter(r => r.status === 'expiring_soon').length;
    const expired = complianceRecords.filter(r => r.status === 'expired').length;
    
    return { active, expiring, expired };
  };

  const stats = getComplianceStats();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground">Track NTSA, Insurance, and TGL license compliance</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Compliance Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Compliance Record</DialogTitle>
              <DialogDescription>Add a new compliance record for a truck</DialogDescription>
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
              <div>
                <Label htmlFor="type">Compliance Type</Label>
                <Select value={newRecord.compliance_type} onValueChange={(value) => setNewRecord({...newRecord, compliance_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compliance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NTSA">NTSA License</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="TGL">TGL License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="license-number">License Number</Label>
                <Input
                  id="license-number"
                  value={newRecord.license_number}
                  onChange={(e) => setNewRecord({...newRecord, license_number: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="renewal-date">Renewal Date</Label>
                <Input
                  id="renewal-date"
                  type="date"
                  value={newRecord.renewal_date}
                  onChange={(e) => setNewRecord({...newRecord, renewal_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost (KSh)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={newRecord.cost}
                  onChange={(e) => setNewRecord({...newRecord, cost: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Valid licenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Needs renewal</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Records by Type */}
      {['NTSA', 'Insurance', 'TGL'].map((type) => {
        const typeRecords = complianceRecords?.filter(r => r.compliance_type === type) || [];
        
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {type} Compliance
              </CardTitle>
              <CardDescription>
                {type === 'NTSA' && 'National Transport and Safety Authority licensing'}
                {type === 'Insurance' && 'Vehicle insurance coverage'}
                {type === 'TGL' && 'Transport Goods License'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Truck</th>
                      <th className="text-left p-2">License Number</th>
                      <th className="text-left p-2">Renewal Date</th>
                      <th className="text-left p-2">Expiry Date</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Cost</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {record.trucks?.truck_number} - {record.trucks?.make}
                        </td>
                        <td className="p-2">{record.license_number || '-'}</td>
                        <td className="p-2">{new Date(record.renewal_date).toLocaleDateString()}</td>
                        <td className="p-2">{new Date(record.expiry_date).toLocaleDateString()}</td>
                        <td className="p-2">{getStatusBadge(record.status)}</td>
                        <td className="p-2">
                          {record.cost ? `KSh ${record.cost.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2">
                          {(record.status === 'expired' || record.status === 'expiring_soon') && (
                            <Button 
                              size="sm" 
                              onClick={() => handleRenewRecord(record)}
                              className="text-xs"
                            >
                              Renew
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {typeRecords.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          No {type} records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}