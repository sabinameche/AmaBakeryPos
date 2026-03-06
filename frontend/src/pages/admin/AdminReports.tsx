import { useState, useEffect } from "react";
import { fetchReportDashboard, fetchStaffReport } from "@/api/index.js";
import { getCurrentUser } from "../../auth/auth";
import { toast } from "sonner";
import {
  Download,
  FileText,
  TrendingUp,
  Printer,
  Loader2,
  Filter,
  CalendarDays,
  ChevronDown,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

const PAYMENT_COLORS = ['hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)', 'hsl(32, 95%, 44%)', 'hsl(280, 65%, 60%)', 'hsl(0, 84%, 60%)'];



export default function AdminReports() {
  const user = getCurrentUser();
  const [reportData, setReportData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [missingBranch, setMissingBranch] = useState(false);

  // Filter states
  const [timeframe, setTimeframe] = useState("monthly");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  useEffect(() => {
    loadReportData();
    loadStaffData();
  }, [user?.branch_id, timeframe, dateRange]);

  const getFilters = () => {
    const params: any = { timeframe };
    if (timeframe === "custom" && dateRange.from && dateRange.to) {
      params.start_date = format(dateRange.from, "yyyy-MM-dd");
      params.end_date = format(dateRange.to, "yyyy-MM-dd");
    }
    return params;
  };

  const loadReportData = async () => {
    setLoading(true);
    setMissingBranch(false);
    try {
      // api.md spec: admin/superadmin must supply a branch_id for report endpoint.
      // Branch managers call the URL without an id (their branch is inferred from JWT).
      const isSuperOrAdmin = user?.is_superuser || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
      if (isSuperOrAdmin && !user?.branch_id) {
        // Global admin has no branch assigned — cannot show branch report.
        setMissingBranch(true);
        setLoading(false);
        return;
      }
      const branchId = isSuperOrAdmin ? user?.branch_id : null;
      const data = await fetchReportDashboard(branchId, getFilters());
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch report dashboard:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const loadStaffData = async () => {
    setStaffLoading(true);
    try {
      const isSuperOrAdmin = user?.is_superuser || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
      if (isSuperOrAdmin && !user?.branch_id) {
        setStaffLoading(false);
        return;
      }
      const branchId = isSuperOrAdmin ? user?.branch_id : null;
      const data = await fetchStaffReport(branchId, getFilters());
      setStaffData(data?.staff_performance || []);
    } catch (error) {
      console.error("Failed to fetch staff report:", error);
      toast.error("Failed to load staff data");
    } finally {
      setStaffLoading(false);
    }
  };

  // Unified trend data from API
  const trendChartData = reportData?.trend_chart || [];

  // Real top-selling items from API
  const topItems: any[] = reportData?.top_selling_items_count || [];

  // Build hourly chart data from API Hourly_sales field
  const hourlyChartData = reportData?.Hourly_sales || [];

  return (
    <div className="p-6 space-y-6">
      {/* Show message if global admin has no branch */}
      {missingBranch && (
        <div className="card-elevated p-6 border border-amber-200 bg-amber-50 rounded-xl">
          <p className="text-amber-800 font-semibold">Select a specific branch to view its reports. Your global admin account is not assigned to a branch.</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-2 font-bold px-4 hover:bg-slate-50 transition-all border-slate-100 shadow-sm gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="capitalize">{timeframe} View</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1.5 font-black">Select Period</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTimeframe("daily")} className="rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-50">Daily Breakdown</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("weekly")} className="rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-50">Weekly Analysis</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("monthly")} className="rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-50">Monthly Overview</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeframe("yearly")} className="rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-50">Yearly Report</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100 my-1" />
              <DropdownMenuItem onClick={() => setTimeframe("custom")} className="rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-50 text-primary">Custom Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Date Range Popover */}
          {timeframe === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-11 rounded-xl border-2 font-bold px-4 border-slate-100 shadow-sm gap-2", !dateRange.from && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Select Dates"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="p-4"
                />
              </PopoverContent>
            </Popover>
          )}

          <div className="h-8 w-[1px] bg-slate-100 mx-2" />

          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-2 border-slate-100 shadow-sm">
            <Printer className="h-4 w-4" />
          </Button>
          <Button className="h-11 rounded-xl shadow-lg shadow-primary/20 px-6 font-bold gap-2">
            <Download className="h-4 w-4" />
            Export
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
              <FileText className="h-6 w-6 text-info" />
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
          <div className="card-elevated p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold capitalize">{timeframe} Sales Trend</h3>
                <p className="text-xs text-muted-foreground">Performance overview for the selected period</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="colorSalesReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `Rs.${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`Rs.${value.toLocaleString()}`, 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSalesReports)"
                  dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight">{timeframe} Sales</p>
              <p className="text-2xl font-black text-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Rs.${reportData?.total_month_sales?.toLocaleString() || 0}`}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight">{timeframe} Orders</p>
              <p className="text-2xl font-black">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (reportData?.total_month_orders || 0)}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight">Avg Order ({timeframe})</p>
              <p className="text-2xl font-black">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Rs.${reportData?.total_month_sales && reportData?.total_month_orders ? (reportData.total_month_sales / reportData.total_month_orders).toFixed(0) : 0}`}
              </p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight">{timeframe} Growth</p>
              <p className={`text-2xl font-black ${(reportData?.growth_percent || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `${(reportData?.growth_percent || 0).toFixed(1)}%`}
              </p>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-elevated p-8 relative">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-black uppercase tracking-tight">Sales by Payment Method ({timeframe})</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Transaction spread</p>
              </div>
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(reportData?.sales_by_payment_method || []).map((p: any) => ({
                        ...p,
                        total_amount: parseFloat(String(p.total_amount || 0)) || 0
                      }))}
                      dataKey="total_amount"
                      nameKey="payment_method"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {(reportData?.sales_by_payment_method || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any) => [`Rs.${Number(value).toLocaleString()}`, 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800">
                    Rs.{Number(reportData?.total_month_sales || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{timeframe} Total</span>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {(reportData?.sales_by_payment_method || []).map((item: any, index: number) => (
                  <div key={item.payment_method} className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }}
                      />
                      <span className="text-[10px] font-black uppercase text-slate-500">{item.payment_method?.toLowerCase()}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      Rs.{Number(item.total_amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kitchen Type Distribution */}
            {/* Payment Status Distribution */}
            <div className="card-elevated p-8 relative">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-black uppercase tracking-tight">Sales by Payment Status ({timeframe})</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Status-wise distribution</p>
              </div>
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(reportData?.sales_by_status || []).map((p: any) => ({
                        ...p,
                        total_amount: parseFloat(String(p.total_amount || 0)) || 0
                      }))}
                      dataKey="total_amount"
                      nameKey="payment_status"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {(reportData?.sales_by_status || []).map((_: any, index: number) => (
                        <Cell key={`cell-status-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any) => [`Rs.${Number(value).toLocaleString()}`, 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800">
                    Rs.{Number(reportData?.total_month_sales || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{timeframe} Total</span>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {(reportData?.sales_by_status || []).map((item: any, index: number) => (
                  <div key={item.payment_status} className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }}
                      />
                      <span className="text-[10px] font-black uppercase text-slate-500">{item.payment_status?.toLowerCase()}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      Rs.{Number(item.total_amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-6 capitalize">{timeframe} Top Selling Items</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="product__name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="total_orders" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
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
                {topItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'No data available'}
                    </td>
                  </tr>
                ) : topItems.map((item, index) => (
                  <tr key={item.product__name} className="border-t">
                    <td className="px-6 py-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{item.product__name}</td>
                    <td className="px-6 py-4">{item.total_orders}</td>
                    <td className="px-6 py-4 text-right font-semibold text-primary">
                      Rs.{Number(item.total_sales || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold mb-6 capitalize">Staff Performance ({timeframe})</h3>
            {staffLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : staffData.length === 0 ? (
              <div className="flex justify-center items-center h-[300px] text-muted-foreground">
                No staff data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) =>
                      name === 'total_sales' ? `Rs.${value.toLocaleString()}` : value
                    }
                  />
                  <Bar dataKey="total_orders" name="Orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card-elevated overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Staff</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Total Orders</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Month Orders</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Total Sales</th>
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Month Sales</th>
                </tr>
              </thead>
              <tbody>
                {staffLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : staffData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No staff data available
                    </td>
                  </tr>
                ) : staffData.map((staff) => (
                  <tr key={staff.id} className="border-t">
                    <td className="px-6 py-4 font-medium">{staff.name}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm capitalize">{staff.role?.toLowerCase().replace('_', ' ')}</td>
                    <td className="px-6 py-4">{staff.total_orders}</td>
                    <td className="px-6 py-4 text-primary font-bold">{staff.current_month_orders}</td>
                    <td className="px-6 py-4 font-semibold text-slate-400">Rs.{Number(staff.total_sales).toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-slate-900">Rs.{Number(staff.current_month_sales).toLocaleString()}</td>
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
