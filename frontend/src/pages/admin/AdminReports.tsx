import { analyticsData } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { fetchReportDashboard } from "@/api/index.js";
import { getCurrentUser } from "../../auth/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileText,
  TrendingUp,
  Calendar,
  Printer
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const weeklyData = [
  { day: 'Mon', sales: 24500, orders: 42 },
  { day: 'Tue', sales: 28200, orders: 48 },
  { day: 'Wed', sales: 22100, orders: 38 },
  { day: 'Thu', sales: 31500, orders: 52 },
  { day: 'Fri', sales: 35800, orders: 61 },
  { day: 'Sat', sales: 42300, orders: 72 },
  { day: 'Sun', sales: 38400, orders: 65 },
];

const waiterPerformance = [
  { name: 'Rahul', orders: 45, sales: 8200, rating: 4.8 },
  { name: 'Priya', orders: 52, sales: 9450, rating: 4.9 },
  { name: 'Amit', orders: 38, sales: 6800, rating: 4.6 },
  { name: 'Sneha', orders: 41, sales: 7350, rating: 4.7 },
];

export default function AdminReports() {
  const user = getCurrentUser();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [user?.branch_id]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const branchId = (user?.role === 'admin' || user?.role === 'superadmin') ? (user?.branch_id || 1) : null;
      const data = await fetchReportDashboard(branchId);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch report dashboard:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 hover:shadow-warm-lg cursor-pointer transition-all">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Daily Report</h3>
              <p className="text-sm text-muted-foreground">Today's summary</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-warm-lg cursor-pointer transition-all">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Weekly Report</h3>
              <p className="text-sm text-muted-foreground">This week's analysis</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-warm-lg cursor-pointer transition-all">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-info" />
            </div>
            <div>
              <h3 className="font-semibold">Monthly Report</h3>
              <p className="text-sm text-muted-foreground">Monthly overview</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="items">Item Report</TabsTrigger>
          <TabsTrigger value="staff">Staff Report</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Weekly Sales Trend</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">This Week</Button>
                <Button variant="ghost" size="sm">Last Week</Button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `Rs.${value.toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Month Sales</p>
              <p className="text-2xl font-bold text-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Rs.${reportData?.total_month_sales?.toLocaleString() || 0}`}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Month Orders</p>
              <p className="text-2xl font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (reportData?.total_month_orders || 0)}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground">Avg Order (Month)</p>
              <p className="text-2xl font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Rs.${reportData?.total_month_sales && reportData?.total_month_orders ? (reportData.total_month_sales / reportData.total_month_orders).toFixed(0) : 0}`}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground">Growth</p>
              <p className={`text-2xl font-bold ${(reportData?.growth_percent || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `${(reportData?.growth_percent || 0).toFixed(1)}%`}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-6">Top Selling Items</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analyticsData.topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-elevated overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Rank</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Item</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Orders</th>
                  <th className="px-6 py-4 text-right font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topItems.map((item, index) => (
                  <tr key={item.name} className="border-t">
                    <td className="px-6 py-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">{item.count}</td>
                    <td className="px-6 py-4 text-right font-semibold text-primary">
                      Rs.{item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-6">Staff Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waiterPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
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

          <div className="card-elevated overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Staff</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Orders</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Sales</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Rating</th>
                </tr>
              </thead>
              <tbody>
                {waiterPerformance.map((staff) => (
                  <tr key={staff.name} className="border-t">
                    <td className="px-6 py-4 font-medium">{staff.name}</td>
                    <td className="px-6 py-4">{staff.orders}</td>
                    <td className="px-6 py-4">Rs.{staff.sales.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="bg-success/10 text-success px-2 py-1 rounded-full text-sm font-medium">
                        ⭐ {staff.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
