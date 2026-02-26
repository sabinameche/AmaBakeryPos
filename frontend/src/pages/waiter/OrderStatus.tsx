import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav";
import { ChefHat, Bell, Loader2, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchInvoices } from "@/api/index.js";
import { getCurrentUser } from "@/auth/auth";

type Tab = "mine" | "all";

export default function OrderStatus() {
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("mine");
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      setAllOrders(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // "Your Orders" — only this waiter's orders
  const myOrders = allOrders.filter(
    (o) => String(o.created_by) === String(currentUser?.id)
  );

  // Orders to display based on tab
  const displayOrders = activeTab === "mine" ? myOrders : allOrders;

  const readyOrders = displayOrders.filter(
    (o) => o?.invoice_status === "READY"
  );
  const pendingOrders = displayOrders.filter(
    (o) => o?.invoice_status === "PENDING"
  );
  const doneOrders = displayOrders.filter(
    (o) => o?.invoice_status === "COMPLETED" || o?.invoice_status === "CANCELLED"
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Orders" showBack={false} />

      <main className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setActiveTab("mine")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === "mine"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" />
            Your Orders
            {myOrders.length > 0 && (
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                activeTab === "mine" ? "bg-primary text-white" : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {myOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === "all"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            All Orders
            {allOrders.length > 0 && (
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                activeTab === "all" ? "bg-primary text-white" : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {allOrders.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
            <p className="text-muted-foreground animate-pulse text-sm">Loading orders...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ready Alert Banner */}
            {readyOrders.length > 0 && (
              <div className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-success-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-success text-sm">Orders Ready!</h3>
                  <p className="text-xs text-muted-foreground">
                    {readyOrders.length} order(s) ready for pickup
                  </p>
                </div>
              </div>
            )}

            {/* Ready Orders */}
            {readyOrders.length > 0 && (
              <section>
                <h2 className="text-xs font-bold mb-2 text-success uppercase tracking-widest flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-success inline-flex items-center justify-center text-white text-[9px] font-black">
                    {readyOrders.length}
                  </span>
                  Ready for Pickup
                </h2>
                <div className="space-y-3">
                  {readyOrders.map((order) => (
                    <OrderCard key={order.id} order={order} showWaiter={activeTab === "all"} />
                  ))}
                </div>
              </section>
            )}

            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <section>
                <h2 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-widest">
                  Pending Kitchen
                </h2>
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} showWaiter={activeTab === "all"} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed / Paid Orders */}
            {doneOrders.length > 0 && (
              <section>
                <h2 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-widest">
                  Completed
                </h2>
                <div className="space-y-3">
                  {doneOrders.map((order) => (
                    <OrderCard key={order.id} order={order} showWaiter={activeTab === "all"} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {!loading && displayOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ChefHat className="h-14 w-14 mb-4 opacity-30" />
                <h3 className="text-base font-semibold">No orders yet</h3>
                <p className="text-sm mb-4">
                  {activeTab === "mine" ? "Orders you place will appear here" : "No orders in the branch today"}
                </p>
                {activeTab === "mine" && (
                  <Button onClick={() => navigate("/waiter/tables")} size="sm">
                    Take New Order
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <WaiterBottomNav />
    </div>
  );
}

function OrderCard({ order, showWaiter = false }: { order: any; showWaiter?: boolean }) {
  const isReady = order.invoice_status === "READY";
  const isPaid = order.payment_status === "PAID" || order.invoice_status === "COMPLETED";



  return (
    <div
      className={cn(
        "card-elevated overflow-hidden transition-all",
        isReady && "ring-2 ring-success/50 shadow-lg shadow-success/10",
        isPaid && "opacity-75"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-2.5 flex items-center justify-between border-b border-slate-100",
        isReady && "bg-success/5",
        isPaid && "bg-slate-50"
      )}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[15px]">
            Order #{order?.invoice_number ? String(order.invoice_number).slice(-4) : "????"}
          </span>
          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-slate-500">
            {order?.description || order?.invoice_type || "Dine-in"}
          </span>
        </div>
        <StatusBadge status={(order?.invoice_status || "PENDING").toLowerCase()} />
      </div>

      {/* Body */}
      <div className="px-4 py-2.5">
        {/* Items */}
        <div className="space-y-1 mb-2.5">
          {(order?.items || []).length === 0 && (
            <p className="text-xs text-muted-foreground italic">No items</p>
          )}
          {(order?.items || []).slice(0, 4).map((item: any, idx: number) => {
            const name = item?.product_name || item?.product?.name || item?.name || `Product #${item?.product || "?"}`;
            const qty = item?.quantity ?? 1;
            const price = item?.unit_price ?? item?.price ?? (item?.product?.selling_price) ?? null;
            return (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-slate-700 font-medium leading-tight">
                  <span className="text-slate-400 mr-1">{qty}×</span>{name}
                </span>
                {price != null && (
                  <span className="text-slate-500 text-xs tabular-nums">
                    Rs.{(Number(price) * qty).toFixed(0)}
                  </span>
                )}
              </div>
            );
          })}
          {(order?.items?.length || 0) > 4 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              +{(order.items.length) - 4} more items
            </p>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-100">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Active Order</span>
            {showWaiter && order?.created_by_name && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-500">{order.created_by_name}</span>
              </>
            )}
          </div>
          <span className={cn(
            "font-bold text-sm tabular-nums",
            isPaid ? "text-success" : "text-primary"
          )}>
            Rs.{Number(order?.total_amount || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
