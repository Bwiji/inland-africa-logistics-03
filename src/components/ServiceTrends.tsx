
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Truck, TrendingUp, TrendingDown } from "lucide-react";

interface ServiceTrendsProps {
  stats: {
    thisMonthServices: number;
    thisMonthCost: number;
    lastMonthServices: number;
    lastMonthCost: number;
    costTrend: number;
  };
  truckData: any[];
}

export const ServiceTrends = ({ stats, truckData }: ServiceTrendsProps) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
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
  );
};
