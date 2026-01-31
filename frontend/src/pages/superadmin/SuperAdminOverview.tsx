import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Store,
    Users,
    DollarSign,
    TrendingUp,
    Search,
    Plus,
    MapPin,
    ArrowUpRight,
    Clock,
    MoreVertical,
    ExternalLink,
    Globe,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchBranches, createBranch } from "../../api/index.js";
import { users as mockUsers } from "@/lib/mockData";

interface Branch {
    id: number;
    name: string;
    location: string;
    status?: string;
    branch_manager?: {
        id: number;
        username: string;
        email: string;
        total_user: number;
    } | null;
    revenue?: number;
}

export default function SuperAdminOverview() {
    const navigate = useNavigate();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ name: "", location: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await fetchBranches();
            setBranches(response.data || []);
        } catch (err: any) {
            toast.error(err.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = async () => {
        if (!form.name || !form.location) {
            toast.error("Please fill all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await createBranch(form);
            toast.success(response.message || "Branch created successfully");
            setIsAddOpen(false);
            setForm({ name: "", location: "" });
            loadData();
        } catch (err: any) {
            toast.error(err.message || "Failed to create branch");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = branches.reduce((sum, b) => sum + (b.revenue || 0), 0);
    const totalStaff = branches.reduce((sum, b) => sum + (b.branch_manager?.total_user || 0), 0);
    const activeBranches = branches.filter(b => (b.status || 'active') === 'active').length;

    const handleAccessBranch = (branch: Branch) => {
        // Find an admin for this branch in mock data for now, since we don't have a fetchUsersByBranch API yet
        const branchAdmin = mockUsers.find(u => String(u.branchId) === String(branch.id) && u.role === 'admin');

        if (branchAdmin) {
            localStorage.setItem('currentUser', JSON.stringify(branchAdmin));
            toast.success(`Accessing ${branch.name} Admin Portal`, {
                description: `Logged in as ${branchAdmin.name}`,
            });
            navigate('/admin/dashboard');
        } else {
            toast.error("Access Denied", {
                description: "No admin account found for this branch in our records.",
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">Enterprise Overview</h1>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                        {loading ? "Syncing data..." : `Monitoring ${branches.length} branches across the network.`}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border text-sm shadow-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-bold">Real-time Feed</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-elevated p-6 space-y-2 border-2 border-slate-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Network Revenue</h3>
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-black">Rs. {(totalRevenue / 100000).toFixed(1)}L</p>
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +12% from last month
                        </p>
                    </div>
                </div>

                <div className="card-elevated p-6 space-y-2 border-2 border-slate-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Branches</h3>
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Store className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{loading ? "---" : `${activeBranches} / ${branches.length}`}</p>
                </div>

                <div className="card-elevated p-6 space-y-2 border-2 border-slate-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Workforce</h3>
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{loading ? "---" : `${totalStaff} Staff`}</p>
                </div>

                <div className="card-elevated p-6 space-y-2 gradient-warm text-white border-none shadow-lg shadow-primary/20">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-80">Top Performer</h3>
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-xl font-black truncate">{branches.length > 0 ? branches[0].name : "N/A"}</p>
                </div>
            </div>

            {/* Branch Management */}
            <div className="card-elevated border-2 border-slate-50 overflow-hidden rounded-[2rem]">
                <div className="px-6 py-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Branch Management</h2>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search branches..."
                            className="pl-9 h-11 bg-white border-slate-200 rounded-xl font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white">
                            <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                            <p className="text-muted-foreground mt-4 font-medium">Fetching records...</p>
                        </div>
                    ) : filteredBranches.length === 0 ? (
                        <div className="text-center py-12 bg-white text-muted-foreground">
                            <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No branches found.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50/80 text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest min-w-[200px]">Branch</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Manager</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Staff</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Revenue</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredBranches.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5 cursor-pointer min-w-[200px]" onClick={() => handleAccessBranch(branch)}>
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                                    <Store className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{branch.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> {branch.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge className={cn(
                                                "font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full",
                                                (branch.status || 'active') === 'active'
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                            )}>
                                                {branch.status || 'active'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-slate-600 whitespace-nowrap">{branch.branch_manager?.username || "N/A"}</td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{branch.branch_manager?.total_user || 0} Staff</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <p className="font-black text-slate-900">Rs. {(branch.revenue || 0).toLocaleString()}</p>
                                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Good Standing</p>
                                        </td>
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAccessBranch(branch)}
                                                    className="gradient-warm text-white hover:shadow-lg hover:shadow-primary/20 h-9 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all hover:scale-105 active:scale-95"
                                                >
                                                    Access
                                                    <ExternalLink className="h-3 w-3 ml-1.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-400">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card-elevated p-6 md:p-8 border-2 border-slate-50 rounded-[2.5rem]">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Recent HQ Activity</h3>
                    <div className="space-y-6">
                        {[
                            { user: 'Rajdeep Sharma', action: 'Requested stock transfer for Kathmandu Main', time: '12 mins ago', icon: ArrowUpRight, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { user: 'System', action: 'Daily revenue reports generated for 3 branches', time: '1 hour ago', icon: Globe, color: 'text-green-500', bg: 'bg-green-50' },
                            { user: 'Admin', action: 'New staff user added to Pokhara branch', time: '3 hours ago', icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
                        ].map((log, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0", log.bg, log.color)}>
                                    <log.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900">{log.user}</p>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{log.action}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">{log.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card-elevated gradient-warm p-8 text-white flex flex-col justify-between rounded-[2.5rem] shadow-xl shadow-primary/20 border-none min-h-[300px]">
                    <div className="space-y-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <Plus className="h-7 w-7" />
                        </div>
                        <h3 className="text-2xl font-black leading-tight">Scale Your Business</h3>
                        <p className="text-sm font-medium opacity-90 leading-relaxed">Ready to expand? Set up a new enterprise branch node in seconds and monitor everything globally.</p>
                    </div>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="w-full mt-10 bg-white text-primary hover:bg-white/90 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Add New Branch
                    </Button>
                </div>
            </div>

            {/* Creation Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">Add New Branch</DialogTitle>
                        <DialogDescription className="font-medium">
                            Create a new branch location in the system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-slate-500 ml-1">Branch Name</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ama Bakery - Kathmandu"
                                className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-sm font-bold uppercase tracking-wider text-slate-500 ml-1">Location Address</Label>
                            <Input
                                id="location"
                                value={form.location}
                                onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Baneshwor, Kathmandu"
                                className="h-12 rounded-xl border-slate-200 focus:ring-primary shadow-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsAddOpen(false)}
                            className="h-12 rounded-xl font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateBranch}
                            disabled={isSubmitting}
                            className="h-12 px-8 rounded-xl gradient-warm text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-200"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Create Branch"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
