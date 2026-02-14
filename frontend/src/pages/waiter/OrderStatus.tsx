import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav";
import { Clock, ChefHat, Bell, CheckCircle2, Loader2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchInvoices } from "@/api/index.js";

export default function OrderStatus() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      // Filter for current branch/waiter if needed, but for now showing all active
      setOrders(data.filter((o: any) => o.payment_status !== 'PAID'));
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const pendingOrders = (orders || []).filter(o => o?.payment_status === 'PENDING' || o?.invoice_status === 'PENDING');
  // Backend might use invoice_status or payment_status, being flexible
  const readyOrders = (orders || []).filter(o => o?.invoice_status === 'READY' || o?.payment_status === 'PARTIAL');

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
        {!loading && orders.length === 0 && (
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

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
            <p className="text-muted-foreground animate-pulse">Checking kitchen status...</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <WaiterBottomNav />
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  const isReady = order.payment_status === 'PARTIAL';

  return (
    <div className={cn(
      "card-elevated overflow-hidden transition-all",
      isReady && "ring-2 ring-success/50 shadow-lg shadow-success/10"
    )}>
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        order.payment_status === 'PENDING' && "bg-blue-50/50",
        isReady && "bg-success/10"
      )}>
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">Order #{order?.invoice_number ? order.invoice_number.slice(-4) : '????'}</span>
          <span className="text-[10px] bg-secondary/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {order?.invoice_description || 'Dine-in'}
          </span>
        </div>
        <StatusBadge status={(order?.invoice_status || order?.payment_status || 'unknown').toLowerCase()} />
      </div>

      <div className="p-4">
        <div className="space-y-1 mb-3">
          {(order?.items || []).slice(0, 3).map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item?.quantity || 1}× {item?.product_name || `Product #${item?.product}`}</span>
            </div>
          ))}
          {(order?.items?.length || 0) > 3 && (
            <p className="text-xs text-muted-foreground">
              +{(order?.items?.length || 0) - 3} more items
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            {order?.order_date ? (
              formatDistanceToNow(parseISO(order.order_date), { addSuffix: true })
            ) : (
              'Just now'
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary mr-2">Rs.{order?.total_amount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
