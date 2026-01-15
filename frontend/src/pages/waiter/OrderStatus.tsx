import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav";
import { sampleOrders, Order } from "@/lib/mockData";
import { Clock, ChefHat, Bell, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function OrderStatus() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(sampleOrders.filter(o => o.status !== 'completed'));


  const pendingOrders = orders.filter(o => ['new', 'preparing'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="My Orders" showBack notificationCount={readyOrders.length} />

      <main className="p-4 space-y-6">
        {/* Ready Orders Alert */}
        {readyOrders.length > 0 && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 animate-pulse-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center">
                <Bell className="h-5 w-5 text-success-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-success">Orders Ready!</h3>
                <p className="text-sm text-muted-foreground">
                  {readyOrders.length} order(s) ready for pickup
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ready Orders */}
        {readyOrders.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-success flex items-center justify-center text-success-foreground text-sm">
                {readyOrders.length}
              </span>
              Ready for Pickup
            </h2>
            <div className="space-y-3">
              {readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                />
              ))}
            </div>
          </section>
        )}

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Pending Kitchen</h2>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ChefHat className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No active orders</h3>
            <p className="text-sm">Orders you send will appear here</p>
            <Button
              className="mt-4"
              onClick={() => navigate('/waiter/tables')}
            >
              Take New Order
            </Button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <WaiterBottomNav />
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className={cn(
      "card-elevated overflow-hidden",
      order.status === 'ready' && "ring-2 ring-success/50"
    )}>
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        order.status === 'new' && "bg-blue-50/50",
        order.status === 'ready' && "bg-success/10"
      )}>
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">Table {order.tableNumber}</span>
          <span className="text-[10px] bg-secondary/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {order.groupName || 'Group A'}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="p-4">
        <div className="space-y-1 mb-3">
          {order.items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}× {item.menuItem.name}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{order.items.length - 3} more items
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            {formatDistanceToNow(order.createdAt, { addSuffix: true })}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary mr-2">₹{order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
