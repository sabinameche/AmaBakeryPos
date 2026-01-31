import { useState, useEffect } from "react";
import { Store, MapPin, Search, Filter, Plus, Trash2, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { fetchBranches, createBranch, deleteBranch } from "../../api/index.js";

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

export default function SuperAdminBranches() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        name: "",
        location: ""
    });

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        setLoading(true);
        try {
            const response = await fetchBranches();
            setBranches(response.data || []);
        } catch (err: any) {
            toast.error(err.message || "Failed to load branches");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.name || !form.location) {
            toast.error("Please fill all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await createBranch(form);
            toast.success(response.message || "Branch created");
            setIsAddOpen(false);
            setForm({ name: "", location: "" });
            loadBranches();
        } catch (err: any) {
            toast.error(err.message || "Failed to create branch");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete branch "${name}"?`)) return;

        try {
            const response = await deleteBranch(id);
            toast.success(response.message || "Branch deleted");
            loadBranches();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete branch");
        }
    };

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">All Branches</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {loading ? "Loading branches..." : `Manage your ${branches.length} locations.`}
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="gradient-warm text-white font-black uppercase tracking-widest text-xs h-10 px-4 rounded-xl"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Location
                </Button>
            </div>

            <div className="card-elevated p-4 md:p-6 border-2 border-slate-50 rounded-[2rem]">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Find a branch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                        <p className="text-muted-foreground mt-4 font-medium">Fetching branches...</p>
                    </div>
                ) : filteredBranches.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No branches found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredBranches.map(branch => (
                            <div key={branch.id} className="group relative bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer">
                                <div className="absolute top-4 right-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(branch.id, branch.name);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Store className="h-6 w-6" />
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-1">{branch.name}</h3>
                                <div className="flex items-center text-sm text-muted-foreground mb-4">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {branch.location}
                                </div>

                                <div className="flex items-center justify-between text-sm py-3 border-t border-slate-50">
                                    <div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Manager</p>
                                        <p className="font-semibold text-slate-700">{branch.branch_manager?.username || "N/A"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Staff Count</p>
                                        <p className="font-semibold text-slate-700">{branch.branch_manager?.total_user || 0}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="h-12 px-8 rounded-xl gradient-warm text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-200"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Branch"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
