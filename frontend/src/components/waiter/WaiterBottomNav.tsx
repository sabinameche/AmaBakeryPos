import { useNavigate, useLocation } from "react-router-dom";
import { Home, ClipboardList, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function WaiterBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            icon: Home,
            label: "Tables",
            path: "/waiter/tables",
            active: location.pathname === "/waiter/tables"
        },
        {
            icon: ClipboardList,
            label: "Orders",
            path: "/waiter/orders",
            active: location.pathname === "/waiter/orders"
        },
        {
            icon: Wallet,
            label: "Payments",
            path: "/waiter/payment",
            active: location.pathname === "/waiter/payment"
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
            <div className="flex items-center justify-around max-w-2xl mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex-1 flex flex-col items-center gap-1 py-3 transition-all",
                                item.active
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn(
                                "h-6 w-6",
                                item.active && "scale-110"
                            )} />
                            <span className={cn(
                                "text-xs font-medium",
                                item.active && "font-bold"
                            )}>
                                {item.label}
                            </span>
                            {item.active && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
