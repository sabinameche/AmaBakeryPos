import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Calendar,
    Users,
    ShoppingBag,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Loader2
} from "lucide-react";
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

const COLORS = ["#ca8a04", "#854d0e", "#a16207", "#713f12", "#451a03"];

export default function SuperAdminAnalytics() {
    const [timeRange] = useState("Daily Pulse");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const dashboardData = await fetchDashboardDetails();
            setData(dashboardData);
        } catch (error: any) {
            toast.error(error.message || "Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[70vh] w-full flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
                    Aggregating Network Data...
                </p>
            </div>
        );
    }

    // Transform weekly sales for chart
    const weeklyRaw = data?.Weekely_Sales || {};
    const chartData = [
        { name: "Mon", revenue: weeklyRaw.monday || 0 },
        { name: "Tue", revenue: weeklyRaw.tuesday || 0 },
        { name: "Wed", revenue: weeklyRaw.wednesday || 0 },
        { name: "Thu", revenue: weeklyRaw.thursday || 0 },
        { name: "Fri", revenue: weeklyRaw.friday || 0 },
        { name: "Sat", revenue: weeklyRaw.saturday || 0 },
        { name: "Sun", revenue: weeklyRaw.sunday || 0 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Global Analytics</h1>
                    <p className="text-sm text-muted-foreground font-medium">Tracking performance across all regions and branches.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border rounded-xl px-3 py-1.5 shadow-sm">
                        <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                        <span className="text-sm font-bold text-slate-700">{timeRange}</span>
                    </div>
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={loadData}>
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button className="rounded-xl bg-slate-900 group">
                        <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`Rs. ${data?.total_sales?.toLocaleString() || 0}`}
                    change="Global"
                    isUp={true}
                    icon={<DollarSign className="h-5 w-5" />}
                    iconBg="bg-amber-50 text-amber-600"
                />
                <StatCard
                    title="Total Orders"
                    value={data?.total_count_order?.toLocaleString() || 0}
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
                    value={data?.total_branch || 0}
                    change="Stable"
                    isUp={true}
                    icon={<Users className="h-5 w-5" />}
                    iconBg="bg-purple-50 text-purple-600"
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend - Spans 2 columns */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
                    <CardHeader className="px-8 pt-8 flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900">Revenue Performance</CardTitle>
                            <CardDescription className="font-medium">Daily transaction pulse across the network.</CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-8 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ca8a04" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#ca8a04', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#ca8a04"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
                    <CardHeader className="px-8 pt-8">
                        <CardTitle className="text-xl font-black text-slate-900">Sales by Category</CardTitle>
                        <CardDescription className="font-medium">Revenue split across food types.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-8 flex flex-col items-center">
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.sales_per_category || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="total_category_sum"
                                        nameKey="product__category__name"
                                    >
                                        {(data?.sales_per_category || []).map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-slate-900">100%</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</span>
                            </div>
                        </div>
                        <div className="w-full mt-6 space-y-2">
                            {(data?.sales_per_category || []).map((cat: any, idx: number) => (
                                <div key={cat.product__category__name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{cat.product__category__name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">{cat.category_percent?.toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Branch Performance Rankings */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="px-8 pt-8">
                    <CardTitle className="text-xl font-black text-slate-900">Branch Performance</CardTitle>
                    <CardDescription className="font-medium">Top performing locations by revenue.</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {(data?.top_perfomance_branch || []).map((branch: any, idx: number) => {
                            const maxRevenue = data?.top_perfomance_branch[0]?.total_sales_per_branch || 1;
                            return (
                                <div key={branch.name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 capitalize">{branch.name} Branch</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">Total:</span>
                                            <span className="text-sm font-black text-slate-900">Rs.{branch.total_sales_per_branch?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full opacity-80"
                                            style={{ width: `${(branch.total_sales_per_branch / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Items Ranking Table */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="px-8 pt-8 flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-xl font-black text-slate-900">Best Sellers</CardTitle>
                        <CardDescription className="font-medium">Highest volume items across all units.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="text-left py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                                    <th className="text-center py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Status</th>
                                    <th className="text-right py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.top_selling_items || []).map((item: any) => (
                                    <tr key={item.product__name} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-300 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-all capitalize">
                                                    {item.product__name?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 capitalize">{item.product__name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                                High Demand
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="text-base font-black text-slate-900 tabular-nums">{item.total_sold_units} Units</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
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
                        "flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-tight border",
                        isUp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {change}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight leading-none pt-1">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
