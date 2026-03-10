import { useState, useEffect, useCallback } from "react";
import {
    BarChart3,
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Loader2,
    WifiOff,
    ChevronDown,
    Calendar as CalendarIcon
} from "lucide-react";
import { useDashboardSSE } from "@/hooks/useDashboardSSE";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchDashboardDetails } from "@/api/index.js";
import { toast } from "sonner";
import { format } from "date-fns";
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

const COLORS = ["#ca8a04", "#854d0e", "#a16207", "#713f12", "#451a03"];

export default function SuperAdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [sseConnected, setSSEConnected] = useState(false);

    // Filter states
    const [timeframe, setTimeframe] = useState("monthly");
    const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
        from: undefined,
        to: undefined
    });

    // SSE: Real-time analytics updates
    const handleSSEUpdate = useCallback((sseData: any) => {
        if (sseData.success) {
            setData((prev: any) => ({
                ...prev,
                ...sseData,
            }));
            setSSEConnected(true);
        }
    }, []);

    useDashboardSSE(null, handleSSEUpdate);

    useEffect(() => {
        loadData();
    }, [timeframe, dateRange]);

    const getFilters = () => {
        const params: any = { timeframe };
        if (timeframe === "custom" && dateRange.from && dateRange.to) {
            params.start_date = format(dateRange.from, "yyyy-MM-dd");
            params.end_date = format(dateRange.to, "yyyy-MM-dd");
        }
        return params;
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const dashboardData = await fetchDashboardDetails(null, getFilters());
            setData(dashboardData);
        } catch (error: any) {
            toast.error(error.message || "Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
                    Aggregating Network Data...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Global Analytics</h1>
                        <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1.5 border ${sseConnected
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}>
                            {sseConnected ? (
                                <>
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                </>
                            ) : (
                                <>
                                    <WifiOff className="h-3 w-3" />
                                    Connecting...
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                        Analysis for the {timeframe} period
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-xl border-2 font-bold px-4 hover:bg-slate-50 transition-all border-slate-100 shadow-sm gap-2 bg-white hover:text-primary">
                                <Filter className="h-4 w-4 text-primary" />
                                <span className="capitalize">{timeframe}</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1.5 font-black">Select Period</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setTimeframe("daily")} className="rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50 py-3 capitalize text-slate-600 hover:text-primary transition-colors">Daily Pulse</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe("weekly")} className="rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50 py-3 capitalize text-slate-600 hover:text-primary transition-colors">Weekly Trend</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe("monthly")} className="rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50 py-3 capitalize text-slate-600 hover:text-primary transition-colors">Monthly View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeframe("yearly")} className="rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50 py-3 capitalize text-slate-600 hover:text-primary transition-colors">Yearly Report</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 my-1" />
                            <DropdownMenuItem onClick={() => setTimeframe("custom")} className="rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-50 py-3 text-primary">Custom Date Range</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {timeframe === "custom" && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("h-11 rounded-xl border-2 font-bold px-4 border-slate-100 shadow-sm gap-2 bg-white", !dateRange.from && "text-muted-foreground")}>
                                    <CalendarIcon className="h-4 w-4" />
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                            <>{format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}</>
                                        ) : (
                                            format(dateRange.from, "MMM dd")
                                        )
                                    ) : (
                                        "Pick Dates"
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


                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`Rs. ${(data?.total_sum || data?.total_sales || 0).toLocaleString()}`}
                    change={timeframe}
                    isUp={true}
                    icon={<DollarSign className="h-5 w-5" />}
                    iconBg="bg-amber-50 text-amber-600"
                />
                <StatCard
                    title="Total Orders"
                    value={(data?.total_count_order || 0).toLocaleString()}
                    change="Across Units"
                    isUp={true}
                    icon={<ShoppingBag className="h-5 w-5" />}
                    iconBg="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Average Order Value"
                    value={`Rs. ${data?.average_order_value?.toFixed(0) || 0}`}
                    change="Net Average"
                    isUp={true}
                    icon={<TrendingUp className="h-5 w-5" />}
                    iconBg="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Active Branches"
                    value={data?.total_count_branch || data?.total_branch || 0}
                    change="Stable"
                    isUp={true}
                    icon={<Users className="h-5 w-5" />}
                    iconBg="bg-purple-50 text-purple-600"
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Momentum Area Chart */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="px-8 pt-8 flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight capitalize">{timeframe} Momentum</CardTitle>
                            <CardDescription className="font-medium">Performance curve for the selected cycle.</CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Real-time Data</span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-8 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.trend_chart || []}>
                                <defs>
                                    <linearGradient id="colorSalesMomentum" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#ca8a04" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                    tickFormatter={(v) => `Rs.${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#ca8a04"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorSalesMomentum)"
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="px-8 pt-8 text-center">
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Sales Split</CardTitle>
                        <CardDescription className="font-medium">Revenue by food category.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-8 flex flex-col items-center">
                        <div className="h-[220px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={(data?.total_sales_per_category || []).map((item: any) => ({
                                            ...item,
                                            category_total_sales: parseFloat(item.category_total_sales || 0)
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={95}
                                        paddingAngle={8}
                                        dataKey="category_total_sales"
                                        nameKey="product__category__name"
                                        stroke="none"
                                        isAnimationActive={false}
                                    >
                                        {(data?.total_sales_per_category || []).map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Sales']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-slate-900">
                                    {(data?.total_sum || 0).toLocaleString('en-IN', { maximumSignificantDigits: 3 })}
                                </span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{timeframe}</span>
                            </div>
                        </div>
                        <div className="w-full mt-6 space-y-2.5">
                            {(data?.total_sales_per_category || []).map((cat: any, idx: number) => (
                                <div key={cat.product__category__name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight truncate max-w-[120px]">{cat.product__category__name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">
                                        {cat.category_percent ? parseFloat(cat.category_percent).toFixed(1) :
                                            ((parseFloat(cat.category_total_sales || 0) / (data?.total_sum || 1)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row - Best Sellers & Branch Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Items Ranking Table */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="px-8 pt-8">
                        <CardTitle className="text-xl font-black text-slate-900">Top Selling Products</CardTitle>
                        <CardDescription className="font-medium">High volume inventory nodes.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-8">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="text-left py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                                        <th className="text-right py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data?.top_selling_items || []).map((item: any) => (
                                        <tr key={item.product__name} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-300 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-all capitalize">
                                                        {item.product__name?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 capitalize">{item.product__name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-sm font-black text-slate-900 tabular-nums">{item.total_sold_units} <span className="text-[10px] text-slate-400 uppercase">Units</span></span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Branch Performance Rankings */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="px-8 pt-8">
                        <CardTitle className="text-xl font-black text-slate-900">Branch Rankings</CardTitle>
                        <CardDescription className="font-medium">Performance by regional units.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 space-y-6">
                        {(data?.top_perfomance_branch || []).map((branch: any, idx: number) => {
                            const maxRevenue = data?.top_perfomance_branch[0]?.total_sales_per_branch || 1;
                            return (
                                <div key={branch.name} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 uppercase">
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm font-black text-slate-700 capitalize">{branch.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 tabular-nums">Rs.{branch.total_sales_per_branch?.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full opacity-80 transition-all duration-1000"
                                            style={{ width: `${(branch.total_sales_per_branch / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, isUp, icon, iconBg }: {
    title: string,
    value: string,
    change: string,
    isUp: boolean,
    icon: React.ReactNode,
    iconBg: string
}) {
    return (
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white hover:shadow-slate-300/40 transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className={cn("p-3 rounded-2xl shadow-sm", iconBg)}>
                        {icon}
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                        isUp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {change}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none px-1">{title}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none pt-1">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
