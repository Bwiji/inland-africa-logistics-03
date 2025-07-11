import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FilterExportBar } from "@/components/FilterExportBar";
import { Calendar, Settings, Truck, Loader2, Clock, CheckCircle, DollarSign, AlertTriangle, Wrench, FileText, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useOngoingMaintenance, useCreateMaintenance, useUpdateMaintenanceStatus, useTrucks, useMaintenanceHistory } from "@/hooks/useSupabaseData";
import { AddMaintenanceRecord } from "@/components/forms/AddMaintenanceRecord";
import { MaintenanceDetailsModal } from "@/components/MaintenanceDetailsModal";
import { ScheduleServiceModal } from "@/components/ScheduleServiceModal";
import { useToast } from "@/hooks/use-toast";

const ServiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const { data: maintenance, isLoading, error } = useOngoingMaintenance();
  const { data: maintenanceHistory } = useMaintenanceHistory();
  const { data: trucks } = useTrucks();
  const createMaintenance = useCreateMaintenance();
  const updateMaintenanceStatus = useUpdateMaintenanceStatus();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading maintenance records: {error.message}
      </div>
    );
  }

  const allMaintenanceRecords = [...(maintenance || []), ...(maintenanceHistory || [])];
  
  const filteredRecords = allMaintenanceRecords?.filter(record => {
    const matchesSearch = record.maintenance_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.trucks?.truck_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTruck = !selectedTruck || record.truck_id === selectedTruck;
    return matchesSearch && matchesTruck;
  }) || [];

  const totalServices = allMaintenanceRecords?.length || 0;
  const pendingServices = allMaintenanceRecords?.filter(record => record.status === 'pending').length || 0;
  const inProgressServices = allMaintenanceRecords?.filter(record => record.status === 'in_progress').length || 0;
  const completedServices = allMaintenanceRecords?.filter(record => record.status === 'completed').length || 0;
  const totalCost = allMaintenanceRecords?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;

  // Calculate maintenance trends and analytics
  const getMaintenanceStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthRecords = allMaintenanceRecords?.filter(record => {
      const recordDate = new Date(record.service_date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }) || [];
    
    const lastMonthRecords = allMaintenanceRecords?.filter(record => {
      const recordDate = new Date(record.service_date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === lastMonthYear;
    }) || [];

    const thisMonthCost = thisMonthRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
    const lastMonthCost = lastMonthRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
    
    const costTrend = lastMonthCost > 0 ? ((thisMonthCost - lastMonthCost) / lastMonthCost) * 100 : 0;
    
    return {
      thisMonthServices: thisMonthRecords.length,
      thisMonthCost,
      lastMonthServices: lastMonthRecords.length,
      lastMonthCost,
      costTrend
    };
  };

  const getTruckMaintenanceData = () => {
    return trucks?.map(truck => {
      const truckRecords = allMaintenanceRecords?.filter(record => record.truck_id === truck.id) || [];
      const totalCost = truckRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
      const lastServiceDate = truckRecords
        .filter(record => record.status === 'completed')
        .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())[0]?.service_date;
      
      const upcomingServices = truckRecords.filter(record => record.status === 'pending' || record.status === 'in_progress');
      
      // Calculate service health score based on maintenance frequency and cost
      const averageMonthlyCost = totalCost / Math.max(1, truckRecords.length);
      const daysSinceLastService = lastServiceDate ? 
        Math.floor((new Date().getTime() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)) : 365;
      
      let healthScore = 100;
      if (daysSinceLastService > 90) healthScore -= 30;
      if (daysSinceLastService > 180) healthScore -= 20;
      if (averageMonthlyCost > 50000) healthScore -= 20; // High maintenance cost
      if (upcomingServices.length > 2) healthScore -= 15; // Too many pending services
      
      return {
        ...truck,
        totalMaintenanceCost: totalCost,
        lastServiceDate,
        upcomingServices: upcomingServices.length,
        healthScore: Math.max(0, healthScore),
        daysSinceLastService,
        servicesCount: truckRecords.length
      };
    }) || [];
  };

  const stats = getMaintenanceStats();
  const truckData = getTruckMaintenanceData();

  const handleFilterApply = (filters: any) => {
    setFilters(filters);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting service records in ${format} format`);
  };

  const handleCompleteService = async (recordId: string) => {
    try {
      await updateMaintenanceStatus.mutateAsync({
        id: recordId,
        status: 'completed'
      });
      
      toast({
        title: "Service Completed",
        description: "Maintenance service has been marked as completed successfully.",
      });
    } catch (error) {
      console.error('Failed to complete service:', error);
      toast({
        title: "Error",
        description: "Failed to complete service. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleScheduleService = async (serviceData: any) => {
    try {
      const maintenanceData = {
        truck_id: serviceData.truckId,
        maintenance_type: serviceData.maintenanceType,
        description: serviceData.description,
        service_date: new Date(serviceData.serviceDate).toISOString().split('T')[0],
        cost: serviceData.cost,
        technician: serviceData.technician || null,
        service_provider: serviceData.serviceProvider || null,
        items_purchased: serviceData.itemsPurchased || null
      };

      await createMaintenance.mutateAsync(maintenanceData);
      
      toast({
        title: "Service Scheduled",
        description: "Maintenance service has been successfully scheduled.",
      });
    } catch (error) {
      console.error('Failed to schedule service:', error);
      toast({
        title: "Error",
        description: "Failed to schedule service. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="w-6 h-6 sm:w-8 sm:h-8" />
            Service Management & Analytics
          </h1>
          <p className="text-muted-foreground">Complete fleet maintenance tracking, analytics, and service scheduling</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          onClick={() => setShowAddForm(true)}
        >
          Schedule New Service
        </Button>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="bg-card hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{totalServices}</p>
              </div>
              <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{pendingServices}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{inProgressServices}</p>
              </div>
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{completedServices}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">KSh {(totalCost * 130).toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Service Trends
            </CardTitle>
            <CardDescription>Compare current month with previous month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">This Month Services</p>
                  <p className="text-2xl font-bold">{stats.thisMonthServices}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last Month</p>
                  <p className="text-lg font-medium">{stats.lastMonthServices}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">This Month Cost</p>
                  <p className="text-xl font-bold">KSh {(stats.thisMonthCost * 130).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  {stats.costTrend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <span className={`text-sm font-medium ${stats.costTrend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(stats.costTrend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Fleet Health Overview
            </CardTitle>
            <CardDescription>Average maintenance health across all trucks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {truckData.slice(0, 4).map((truck) => (
                <div key={truck.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{truck.truck_number}</span>
                    <Badge className={getHealthColor(truck.healthScore)}>
                      {truck.healthScore}% Health
                    </Badge>
                  </div>
                  <Progress value={truck.healthScore} className="w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Truck-wise Service Analysis */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Detailed Truck Service Analysis
          </CardTitle>
          <CardDescription>Complete maintenance status and cost analysis for each truck</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Truck</th>
                  <th className="text-left p-3">Health Score</th>
                  <th className="text-left p-3">Last Service</th>
                  <th className="text-left p-3">Total Cost</th>
                  <th className="text-left p-3">Services Count</th>
                  <th className="text-left p-3">Upcoming</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {truckData.map((truck) => (
                  <tr key={truck.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div>
                        <span className="font-medium">{truck.truck_number}</span>
                        <p className="text-sm text-muted-foreground">{truck.make} {truck.model}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Progress value={truck.healthScore} className="w-16" />
                        <span className={`text-sm font-medium ${
                          truck.healthScore >= 80 ? 'text-green-600' : 
                          truck.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {truck.healthScore}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {truck.lastServiceDate ? (
                        <div>
                          <span className="text-sm">{new Date(truck.lastServiceDate).toLocaleDateString()}</span>
                          <p className="text-xs text-muted-foreground">{truck.daysSinceLastService} days ago</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No service recorded</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-medium">KSh {(truck.totalMaintenanceCost * 130).toLocaleString()}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-center">{truck.servicesCount}</span>
                    </td>
                    <td className="p-3">
                      {truck.upcomingServices > 0 ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {truck.upcomingServices} pending
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      {truck.daysSinceLastService > 180 ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Overdue
                        </Badge>
                      ) : truck.daysSinceLastService > 90 ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Due Soon
                        </Badge>
                      ) : (
                        <Badge className="bg-green-50 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Good
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Service Records */}
      <Card className="border-2 border-blue-400/50">
        <CardHeader>
          <CardTitle>All Service Records</CardTitle>
          <CardDescription>Complete maintenance history and ongoing services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            <FilterExportBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onFilterApply={handleFilterApply}
              onExport={handleExport}
              filterOptions={{
                types: ['engine', 'brakes', 'transmission', 'electrical', 'suspension', 'tires', 'other']
              }}
            />
            
            <div className="flex gap-2">
              <select 
                className="px-3 py-2 border rounded-md"
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
              >
                <option value="">All Trucks</option>
                {trucks?.map((truck) => (
                  <option key={truck.id} value={truck.id}>
                    {truck.truck_number} - {truck.make} {truck.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="border-2 border-yellow-300/50 dark:border-yellow-600/50 rounded-lg p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{record.maintenance_type}</h3>
                      <Badge variant={
                        record.status === 'completed' ? 'default' :
                        record.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {record.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{record.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                      <div className="text-muted-foreground">
                        <span className="font-medium">Truck:</span> {record.trucks?.truck_number || 'N/A'}
                      </div>
                      <div className="text-muted-foreground">
                        <span className="font-medium">Service Date:</span> {new Date(record.service_date).toLocaleDateString()}
                      </div>
                      <div className="text-muted-foreground">
                        <span className="font-medium">Status:</span> {record.status}
                      </div>
                    </div>
                    {record.items_purchased && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-muted-foreground">Items Purchased:</span> {record.items_purchased}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cost</p>
                      <p className="font-medium text-foreground">KSh {(record.cost * 130).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Provider</p>
                      <p className="font-medium text-foreground">{record.service_provider || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Technician</p>
                      <p className="font-medium text-foreground">{record.technician || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Downtime</p>
                      <p className="font-medium text-foreground">{record.downtime_hours || 0}h</p>
                    </div>
                  </div>
                </div>
                
                {record.next_service_date && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Next Service: {new Date(record.next_service_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-yellow-400 text-foreground hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    onClick={() => setSelectedRecord(record)}
                  >
                    View Details
                  </Button>
                  {record.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => handleCompleteService(record.id)}
                      disabled={updateMaintenanceStatus.isPending}
                    >
                      Start Service
                    </Button>
                  )}
                  {record.status === 'in_progress' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-green-400 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={() => handleCompleteService(record.id)}
                      disabled={updateMaintenanceStatus.isPending}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete Service
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {(!allMaintenanceRecords || allMaintenanceRecords.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No maintenance records found. Schedule your first service to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddForm && (
        <AddMaintenanceRecord onClose={() => setShowAddForm(false)} />
      )}

      {selectedRecord && (
        <MaintenanceDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {showScheduleModal && (
        <ScheduleServiceModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleService}
        />
      )}
    </div>
  );
};

export default ServiceManagement;