import { useState, useEffect } from "react";
import {
    Users,
    Shield,
    Key,
    Plus,
    Search,
    Pencil,
    Trash2,
    Loader2,
    Store,
    LayoutGrid,
    Mail,
    User
} from "lucide-react";
import { fetchUsers, createUser, updateUser, deleteUser, fetchBranches } from "../../api/index.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Branch {
    id: number;
    name: string;
    location: string;
}

interface UserData {
    id: string;
    username: string;
    full_name: string;
    user_type: string;
    email: string;
    branch_name?: string;
    branch?: number;
}

export default function SuperAdminAccess() {
    const [usersList, setUsersList] = useState<UserData[]>([]);
    const [branchesList, setBranchesList] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserData | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        full_name: "",
        username: "",
        email: "",
        password: "",
        user_type: "BRANCH_MANAGER",
        branch: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, branchesData] = await Promise.all([
                fetchUsers(),
                fetchBranches()
            ]);
            setUsersList(usersData.filter((u: any) => u.user_type === 'BRANCH_MANAGER' || u.user_type === 'ADMIN'));
            setBranchesList(branchesData.data || []);
        } catch (err: any) {
            toast.error("Failed to load data", { description: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditUser(null);
        setForm({
            full_name: "",
            username: "",
            email: "",
            password: "",
            user_type: "BRANCH_MANAGER",
            branch: ""
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (user: UserData) => {
        setEditUser(user);
        setForm({
            full_name: user.full_name || "",
            username: user.username || "",
            email: user.email || "",
            password: "",
            user_type: user.user_type,
            branch: user.branch?.toString() || ""
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...form,
            branch: form.branch ? parseInt(form.branch) : null
        };

        try {
            if (editUser) {
                // Remove password if empty on edit
                if (!payload.password) delete (payload as any).password;
                await updateUser(editUser.id, payload);
                toast.success("Manager updated successfully");
            } else {
                await createUser(payload);
                toast.success("Manager created successfully");
            }
            setIsDialogOpen(false);
            loadData();
        } catch (err: any) {
            toast.error("Operation failed", { description: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (user: UserData) => {
        if (!confirm(`Are you sure you want to delete ${user.username}?`)) return;

        try {
            await deleteUser(user.id);
            toast.success("Manager deleted");
            loadData();
        } catch (err: any) {
            toast.error("Delete failed", { description: err.message });
        }
    };

    const filteredUsers = usersList.filter(u =>
        (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Admin Access & Security</h1>
                    <p className="text-sm text-muted-foreground font-medium">Manage privilege levels and secure access for branch managers.</p>
                </div>
                <Button onClick={handleOpenAdd} className="gradient-warm text-white font-black uppercase tracking-widest text-xs h-11 px-6 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    New Manager
                </Button>
            </div>

            <div className="card-elevated p-4 md:p-6 border-2 border-slate-50 rounded-[2rem]">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or username..."
                            className="pl-9 h-11 bg-slate-50 border-slate-200 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                            <p className="mt-4 text-muted-foreground font-medium">Synchronizing access logs...</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50/80 text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Administrator</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Assigned Branch</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Username</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 shadow-sm">
                                                    {(user.full_name || user.username).charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-none mb-1">{user.full_name || "Manager"}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{user.email || "No email"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge className={cn(
                                                "font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full",
                                                user.user_type === 'ADMIN' ? "bg-primary text-white" : "bg-orange-50 text-orange-600 border border-orange-100"
                                            )}>
                                                {user.user_type === 'ADMIN' ? "Super Admin" : "Branch Manager"}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                                                <Store className="h-4 w-4 text-slate-400" />
                                                {user.branch_name || 'Global HQ'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                {user.username}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
                                                    onClick={() => handleOpenEdit(user)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {user.user_type !== 'ADMIN' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                                                        onClick={() => handleDelete(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Manager Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">
                            {editUser ? 'Edit Manager' : 'New Branch Manager'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    value={form.full_name}
                                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                                    placeholder="e.g. Rajdeep Sharma"
                                    className="pl-10 h-12 rounded-xl border-slate-200"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Username</Label>
                                <Input
                                    value={form.username}
                                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                    placeholder="rajdeep_mgr"
                                    className="h-12 rounded-xl border-slate-200"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                        placeholder="raj@ama.com"
                                        className="pl-10 h-12 rounded-xl border-slate-200"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Assign to Branch</Label>
                            <Select
                                value={form.branch}
                                onValueChange={val => setForm(p => ({ ...p, branch: val }))}
                                required
                            >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {branchesList.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                                {editUser ? 'Change Password (Optional)' : 'Default Password'}
                            </Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder={editUser ? "Keep empty to stay same" : "amabakery@123"}
                                    className="pl-10 h-12 rounded-xl border-slate-200"
                                    required={!editUser}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="h-12 rounded-xl font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="h-12 px-8 rounded-xl gradient-warm text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-200"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editUser ? 'Save Changes' : 'Create Manager')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
