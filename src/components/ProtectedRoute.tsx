
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="p-8 backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse">
              <Truck className="w-8 h-8 text-white" />
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

  // Check if user is fuel attendant and redirect to fuel portal
  const userRole = user.user_metadata?.role;
  if (userRole === 'fuel_attendant') {
    return <Navigate to="/fuel-attendant" replace />;
  }

  return <>{children}</>;
};
