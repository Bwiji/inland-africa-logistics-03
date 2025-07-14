
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import FleetManagement from "./pages/FleetManagement";
import ServiceManagement from "./pages/ServiceManagement";
import FuelManagement from "./pages/FuelManagement";
import FuelAttendantPortal from "./pages/FuelAttendantPortal";
import ComplianceManagement from "./pages/ComplianceManagement";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import { Layout } from "@/components/Layout";
import { FuelAttendantRoute } from "@/components/FuelAttendantRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/fleet" element={
                <ProtectedRoute>
                  <FleetManagement />
                </ProtectedRoute>
              } />
              <Route path="/service" element={
                <ProtectedRoute>
                  <Layout>
                    <ServiceManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/fuel" element={
                <ProtectedRoute>
                  <Layout>
                    <FuelManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/fuel-attendant" element={
                <FuelAttendantRoute>
                  <FuelAttendantPortal />
                </FuelAttendantRoute>
              } />
              <Route path="/compliance" element={
                <ProtectedRoute>
                  <Layout>
                    <ComplianceManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
