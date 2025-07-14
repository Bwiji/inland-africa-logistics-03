
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Loader2 } from "lucide-react";
import { useOngoingMaintenance, useCreateMaintenance, useUpdateMaintenanceStatus, useTrucks, useMaintenanceHistory } from "@/hooks/useSupabaseData";
import { AddMaintenanceRecord } from "@/components/forms/AddMaintenanceRecord";
import { MaintenanceDetailsModal } from "@/components/MaintenanceDetailsModal";
import { ScheduleServiceModal } from "@/components/ScheduleServiceModal";
import { useToast } from "@/hooks/use-toast";
import { ServiceMetrics } from "@/components/ServiceMetrics";
import { ServiceTrends } from "@/components/ServiceTrends";
import { TruckAnalysisTable } from "@/components/TruckAnalysisTable";
import { ServiceRecordsList } from "@/components/ServiceRecordsList";

const ServiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<string>("");
  const [displayedRecordsCount, setDisplayedRecordsCount] = useState(5);
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

  const handleLoadMore = () => {
    setDisplayedRecordsCount(prev => prev + 5);
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
      <ServiceMetrics
        totalServices={totalServices}
        pendingServices={pendingServices}
        inProgressServices={inProgressServices}
        completedServices={completedServices}
        totalCost={totalCost}
      />

      {/* Monthly Trends */}
      <ServiceTrends stats={stats} truckData={truckData} />

      {/* Truck-wise Service Analysis */}
      <TruckAnalysisTable truckData={truckData} />

      {/* Service Records */}
      <ServiceRecordsList
        filteredRecords={filteredRecords}
        allMaintenanceRecords={allMaintenanceRecords}
        trucks={trucks}
        searchTerm={searchTerm}
        selectedTruck={selectedTruck}
        displayedRecordsCount={displayedRecordsCount}
        onSearchChange={setSearchTerm}
        onFilterApply={handleFilterApply}
        onExport={handleExport}
        onTruckSelect={setSelectedTruck}
        onLoadMore={handleLoadMore}
        onViewDetails={setSelectedRecord}
        onCompleteService={handleCompleteService}
        updateMaintenanceStatus={updateMaintenanceStatus}
      />

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