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
  User as UserIcon,
  Settings,
  HelpCircle
} from "lucide-react";
import { getCurrentUser } from "@/auth/auth";
import { ChangePasswordModal } from "../auth/ChangePasswordModal";
import { useState } from "react";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
}

export function MobileHeader({ title, showBack = false }: MobileHeaderProps) {
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Get current user and branch
  const user = getCurrentUser();
  const userName = user?.username || "Staff";
  const userRole = user?.role || "Staff";
  const branchName = user?.branch_name || "Ama Bakery";

  return (
    <header className="sticky top-0 z-50 glass-panel border-b px-4 pr-14 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10 text-slate-500 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white p-1.5 shadow-md border-2 border-primary/20 shrink-0 overflow-hidden flex items-center justify-center">
              <img src="/logos/logo1white.jfif" alt="AMA BAKERY" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-base lg:text-lg font-rockwell font-black text-slate-800 tracking-tight leading-none">AMA BAKERY</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
        </div>
      </div>
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </header>
  );
}
