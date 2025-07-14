
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, AlertTriangle, CheckCircle } from "lucide-react";

interface TruckAnalysisTableProps {
  truckData: any[];
}

export const TruckAnalysisTable = ({ truckData }: TruckAnalysisTableProps) => {
  return (
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
  );
};
