import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  UtensilsCrossed,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  ChefHat,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: ClipboardList, label: "Orders", path: "/admin/dashboard/orders" },
  { icon: UtensilsCrossed, label: "Menu", path: "/admin/dashboard/menu" },
  { icon: Package, label: "Inventory", path: "/admin/dashboard/inventory" },
  { icon: Users, label: "Users", path: "/admin/dashboard/users" },
  { icon: FileBarChart, label: "Reports", path: "/admin/dashboard/reports" },
  { icon: Settings, label: "Settings", path: "/admin/dashboard/settings" },
];

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("flex h-full flex-col gradient-espresso text-sidebar-foreground", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden border border-white/20">
          <img src="/logos/logo2brown.jpeg" alt="Ama Bakery" className="h-full w-full object-cover" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Ama Bakery</h1>
          <p className="text-xs text-sidebar-foreground/70">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.path === "/admin/dashboard"
            ? location.pathname === item.path || location.pathname === item.path + "/"
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </NavLink>
      </div>
    </div>
  );
}
