
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Clock, Settings, CheckCircle, DollarSign } from "lucide-react";

interface ServiceMetricsProps {
  totalServices: number;
  pendingServices: number;
  inProgressServices: number;
  completedServices: number;
  totalCost: number;
}

export const ServiceMetrics = ({
  totalServices,
  pendingServices,
  inProgressServices,
  completedServices,
  totalCost
}: ServiceMetricsProps) => {
  return (
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
  );
};
