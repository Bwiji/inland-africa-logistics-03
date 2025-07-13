import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTrucks, useTrips, useMaintenance, useFuelRecords } from "@/hooks/useSupabaseData";

interface ReportGeneratorProps {
  reportType: string;
  onClose: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ reportType, onClose }) => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [selectedTruck, setSelectedTruck] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: trucks } = useTrucks();
  const { data: trips } = useTrips();
  const { data: maintenance } = useMaintenance();
  const { data: fuelRecords } = useFuelRecords();
  const { toast } = useToast();

  const generateReport = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Missing Date Range",
        description: "Please select a date range for the report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      let reportData;
      switch (reportType) {
        case 'fleet':
          reportData = generateFleetReport();
          break;
        case 'fuel':
          reportData = generateFuelReport();
          break;
        case 'maintenance':
          reportData = generateMaintenanceReport();
          break;
        case 'compliance':
          reportData = generateComplianceReport();
          break;
        case 'financial':
          reportData = generateFinancialReport();
          break;
        case 'operational':
          reportData = generateOperationalReport();
          break;
        default:
          reportData = generateFleetReport();
      }

      generateDetailedReport(reportData, reportType);
      
      toast({
        title: "Report Generated Successfully",
        description: "Your detailed report is ready for viewing and printing.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Unable to generate the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const filterDataByDateAndTruck = (data: any[], dateField: string) => {
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      const matchesDate = itemDate >= dateRange.from! && itemDate <= dateRange.to!;
      const matchesTruck = selectedTruck === 'all' || item.truck_id === selectedTruck;
      return matchesDate && matchesTruck;
    });
  };

  const generateFleetReport = () => {
    const filteredTrips = filterDataByDateAndTruck(trips || [], 'created_at');
    const filteredMaintenance = filterDataByDateAndTruck(maintenance || [], 'service_date');
    const filteredFuel = filterDataByDateAndTruck(fuelRecords || [], 'fuel_date');

    const truckStats = (trucks || []).map(truck => {
      const truckTrips = filteredTrips.filter(t => t.truck_id === truck.id);
      const truckMaintenance = filteredMaintenance.filter(m => m.truck_id === truck.id);
      const truckFuel = filteredFuel.filter(f => f.truck_id === truck.id);

      const totalDistance = truckTrips.reduce((sum, t) => sum + (t.distance_km || 0), 0);
      const totalRevenue = truckTrips.reduce((sum, t) => sum + (t.cargo_value_usd * 130 || 0), 0);
      const totalMaintenanceCost = truckMaintenance.reduce((sum, m) => sum + (m.cost * 130 || 0), 0);
      const totalFuelCost = truckFuel.reduce((sum, f) => sum + (f.total_cost * 130 || 0), 0);
      const totalFuelConsumption = truckFuel.reduce((sum, f) => sum + (f.liters || 0), 0);

      const operatingCost = totalMaintenanceCost + totalFuelCost;
      const profitLoss = totalRevenue - operatingCost;
      const profitMargin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0;

      return {
        truck,
        totalDistance,
        totalRevenue,
        operatingCost,
        profitLoss,
        profitMargin,
        tripCount: truckTrips.length,
        fuelEfficiency: totalDistance > 0 && totalFuelConsumption > 0 ? totalDistance / totalFuelConsumption : 0
      };
    });

    return {
      type: 'Fleet Performance Report',
      period: `${dateRange.from!.toLocaleDateString()} - ${dateRange.to!.toLocaleDateString()}`,
      truckStats,
      summary: {
        totalTrucks: truckStats.length,
        totalRevenue: truckStats.reduce((sum, s) => sum + s.totalRevenue, 0),
        totalOperatingCost: truckStats.reduce((sum, s) => sum + s.operatingCost, 0),
        totalProfit: truckStats.reduce((sum, s) => sum + s.profitLoss, 0),
        averageProfitMargin: truckStats.reduce((sum, s) => sum + s.profitMargin, 0) / (truckStats.length || 1)
      }
    };
  };

  const generateFuelReport = () => {
    const filteredFuel = filterDataByDateAndTruck(fuelRecords || [], 'fuel_date');
    
    const truckFuelStats = (trucks || []).map(truck => {
      const truckFuel = filteredFuel.filter(f => f.truck_id === truck.id);
      const totalLiters = truckFuel.reduce((sum, f) => sum + f.liters, 0);
      const totalCost = truckFuel.reduce((sum, f) => sum + f.total_cost, 0);
      const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;
      const avgOdometer = truckFuel.length > 0 ? truckFuel.reduce((sum, f) => sum + (f.odometer_reading || 0), 0) / truckFuel.length : 0;
      const fuelEfficiency = totalLiters > 0 && avgOdometer > 0 ? avgOdometer / totalLiters : 0;
      
      return {
        truck,
        totalLiters,
        totalCost,
        avgCostPerLiter,
        fuelEfficiency,
        recordCount: truckFuel.length,
        lastRefill: truckFuel.length > 0 ? Math.max(...truckFuel.map(f => new Date(f.fuel_date).getTime())) : null
      };
    });

    return {
      type: 'Fuel Consumption Report',
      period: `${dateRange.from!.toLocaleDateString()} - ${dateRange.to!.toLocaleDateString()}`,
      truckFuelStats,
      summary: {
        totalLiters: truckFuelStats.reduce((sum, s) => sum + s.totalLiters, 0),
        totalCost: truckFuelStats.reduce((sum, s) => sum + s.totalCost, 0),
        avgCostPerLiter: truckFuelStats.reduce((sum, s) => sum + s.avgCostPerLiter, 0) / (truckFuelStats.length || 1),
        avgEfficiency: truckFuelStats.reduce((sum, s) => sum + s.fuelEfficiency, 0) / (truckFuelStats.length || 1)
      }
    };
  };

  const generateMaintenanceReport = () => {
    const filteredMaintenance = filterDataByDateAndTruck(maintenance || [], 'service_date');
    
    const truckMaintenanceStats = (trucks || []).map(truck => {
      const truckMaintenance = filteredMaintenance.filter(m => m.truck_id === truck.id);
      const totalCost = truckMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
      const completedServices = truckMaintenance.filter(m => m.status === 'completed').length;
      const upcomingServices = truckMaintenance.filter(m => m.status === 'scheduled').length;
      const avgCostPerService = truckMaintenance.length > 0 ? totalCost / truckMaintenance.length : 0;
      
      return {
        truck,
        totalCost,
        serviceCount: truckMaintenance.length,
        completedServices,
        upcomingServices,
        avgCostPerService,
        lastService: truckMaintenance.length > 0 ? Math.max(...truckMaintenance.map(m => new Date(m.service_date).getTime())) : null
      };
    });

    return {
      type: 'Maintenance Analysis Report',
      period: `${dateRange.from!.toLocaleDateString()} - ${dateRange.to!.toLocaleDateString()}`,
      truckMaintenanceStats,
      summary: {
        totalCost: truckMaintenanceStats.reduce((sum, s) => sum + s.totalCost, 0),
        totalServices: truckMaintenanceStats.reduce((sum, s) => sum + s.serviceCount, 0),
        avgCostPerService: truckMaintenanceStats.reduce((sum, s) => sum + s.avgCostPerService, 0) / (truckMaintenanceStats.length || 1),
        completionRate: truckMaintenanceStats.reduce((sum, s) => sum + s.completedServices, 0) / Math.max(1, truckMaintenanceStats.reduce((sum, s) => sum + s.serviceCount, 0)) * 100
      }
    };
  };

  const generateComplianceReport = () => {
    // Mock compliance data since it's not in the database yet
    const complianceData = (trucks || []).map(truck => {
      const ntsa = { status: Math.random() > 0.3 ? 'valid' : 'expired', expiry: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) };
      const insurance = { status: Math.random() > 0.2 ? 'valid' : 'expired', expiry: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) };
      const tgl = { status: Math.random() > 0.4 ? 'valid' : 'expired', expiry: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) };
      
      return {
        truck,
        ntsa,
        insurance,
        tgl,
        overallCompliance: [ntsa, insurance, tgl].filter(item => item.status === 'valid').length / 3 * 100
      };
    });

    return {
      type: 'Compliance Status Report',
      period: `${dateRange.from!.toLocaleDateString()} - ${dateRange.to!.toLocaleDateString()}`,
      complianceData,
      summary: {
        totalTrucks: complianceData.length,
        fullyCompliant: complianceData.filter(d => d.overallCompliance === 100).length,
        partiallyCompliant: complianceData.filter(d => d.overallCompliance > 0 && d.overallCompliance < 100).length,
        nonCompliant: complianceData.filter(d => d.overallCompliance === 0).length,
        avgCompliance: complianceData.reduce((sum, d) => sum + d.overallCompliance, 0) / (complianceData.length || 1)
      }
    };
  };

  const generateFinancialReport = () => {
    const filteredTrips = filterDataByDateAndTruck(trips || [], 'created_at');
    const filteredMaintenance = filterDataByDateAndTruck(maintenance || [], 'service_date');
    const filteredFuel = filterDataByDateAndTruck(fuelRecords || [], 'fuel_date');

    // Monthly breakdown
    const monthlyData = new Map();
    
    filteredTrips.forEach(trip => {
      const month = new Date(trip.created_at).toISOString().slice(0, 7);
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { revenue: 0, maintenanceCost: 0, fuelCost: 0, trips: 0 });
      }
      const data = monthlyData.get(month);
      data.revenue += trip.cargo_value_usd * 130 || 0;
      data.trips += 1;
    });

    filteredMaintenance.forEach(maintenance => {
      const month = new Date(maintenance.service_date).toISOString().slice(0, 7);
      if (monthlyData.has(month)) {
        monthlyData.get(month).maintenanceCost += maintenance.cost * 130 || 0;
      }
    });

    filteredFuel.forEach(fuel => {
      const month = new Date(fuel.fuel_date).toISOString().slice(0, 7);
      if (monthlyData.has(month)) {
        monthlyData.get(month).fuelCost += fuel.total_cost * 130 || 0;
      }
    });

    const monthlyBreakdown = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      ...data,
      totalCost: data.maintenanceCost + data.fuelCost,
      profit: data.revenue - (data.maintenanceCost + data.fuelCost),
      profitMargin: data.revenue > 0 ? ((data.revenue - (data.maintenanceCost + data.fuelCost)) / data.revenue) * 100 : 0
    }));

    return {
      type: 'Financial Analysis Report',
      period: `${dateRange.from!.toLocaleDateString()} - ${dateRange.to!.toLocaleDateString()}`,
      monthlyBreakdown,
      summary: {
        totalRevenue: monthlyBreakdown.reduce((sum, m) => sum + m.revenue, 0),
        totalCosts: monthlyBreakdown.reduce((sum, m) => sum + m.totalCost, 0),
        netProfit: monthlyBreakdown.reduce((sum, m) => sum + m.profit, 0),
        averageProfitMargin: monthlyBreakdown.reduce((sum, m) => sum + m.profitMargin, 0) / (monthlyBreakdown.length || 1)
      }
    };
  };

  const generateOperationalReport = () => {
    const filteredTrips = filterDataByDateAndTruck(trips || [], 'created_at');
    
    const routeAnalysis = new Map();
    filteredTrips.forEach(trip => {
      const route = `${trip.origin} → ${trip.destination}`;
      if (!routeAnalysis.has(route)) {
        routeAnalysis.set(route, { count: 0, totalDistance: 0, totalRevenue: 0, avgDelay: 0 });
      }
      const data = routeAnalysis.get(route);
      data.count += 1;
      data.totalDistance += trip.distance_km || 0;
      data.totalRevenue += trip.cargo_value_usd * 130 || 0;
      
      if (trip.planned_arrival && trip.actual_arrival) {
        const planned = new Date(trip.planned_arrival);
        const actual = new Date(trip.actual_arrival);
        const delay = Math.max(0, (actual.getTime() - planned.getTime()) / (1000 * 60 * 60)); // hours
        data.avgDelay = (data.avgDelay * (data.count - 1) + delay) / data.count;
      }
    });

    const topRoutes = Array.from(routeAnalysis.entries())
      .map(([route, data]) => ({
        route,
        ...data,
        avgRevenue: data.totalRevenue / data.count,
        revenuePerKm: data.totalDistance > 0 ? data.totalRevenue / data.totalDistance : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    return {
      type: 'Operational Performance Report',
      period: `${dateRange.from!.toLocaleDateString()} - ${dateRange.to!.toLocaleDateString()}`,
      topRoutes,
      summary: {
        totalTrips: filteredTrips.length,
        completedTrips: filteredTrips.filter(t => t.status === 'completed').length,
        onTimePercentage: filteredTrips.length > 0 ? 
          (filteredTrips.filter(t => {
            if (!t.planned_arrival || !t.actual_arrival) return false;
            return new Date(t.actual_arrival) <= new Date(t.planned_arrival);
          }).length / filteredTrips.length) * 100 : 0,
        avgTripDistance: filteredTrips.reduce((sum, t) => sum + (t.distance_km || 0), 0) / (filteredTrips.length || 1)
      }
    };
  };

  const generateDetailedReport = (data: any, type: string) => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    let specificContent = '';
    
    if (type === 'fleet') {
      specificContent = `
        <div class="summary">
          <h3>Fleet Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Revenue:</span>
              <span class="value ${data.summary.totalProfit >= 0 ? 'profit' : 'loss'}">KSh ${data.summary.totalRevenue.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Operating Costs:</span>
              <span class="value">KSh ${data.summary.totalOperatingCost.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Net Profit/Loss:</span>
              <span class="value ${data.summary.totalProfit >= 0 ? 'profit' : 'loss'}">KSh ${data.summary.totalProfit.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Avg Profit Margin:</span>
              <span class="value ${data.summary.averageProfitMargin >= 0 ? 'profit' : 'loss'}">${data.summary.averageProfitMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Truck</th>
              <th>Trips</th>
              <th>Distance (km)</th>
              <th>Revenue (KSh)</th>
              <th>Operating Cost (KSh)</th>
              <th>Profit/Loss (KSh)</th>
              <th>Profit Margin (%)</th>
              <th>Fuel Efficiency (km/L)</th>
            </tr>
          </thead>
          <tbody>
            ${data.truckStats.map((stat: any) => `
              <tr>
                <td>${stat.truck.truck_number}</td>
                <td>${stat.tripCount}</td>
                <td>${stat.totalDistance.toLocaleString()}</td>
                <td class="${stat.profitLoss >= 0 ? 'profit' : 'loss'}">${stat.totalRevenue.toLocaleString()}</td>
                <td>${stat.operatingCost.toLocaleString()}</td>
                <td class="${stat.profitLoss >= 0 ? 'profit' : 'loss'}">${stat.profitLoss.toLocaleString()}</td>
                <td class="${stat.profitMargin >= 0 ? 'profit' : 'loss'}">${stat.profitMargin.toFixed(1)}%</td>
                <td>${stat.fuelEfficiency.toFixed(1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'fuel') {
      specificContent = `
        <div class="summary">
          <h3>Fuel Consumption Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Fuel Consumed:</span>
              <span class="value">${data.summary.totalLiters.toFixed(0)}L</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Fuel Cost:</span>
              <span class="value">KSh ${data.summary.totalCost.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Avg Cost per Liter:</span>
              <span class="value">KSh ${data.summary.avgCostPerLiter.toFixed(2)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Fleet Avg Efficiency:</span>
              <span class="value">${data.summary.avgEfficiency.toFixed(1)} km/L</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Truck</th>
              <th>Total Liters</th>
              <th>Total Cost (KSh)</th>
              <th>Avg Cost/L (KSh)</th>
              <th>Efficiency (km/L)</th>
              <th>Refuel Count</th>
              <th>Last Refill</th>
            </tr>
          </thead>
          <tbody>
            ${data.truckFuelStats.map((stat: any) => `
              <tr>
                <td>${stat.truck.truck_number}</td>
                <td>${stat.totalLiters.toFixed(0)}</td>
                <td>${stat.totalCost.toLocaleString()}</td>
                <td>${stat.avgCostPerLiter.toFixed(2)}</td>
                <td>${stat.fuelEfficiency.toFixed(1)}</td>
                <td>${stat.recordCount}</td>
                <td>${stat.lastRefill ? new Date(stat.lastRefill).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'maintenance') {
      specificContent = `
        <div class="summary">
          <h3>Maintenance Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Maintenance Cost:</span>
              <span class="value">KSh ${data.summary.totalCost.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Services:</span>
              <span class="value">${data.summary.totalServices}</span>
            </div>
            <div class="summary-item">
              <span class="label">Avg Cost per Service:</span>
              <span class="value">KSh ${data.summary.avgCostPerService.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Completion Rate:</span>
              <span class="value ${data.summary.completionRate >= 80 ? 'profit' : 'loss'}">${data.summary.completionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Truck</th>
              <th>Total Cost (KSh)</th>
              <th>Services</th>
              <th>Completed</th>
              <th>Upcoming</th>
              <th>Avg Cost/Service (KSh)</th>
              <th>Last Service</th>
            </tr>
          </thead>
          <tbody>
            ${data.truckMaintenanceStats.map((stat: any) => `
              <tr>
                <td>${stat.truck.truck_number}</td>
                <td>${stat.totalCost.toLocaleString()}</td>
                <td>${stat.serviceCount}</td>
                <td class="profit">${stat.completedServices}</td>
                <td>${stat.upcomingServices}</td>
                <td>${stat.avgCostPerService.toLocaleString()}</td>
                <td>${stat.lastService ? new Date(stat.lastService).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'compliance') {
      specificContent = `
        <div class="summary">
          <h3>Compliance Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Trucks:</span>
              <span class="value">${data.summary.totalTrucks}</span>
            </div>
            <div class="summary-item">
              <span class="label">Fully Compliant:</span>
              <span class="value profit">${data.summary.fullyCompliant}</span>
            </div>
            <div class="summary-item">
              <span class="label">Partially Compliant:</span>
              <span class="value">${data.summary.partiallyCompliant}</span>
            </div>
            <div class="summary-item">
              <span class="label">Avg Compliance:</span>
              <span class="value ${data.summary.avgCompliance >= 80 ? 'profit' : 'loss'}">${data.summary.avgCompliance.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Truck</th>
              <th>NTSA Status</th>
              <th>NTSA Expiry</th>
              <th>Insurance Status</th>
              <th>Insurance Expiry</th>
              <th>TGL Status</th>
              <th>TGL Expiry</th>
              <th>Overall Compliance</th>
            </tr>
          </thead>
          <tbody>
            ${data.complianceData.map((item: any) => `
              <tr>
                <td>${item.truck.truck_number}</td>
                <td class="${item.ntsa.status === 'valid' ? 'profit' : 'loss'}">${item.ntsa.status.toUpperCase()}</td>
                <td>${item.ntsa.expiry.toLocaleDateString()}</td>
                <td class="${item.insurance.status === 'valid' ? 'profit' : 'loss'}">${item.insurance.status.toUpperCase()}</td>
                <td>${item.insurance.expiry.toLocaleDateString()}</td>
                <td class="${item.tgl.status === 'valid' ? 'profit' : 'loss'}">${item.tgl.status.toUpperCase()}</td>
                <td>${item.tgl.expiry.toLocaleDateString()}</td>
                <td class="${item.overallCompliance >= 80 ? 'profit' : 'loss'}">${item.overallCompliance.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'financial') {
      specificContent = `
        <div class="summary">
          <h3>Financial Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Revenue:</span>
              <span class="value profit">KSh ${data.summary.totalRevenue.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Costs:</span>
              <span class="value">KSh ${data.summary.totalCosts.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Net Profit:</span>
              <span class="value ${data.summary.netProfit >= 0 ? 'profit' : 'loss'}">KSh ${data.summary.netProfit.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span class="label">Avg Profit Margin:</span>
              <span class="value ${data.summary.averageProfitMargin >= 0 ? 'profit' : 'loss'}">${data.summary.averageProfitMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Trips</th>
              <th>Revenue (KSh)</th>
              <th>Fuel Cost (KSh)</th>
              <th>Maintenance Cost (KSh)</th>
              <th>Total Cost (KSh)</th>
              <th>Profit/Loss (KSh)</th>
              <th>Profit Margin (%)</th>
            </tr>
          </thead>
          <tbody>
            ${data.monthlyBreakdown.map((month: any) => `
              <tr>
                <td>${month.month}</td>
                <td>${month.trips}</td>
                <td class="profit">${month.revenue.toLocaleString()}</td>
                <td>${month.fuelCost.toLocaleString()}</td>
                <td>${month.maintenanceCost.toLocaleString()}</td>
                <td>${month.totalCost.toLocaleString()}</td>
                <td class="${month.profit >= 0 ? 'profit' : 'loss'}">${month.profit.toLocaleString()}</td>
                <td class="${month.profitMargin >= 0 ? 'profit' : 'loss'}">${month.profitMargin.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (type === 'operational') {
      specificContent = `
        <div class="summary">
          <h3>Operational Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Trips:</span>
              <span class="value">${data.summary.totalTrips}</span>
            </div>
            <div class="summary-item">
              <span class="label">Completed Trips:</span>
              <span class="value profit">${data.summary.completedTrips}</span>
            </div>
            <div class="summary-item">
              <span class="label">On-Time Performance:</span>
              <span class="value ${data.summary.onTimePercentage >= 80 ? 'profit' : 'loss'}">${data.summary.onTimePercentage.toFixed(1)}%</span>
            </div>
            <div class="summary-item">
              <span class="label">Avg Trip Distance:</span>
              <span class="value">${data.summary.avgTripDistance.toFixed(0)} km</span>
            </div>
          </div>
        </div>

        <h3>Top Performing Routes</h3>
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Trips</th>
              <th>Total Distance (km)</th>
              <th>Total Revenue (KSh)</th>
              <th>Avg Revenue (KSh)</th>
              <th>Revenue/km (KSh)</th>
              <th>Avg Delay (hrs)</th>
            </tr>
          </thead>
          <tbody>
            ${data.topRoutes.map((route: any) => `
              <tr>
                <td>${route.route}</td>
                <td>${route.count}</td>
                <td>${route.totalDistance.toLocaleString()}</td>
                <td class="profit">${route.totalRevenue.toLocaleString()}</td>
                <td>${route.avgRevenue.toLocaleString()}</td>
                <td>${route.revenuePerKm.toFixed(0)}</td>
                <td class="${route.avgDelay <= 2 ? 'profit' : 'loss'}">${route.avgDelay.toFixed(1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.type}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #007bff; padding-bottom: 20px; }
            .summary { background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 5px solid #007bff; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
            .summary-item { background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .label { font-weight: bold; color: #555; display: block; }
            .value { font-size: 1.2em; font-weight: bold; }
            .profit { color: #28a745; }
            .loss { color: #dc3545; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            th, td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
            th { background: linear-gradient(135deg, #007bff, #0056b3); color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            tr:hover { background-color: #e3f2fd; }
            h3 { color: #007bff; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; }
            @media print { 
              .no-print { display: none; }
              body { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚛 Approved Logistics Limited</h1>
            <h2>${data.type}</h2>
            <p><strong>Report Period:</strong> ${data.period}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            ${selectedTruck !== 'all' ? `<p><strong>Truck:</strong> ${trucks?.find(t => t.id === selectedTruck)?.truck_number || 'N/A'}</p>` : ''}
          </div>
          
          ${specificContent}

          <button class="no-print" onclick="window.print()" style="margin: 20px auto; display: block; padding: 15px 30px; background: linear-gradient(135deg, #007bff, #0056b3); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">🖨️ Print Report</button>
        </body>
      </html>
    `;

    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Generate {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
        </CardTitle>
        <CardDescription>Configure your detailed report parameters</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Truck Selection</label>
          <Select value={selectedTruck} onValueChange={setSelectedTruck}>
            <SelectTrigger>
              <SelectValue placeholder="Select truck or all trucks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trucks</SelectItem>
              {trucks?.map(truck => (
                <SelectItem key={truck.id} value={truck.id}>
                  {truck.truck_number} - {truck.make} {truck.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};