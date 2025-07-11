import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Truck = Database["public"]["Tables"]["trucks"]["Row"];
type TruckInsert = Database["public"]["Tables"]["trucks"]["Insert"];
type Trip = Database["public"]["Tables"]["trips"]["Row"];
type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
type Driver = Database["public"]["Tables"]["drivers"]["Row"];
type DriverInsert = Database["public"]["Tables"]["drivers"]["Insert"];
type Maintenance = Database["public"]["Tables"]["maintenance"]["Row"];
type MaintenanceInsert = Database["public"]["Tables"]["maintenance"]["Insert"];
type FuelRecord = Database["public"]["Tables"]["fuel_records"]["Row"];
type FuelRecordInsert = Database["public"]["Tables"]["fuel_records"]["Insert"];

export const useTrucks = () => {
  return useQuery<Truck[], Error>({
    queryKey: ["trucks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trucks").select("*");
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateTruck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTruck: TruckInsert) => {
      const { data, error } = await supabase
        .from("trucks")
        .insert(newTruck)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
    },
  });
};

export const useUpdateTruckStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("trucks")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
    },
  });
};


export const useTruckStatistics = (truckId: string) => {
  return useQuery({
    queryKey: ["truck-statistics", truckId],
    queryFn: async () => {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Get maintenance records for current month
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from("maintenance")
        .select("cost, service_date")
        .eq("truck_id", truckId)
        .gte("service_date", startOfMonth.toISOString().split('T')[0])
        .lte("service_date", endOfMonth.toISOString().split('T')[0]);

      if (maintenanceError) throw maintenanceError;

      // Get fuel records for current month
      const { data: fuelData, error: fuelError } = await supabase
        .from("fuel_records")
        .select("total_cost, liters, fuel_date")
        .eq("truck_id", truckId)
        .gte("fuel_date", startOfMonth.toISOString())
        .lte("fuel_date", endOfMonth.toISOString());

      if (fuelError) throw fuelError;

      // Get trips for current month to calculate mileage
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select("distance_km, created_at")
        .eq("truck_id", truckId)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      if (tripsError) throw tripsError;

      const monthlyServiceCost = maintenanceData?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;
      const monthlyFuelCost = fuelData?.reduce((sum, record) => sum + (record.total_cost || 0), 0) || 0;
      const monthlyFuelConsumption = fuelData?.reduce((sum, record) => sum + (record.liters || 0), 0) || 0;
      const monthlyMileage = tripsData?.reduce((sum, trip) => sum + (trip.distance_km || 0), 0) || 0;

      return {
        monthlyServiceCost: Math.round(monthlyServiceCost * 130), // Convert to KSh
        monthlyFuelCost: Math.round(monthlyFuelCost * 130), // Convert to KSh
        monthlyFuelConsumption: Math.round(monthlyFuelConsumption),
        monthlyMileage: Math.round(monthlyMileage)
      };
    },
  });
};

export const useTrips = () => {
  return useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          trucks(truck_number, make, model),
          drivers(full_name)
        `);
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateTrip = () => {
  return useMutation({
    mutationFn: async (newTrip: TripInsert) => {
      const { data, error } = await supabase
        .from("trips")
        .insert(newTrip)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateTripStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      // Set actual departure time when starting a trip
      if (status === 'in_progress') {
        updateData.actual_departure = new Date().toISOString();
      }
      
      // Set actual arrival time when completing a trip
      if (status === 'completed') {
        updateData.actual_arrival = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("trips")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useDrivers = () => {
  return useQuery<Driver[], Error>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*");
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateDriver = () => {
  return useMutation({
    mutationFn: async (newDriver: DriverInsert) => {
      const { data, error } = await supabase
        .from("drivers")
        .insert(newDriver)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
};

export const useMaintenance = () => {
  return useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
          *,
          trucks(truck_number, make, model)
        `);
      if (error) throw error;
      return data;
    },
  });
};

export const useOngoingMaintenance = () => {
  return useQuery({
    queryKey: ["ongoing-maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
          *,
          trucks(truck_number, make, model)
        `)
        .not("status", "eq", "completed")
        .order("service_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newMaintenance: MaintenanceInsert) => {
      const { data, error } = await supabase
        .from("maintenance")
        .insert(newMaintenance)
        .select(`
          *,
          trucks(truck_number, make, model)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-maintenance"] });
    },
  });
};

export const useFuelRecords = () => {
  return useQuery({
    queryKey: ["fuel_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_records")
        .select(`
          *,
          trucks(truck_number, make, model)
        `)
        .order("fuel_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateFuelRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newFuelRecord: FuelRecordInsert) => {
      const { data, error } = await supabase
        .from("fuel_records")
        .insert(newFuelRecord)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel_records"] });
    },
  });
};

export const useMaintenanceHistory = () => {
  return useQuery({
    queryKey: ["maintenance-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
          *,
          trucks(truck_number, make, model)
        `)
        .eq("status", "completed")
        .order("service_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateMaintenanceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("maintenance")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-history"] });
    },
  });
};

