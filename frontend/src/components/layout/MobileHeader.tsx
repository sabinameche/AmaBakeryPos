import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  showNotification?: boolean;
  notificationCount?: number;
}

export function MobileHeader({ title, showBack = false, showNotification = true, notificationCount = 0 }: MobileHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white p-0.5 shadow-sm border border-slate-100 shrink-0 overflow-hidden">
              <img src="/logos/logo1white.jfif" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showNotification && (
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {notificationCount}
                </span>
              )}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl border-none p-2 animate-in fade-in zoom-in-95 duration-200">
              <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground p-3">Waiter Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors active:scale-95">
                <Settings className="h-4 w-4 text-slate-500" />
                <span className="font-semibold">Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors active:scale-95">
                <HelpCircle className="h-4 w-4 text-slate-500" />
                <span className="font-semibold">Help Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive active:scale-95 transition-all"
                onClick={() => {
                  toast.success("Successfully logged out");
                  navigate('/'); // Navigate to role selection or login
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="font-bold">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
