import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OrderCard } from "@/components/kitchen/OrderCard";
import { branches, User } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ChefHat, LogOut, Bell, CheckCircle2, Clock, RotateCcw, MapPin, Utensils, Coffee, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { logout } from "../../auth/auth";
import { fetchInvoices, fetchProducts, fetchCategories, updateInvoiceStatus } from "../../api/index.js";


export default function KitchenDisplay() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoiceData, productData, categoryData] = await Promise.all([
        fetchInvoices(),
        fetchProducts(),
        fetchCategories()
      ]);

      setProducts(productData);
      setCategories(categoryData);

      const productsMap = productData.reduce((acc: any, p: any) => {
        acc[String(p.id)] = p;
        return acc;
      }, {});

      const mappedInvoices = invoiceData
        .filter((inv: any) => inv.is_active && (inv.invoice_status === 'PENDING' || inv.invoice_status === 'READY'))
        .map((inv: any) => {
          // Extract table and group from description "Table 1 - Group A"
          const tableMatch = inv.invoice_description?.match(/Table (\d+)/);
          const tableNumber = tableMatch ? parseInt(tableMatch[1]) : 0;
          const groupName = inv.invoice_description?.split(" - ")[1] || "Sale";

          return {
            id: inv.id.toString(),
            invoiceNumber: inv.invoice_number,
            tableNumber,
            groupName,
            waiter: inv.created_by_name,
            createdAt: new Date(inv.order_date),
            status: inv.invoice_status === 'PENDING' ? 'new' :
              inv.invoice_status === 'READY' ? 'ready' : 'completed',
            total: parseFloat(inv.total_amount),
            notes: inv.notes,
            items: inv.items.map((item: any) => {
              const product = productsMap[String(item.product)];
              return {
                quantity: item.quantity,
                menuItem: {
                  name: product?.name || `Product #${item.product}`,
                  category: product?.category_name || 'Uncategorized'
                },
                notes: item.description
              };
            })
          };
        });

      setOrders(mappedInvoices);
    } catch (err: any) {
      toast.error(err.message || "Failed to load kitchen data");
    } finally {
      setLoading(false);
    }
  };

  // Get current user and branch
  const storedUser = localStorage.getItem('currentUser');
  const user: User | null = storedUser ? JSON.parse(storedUser) : null;
  const branch = branches.find(b => b.id === user?.branchId);

  // Determine Kitchen Type
  const kitchenType = user?.kitchenType || 'main'; // Default to 'main' if not specified
  const isBreakfastKitchen = kitchenType === 'breakfast';

  // Filter Orders Logic
  const filteredOrders = orders.map(order => {
    // Filter items based on category
    const relevantItems = order.items.filter((item: any) => {
      // Find the category object for this item
      const itemCat = categories.find(c => c.name === item.menuItem.category);
      const kitchenTarget = isBreakfastKitchen ? 'breakfast' : 'main';

      // If categories are empty or category has no type, default to 'main'
      const catType = itemCat?.type || 'main';

      return catType === kitchenTarget;
    });

    // Return order with ONLY relevant items, or null if no items match
    if (relevantItems.length > 0) {
      return { ...order, items: relevantItems };
    }
    return null;
  }).filter(Boolean);

  const handleStatusChange = async (orderId: string, newFrontendStatus: string) => {
    // Map frontend status to backend status
    const backendStatusMap: Record<string, string> = {
      'new': 'PENDING',
      'ready': 'READY',
      'completed': 'COMPLETED'
    };

    const backendStatus = backendStatusMap[newFrontendStatus];
    console.log(`Updating order ${orderId} to ${backendStatus}`);

    try {
      await updateInvoiceStatus(orderId, backendStatus);
      toast.success(`Order updated to ${newFrontendStatus}`);

      // Re-fetch data to be sure
      await loadData();
    } catch (err: any) {
      console.error("Status update error:", err);
      toast.error(err.message || "Failed to update order status");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white border-b px-6 py-4 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isBreakfastKitchen ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
              {isBreakfastKitchen ? <Utensils className="h-6 w-6" /> : <Coffee className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold text-foreground">
                  {isBreakfastKitchen ? 'Breakfast Kitchen' : 'Main Kitchen'}
                </h1>
                <div className="bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-primary/10 flex items-center gap-1">
                  <MapPin className="h-2 w-2" />
                  {branch?.name || "Global"}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed • {user?.name || "Chef"}
                </div>
                <div className="h-3 w-px bg-slate-200" />

                {/* Completed Orders Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-slate-200 transition-colors">
                      <span className="text-xs font-medium text-slate-500">Completed today:</span>
                      <span className="text-xs font-bold text-slate-700">{filteredOrders.filter(o => o.status === 'completed').length}</span>
                    </div>
                  </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                      <SheetTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Completed Orders History
                      </SheetTitle>
                    </SheetHeader>

                    <div className="space-y-4">
                      {filteredOrders.filter(o => o.status === 'completed').length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p>No completed orders yet today</p>
                        </div>
                      ) : (
                        filteredOrders
                          .filter(o => o.status === 'completed')
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map(order => (
                            <div key={order.id} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-bold text-slate-800">Order #{order.id.slice(-3)}</h3>
                                  <p className="text-sm text-slate-500">Table {order.tableNumber} • {order.waiter}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                                    {new Date(order.createdAt).toLocaleTimeString()}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-amber-600"
                                    onClick={() => handleStatusChange(order.id, 'ready')}
                                    title="Undo Completion"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex gap-2 text-sm">
                                    <span className="font-bold text-slate-600 w-4">{item.quantity}x</span>
                                    <span className="text-slate-700 flex-1">{item.menuItem.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2 font-bold text-xs uppercase tracking-widest h-9 rounded-xl border-slate-200">
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-4 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-xl font-bold text-slate-600">Syncing with backend...</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* New Orders Column */}
          <div className="flex flex-col h-full bg-slate-100/50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <h2 className="font-bold text-slate-800">New Orders</h2>
              </div>
              <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-md text-xs">
                {filteredOrders.filter(o => o.status === 'new').length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredOrders.filter(o => o.status === 'new').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <Bell className="h-6 w-6 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No new orders</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 content-start">
                  {filteredOrders
                    .filter(o => o.status === 'new')
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="flex flex-col h-full bg-slate-100/50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <h2 className="font-bold text-slate-800">Ready to Serve</h2>
              </div>
              <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md text-xs">
                {filteredOrders.filter(o => o.status === 'ready').length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredOrders.filter(o => o.status === 'ready').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-12 h-1 border-2 border-slate-200 rounded-full opacity-50" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 content-start">
                  {filteredOrders
                    .filter(o => o.status === 'ready')
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
