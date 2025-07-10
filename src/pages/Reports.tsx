
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Eye, TrendingUp, DollarSign, Settings } from "lucide-react";
import { useState } from "react";
import { ReportGenerator } from "@/components/ReportGenerator";
import { CustomReportGenerator } from "@/components/CustomReportGenerator";

const Reports = () => {
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [showCustomReport, setShowCustomReport] = useState(false);

  const reportCategories = [
    {
      title: "Fleet Reports",
      description: "Vehicle performance, utilization, and maintenance reports",
      icon: FileText,
      reports: [
        {
          name: "Fleet Performance Summary",
          description: "Comprehensive fleet performance analysis with profitability insights",
          lastGenerated: "2024-06-28",
          size: "2.3 MB",
          type: "fleet"
        },
        {
          name: "Vehicle Utilization Report",
          description: "Individual truck performance and utilization metrics",
          lastGenerated: "2024-06-27",
          size: "1.8 MB",
          type: "fleet"
        },
        {
          name: "Maintenance Schedule Report",
          description: "Upcoming and completed maintenance with cost analysis",
          lastGenerated: "2024-06-26",
          size: "1.2 MB",
          type: "fleet"
        }
      ]
    },
    {
      title: "Fuel Analytics",
      description: "Fuel consumption, costs, and efficiency analysis",
      icon: DollarSign,
      reports: [
        {
          name: "Monthly Fuel Report",
          description: "Detailed fuel consumption and cost breakdown by truck",
          lastGenerated: "2024-06-28",
          size: "2.1 MB",
          type: "fuel"
        },
        {
          name: "Fuel Efficiency Report",
          description: "Truck-by-truck fuel efficiency trends and recommendations",
          lastGenerated: "2024-06-25",
          size: "1.7 MB",
          type: "fuel"
        },
        {
          name: "Reserve Tank Report",
          description: "Reserve tank usage patterns and refill schedules",
          lastGenerated: "2024-06-24",
          size: "1.2 MB",
          type: "fuel"
        }
      ]
    },
    {
      title: "Maintenance Analytics",
      description: "Maintenance costs, schedules, and compliance tracking",
      icon: TrendingUp,
      reports: [
        {
          name: "Maintenance Cost Report",
          description: "Monthly maintenance expenses breakdown by category",
          lastGenerated: "2024-06-28",
          size: "2.5 MB",
          type: "maintenance"
        },
        {
          name: "Compliance Report",
          description: "NTSA, Insurance, and TGL license status and renewals",
          lastGenerated: "2024-06-27",
          size: "1.6 MB",
          type: "compliance"
        },
        {
          name: "Preventive Maintenance Report",
          description: "Upcoming maintenance schedules and cost projections",
          lastGenerated: "2024-06-26",
          size: "1.8 MB",
          type: "maintenance"
        }
      ]
    }
  ];

  const handleGenerateReport = (reportType: string) => {
    setSelectedReportType(reportType);
  };

  const handleViewReport = (reportName: string) => {
    // For demo purposes, show a message
    alert(`Viewing ${reportName} - This would open the latest generated report`);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">Generate comprehensive reports with detailed insights and trends</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
            onClick={() => setShowCustomReport(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Custom Report
          </Button>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {reportCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="border-2 border-blue-400/50 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="w-5 h-5" />
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.reports.map((report, reportIndex) => (
                      <div key={reportIndex} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{report.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span>Last: {report.lastGenerated}</span>
                          <span>{report.size}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={() => handleGenerateReport(report.type)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Generate
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={() => handleViewReport(report.name)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="border-2 border-green-400/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Generate reports for common time periods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col items-center gap-2 h-20"
                onClick={() => handleGenerateReport('fuel')}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-sm">Fuel Analysis</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col items-center gap-2 h-20"
                onClick={() => handleGenerateReport('fleet')}
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm">Fleet Summary</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col items-center gap-2 h-20"
                onClick={() => handleGenerateReport('maintenance')}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Maintenance Report</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col items-center gap-2 h-20"
                onClick={() => setShowCustomReport(true)}
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm">Custom Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Insights */}
        <Card className="border-2 border-purple-400/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Business Intelligence
            </CardTitle>
            <CardDescription>Key insights from your latest reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Fuel Cost Savings</span>
                </div>
                <p className="text-lg font-bold text-green-600">+8.5%</p>
                <p className="text-xs text-muted-foreground">efficiency gains</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Fleet Compliance</span>
                </div>
                <p className="text-lg font-bold text-blue-600">94.2%</p>
                <p className="text-xs text-muted-foreground">active licenses</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Fuel Efficiency</span>
                </div>
                <p className="text-lg font-bold text-orange-600">8.2 km/L</p>
                <p className="text-xs text-muted-foreground">fleet average</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Maintenance Savings</span>
                </div>
                <p className="text-lg font-bold text-purple-600">-12.3%</p>
                <p className="text-xs text-muted-foreground">cost reduction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        {selectedReportType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <ReportGenerator 
              reportType={selectedReportType}
              onClose={() => setSelectedReportType(null)}
            />
          </div>
        )}

        {showCustomReport && (
          <CustomReportGenerator onClose={() => setShowCustomReport(false)} />
        )}
      </div>
    </Layout>
  );
};

export default Reports;
