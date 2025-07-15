
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Fuel, Lock } from "lucide-react";

interface FuelAttendantRouteProps {
  children: ReactNode;
}

export const FuelAttendantRoute = ({ children }: FuelAttendantRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="p-8 backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse">
              <Fuel className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has fuel attendant role from their metadata
  const userRole = user.user_metadata?.role;
  const isFuelAttendant = userRole === 'fuel_attendant';

  if (!isFuelAttendant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="p-8 backdrop-blur-sm bg-white/95 border-0 shadow-2xl max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 text-center">
            <div className="p-3 bg-gradient-to-r from-red-400 to-orange-500 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Access Restricted</h2>
            <p className="text-gray-600">
              This portal is only accessible to authorized fuel attendants. 
              Please contact your administrator for proper credentials.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Main System
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
