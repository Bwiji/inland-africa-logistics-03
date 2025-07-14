
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterExportBar } from "@/components/FilterExportBar";
import { Calendar, CheckCircle } from "lucide-react";

interface ServiceRecordsListProps {
  filteredRecords: any[];
  allMaintenanceRecords: any[];
  trucks: any[];
  searchTerm: string;
  selectedTruck: string;
  displayedRecordsCount: number;
  onSearchChange: (term: string) => void;
  onFilterApply: (filters: any) => void;
  onExport: (format: string) => void;
  onTruckSelect: (truckId: string) => void;
  onLoadMore: () => void;
  onViewDetails: (record: any) => void;
  onCompleteService: (recordId: string) => void;
  updateMaintenanceStatus: any;
}

export const ServiceRecordsList = ({
  filteredRecords,
  allMaintenanceRecords,
  trucks,
  searchTerm,
  selectedTruck,
  displayedRecordsCount,
  onSearchChange,
  onFilterApply,
  onExport,
  onTruckSelect,
  onLoadMore,
  onViewDetails,
  onCompleteService,
  updateMaintenanceStatus
}: ServiceRecordsListProps) => {
  return (
    <Card className="border-2 border-blue-400/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>All Service Records</CardTitle>
            <CardDescription>Complete maintenance history and ongoing services</CardDescription>
          </div>
          {filteredRecords.length > displayedRecordsCount && (
            <Button 
              variant="outline"
              onClick={onLoadMore}
              className="border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Load More
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          <FilterExportBar
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onFilterApply={onFilterApply}
            onExport={onExport}
            filterOptions={{
              types: ['engine', 'brakes', 'transmission', 'electrical', 'suspension', 'tires', 'other']
            }}
          />
          
          <div className="flex gap-2">
            <select 
              className="px-3 py-2 border rounded-md"
              value={selectedTruck}
              onChange={(e) => onTruckSelect(e.target.value)}
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
          {filteredRecords.slice(0, displayedRecordsCount).map((record) => (
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
                  onClick={() => onViewDetails(record)}
                >
                  View Details
                </Button>
                {record.status === 'pending' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => onCompleteService(record.id)}
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
                    onClick={() => onCompleteService(record.id)}
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

          {filteredRecords.length === 0 && allMaintenanceRecords && allMaintenanceRecords.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No records match your current filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
