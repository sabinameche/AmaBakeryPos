import { StatCard } from "@/components/admin/StatCard";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { analyticsData, branches, User } from "@/lib/mockData";
import { fetchDashboardDetails, fetchInvoices, fetchTables, patchTable } from "@/api/index.js";
import { getCurrentUser } from "../../auth/auth";
import { toast } from "sonner";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  UtensilsCrossed,
  Coffee,
  MapPin,
  Loader2,
  ExternalLink
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { StatusBadge } from "@/components/ui/status-badge";

const COLORS = ['hsl(32, 95%, 44%)', 'hsl(15, 70%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(199, 89%, 48%)'];

export default function AdminDashboard() {
  const user = getCurrentUser();
  const branch = branches.find(b => b.id === user?.branch_id);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableCount, setTableCount] = useState<number>(0);

  useEffect(() => {
    loadDashboardData();
    loadRecentOrders();
    loadTableData();
  }, [user?.branch_id]);

  const loadDashboardData = async () => {
    try {
      // If user is admin/superadmin, they might need a specific branch ID.
      // Based on the request, for admin/superadmin it's /1/, for manager it's default.
      // We'll use branch_id if available, or 1 as fallback for admin.
      const branchId = (user?.role === 'admin' || user?.role === 'superadmin') ? (user?.branch_id || 1) : null;
      const data = await fetchDashboardDetails(branchId);
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard details:", error);
      toast.error("Failed to load dashboard statistics");
    }
  };

  const loadTableData = async () => {
    try {
      const tablesData = await fetchTables();
      const myBranchConfig = tablesData.find((t: any) => t.branch === user?.branch_id);
      if (myBranchConfig) {
        setTableCount(myBranchConfig.table_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    }
  };

  const loadRecentOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      // Show only top 5 recent
      setRecentOrders(data.slice(0, 5));
    } catch (err: any) {
      // Slient fail for dashboard recent orders if it's not the primary focus
      console.error("Dashboard recent orders failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const generatedTables = Array.from({ length: tableCount }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    status: 'available'
  }));

  const liveTableStatus = {
    available: tableCount,
    occupied: 0,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <div className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1 border border-primary/20">
              <MapPin className="h-3 w-3" />
              {branch?.name || "Global"}
            </div>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">Welcome back, {user?.name || "Admin"}! Here's what's happening at your branch today.</p>
        </div>
        <div className="flex items-center justify-between sm:block sm:text-right w-full sm:w-auto">
          <p className="text-sm text-muted-foreground">Today</p>
          <p className="font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={`Rs.${dashboardData?.today_sales?.toLocaleString() || 0}`}
          icon={DollarSign}
          trend={{ value: Number(Math.abs(dashboardData?.sales_percent || 0).toFixed(1)), isPositive: (dashboardData?.sales_percent || 0) >= 0 }}
        />
        <StatCard
          title="Total Orders"
          value={dashboardData?.total_orders || 0}
          icon={ShoppingBag}
          trend={{ value: Number(Math.abs(dashboardData?.order_percent || 0).toFixed(1)), isPositive: (dashboardData?.order_percent || 0) >= 0 }}
        />
        <StatCard
          title="Avg Order Value"
          value={`Rs.${dashboardData?.today_sales && dashboardData?.total_orders ? (dashboardData.today_sales / dashboardData.total_orders).toFixed(0) : 0}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Peak Hours"
          value={dashboardData?.peak_hours?.[0] || "N/A"}
          icon={Clock}
          subtitle="Most orders"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Orders Chart */}
        <div className="lg:col-span-2 card-elevated p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dashboardData?.total_sales_per_category || []}
                dataKey="category_total_sales"
                nameKey="product__category__name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {(dashboardData?.total_sales_per_category || []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `Rs.${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {(dashboardData?.total_sales_per_category || []).map((item: any, index: number) => (
              <div key={item.product__category__name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.product__category__name}</span>
                </div>
                <span className="font-medium">Rs.{item.category_total_sales.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Table Status */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Live Table Status</h3>
            <div className="flex items-center gap-2">
              <NavLink
                to="/admin/dashboard/tables"
                className="p-1.5 hover:bg-primary/10 rounded-md text-primary transition-colors"
                title="Go to Table Management"
              >
                <ExternalLink className="h-4 w-4" />
              </NavLink>
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {generatedTables.map((table) => (
              <div
                key={table.id}
                className="aspect-square rounded-md flex items-center justify-center text-[10px] sm:text-xs font-black bg-success/10 text-success border border-success/20 shadow-sm hover:border-success/40 transition-colors"
              >
                {table.number}
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top Selling Items</h3>
            <Coffee className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            {(dashboardData?.top_selling_items || []).map((item: any, index: number) => (
              <div key={item.product__name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{item.product__name}</p>
                    <p className="text-xs text-muted-foreground">{item.total_orders} orders</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-elevated p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Server</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      <p className="text-muted-foreground text-xs">Syncing recent sales...</p>
                    </div>
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No recent orders found.
                  </td>
                </tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors text-xs md:text-sm">
                  <td className="px-6 py-4 font-bold text-foreground">
                    {order.invoice_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-[10px] uppercase text-muted-foreground">{order.branch_name}</span>
                      <span className="text-xs">{order.invoice_description || 'General Sale'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                      {order.items.length} items
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {order.created_by_name}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.payment_status.toLowerCase()} className="shadow-none border h-6 px-2.5" />
                  </td>
                  <td className="px-6 py-4 text-right font-black text-primary">
                    Rs.{order.total_amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
