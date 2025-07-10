import { Home, Truck, Calendar, Settings, Users, BarChart3, Shield } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Fleet Management",
    url: "/fleet",
    icon: Truck,
  },
  {
    title: "Fuel Management", 
    url: "/fuel",
    icon: Users,
  },
  {
    title: "Service Management",
    url: "/service",
    icon: Calendar,
  },
  {
    title: "Compliance Management",
    url: "/compliance",
    icon: Shield,
  },
  {
    title: "Reports",
    url: "/reports", 
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="logistics-gradient">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-logistics-accent rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-logistics-primary" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Approved Logistics Limited</h2>
            <p className="text-logistics-light text-sm">Logistics System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-logistics-light font-semibold uppercase tracking-wider">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`nav-item ${
                      location.pathname === item.url 
                        ? 'nav-item-active' 
                        : 'nav-item-inactive'
                    }`}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
