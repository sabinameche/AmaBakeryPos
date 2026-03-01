import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Check, Loader2, Layers, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { fetchTables, createTable } from "@/api/index.js";
import { getCurrentUser } from "@/auth/auth";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Floor {
    id: number;
    name: string;
    table_count: number;
    branch: number;
}

interface FloorSelectorProps {
    onSelect: (floor: Floor | null) => void;
    selectedFloorId?: number;
    compact?: boolean;
}

export function FloorSelector({ onSelect, selectedFloorId, compact }: FloorSelectorProps) {
    const [open, setOpen] = useState(false);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New floor form state
    const [newName, setNewName] = useState("");
    const [newTableCount, setNewTableCount] = useState(1);

    useEffect(() => {
        loadFloors();
    }, []);

    const loadFloors = async () => {
        setLoading(true);
        try {
            const data = await fetchTables();
            setFloors(data || []);
        } catch (err: any) {
            toast.error(err.message || "Failed to load floors");
        } finally {
            setLoading(false);
        }
    };

    const filteredFloors = useMemo(() => {
        if (!searchTerm.trim()) return floors.slice(0, 10);
        return floors.filter(f =>
            f.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [floors, searchTerm]);

    const handleCreateFloor = async () => {
        if (!newName.trim()) {
            toast.error("Floor name is required");
            return;
        }

        setSubmitting(true);
        try {
            const user = getCurrentUser();
            const payload = {
                name: newName,
                table_count: newTableCount,
                branch: user?.branch_id
            };

            const result = await createTable(payload);
            toast.success("Floor created and selected");

            // Add to local list and select
            const newFloor = result.data;
            setFloors(prev => [newFloor, ...prev]);
            onSelect(newFloor);

            // Reset and close creation mode
            setIsCreating(false);
            setNewName("");
            setNewTableCount(1);
            setSearchTerm("");
            setOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to create floor");
        } finally {
            setSubmitting(false);
        }
    };

    const selectedFloor = floors.find(f => f.id === selectedFloorId);

    // FIX: Moved variable content out of a nested component declaration to prevent unmounting on every keystroke
    const selectorContent = (
        <div className="w-full space-y-4 p-1">
            {isCreating ? (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-200">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                            <Plus className="h-4 w-4 text-primary" />
                            Quick Create Floor
                        </h4>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsCreating(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid gap-3">
                        <Input
                            placeholder="Floor Name (e.g. Ground Floor)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="h-10 border-slate-200 focus:border-primary"
                            autoFocus
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table Count</label>
                            <div className="flex items-center gap-3 bg-slate-50 p-1 px-3 rounded-xl border">
                                <button
                                    onClick={() => setNewTableCount(Math.max(1, newTableCount - 1))}
                                    className="h-8 w-8 flex items-center justify-center hover:text-primary transition-colors bg-white rounded-lg shadow-sm border"
                                >
                                    <Plus className="h-3 w-3 rotate-45" />
                                </button>
                                <span className="w-8 text-center font-black text-sm text-slate-700">{newTableCount}</span>
                                <button
                                    onClick={() => setNewTableCount(newTableCount + 1)}
                                    className="h-8 w-8 flex items-center justify-center hover:text-primary transition-colors bg-white rounded-lg shadow-sm border"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        <Button
                            className="w-full h-11 font-black gradient-warm shadow-lg shadow-primary/20"
                            onClick={handleCreateFloor}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Create & Select
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search floor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-11 rounded-xl border-slate-200 focus:border-primary shadow-sm transition-all"
                        />
                    </div>

                    <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-4 text-slate-300">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : filteredFloors.length > 0 ? (
                            <>
                                {filteredFloors.map(floor => (
                                    <button
                                        key={floor.id}
                                        onClick={() => {
                                            onSelect(floor);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border",
                                            selectedFloorId === floor.id
                                                ? "bg-primary/5 border-primary/20"
                                                : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                                                selectedFloorId === floor.id ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <Layers className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{floor.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{floor.table_count} Tables Available</p>
                                            </div>
                                        </div>
                                        {selectedFloorId === floor.id && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                                    <Layers className="h-6 w-6 text-slate-200" />
                                </div>
                                <p className="text-xs font-bold text-slate-400">
                                    {searchTerm ? `No floor found with "${searchTerm}"` : "No floors available"}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl font-bold text-xs border-dashed border-2 px-4 hover:border-primary hover:text-primary transition-all"
                                    onClick={() => {
                                        setIsCreating(true);
                                        setNewName(searchTerm);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New Floor
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    if (compact) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-between h-11 px-4 rounded-xl border-2 transition-all font-bold",
                            selectedFloor
                                ? "bg-primary/5 border-primary/20 text-primary"
                                : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Layers className={cn("h-4 w-4", selectedFloor ? "text-primary" : "text-slate-400")} />
                            <span className="truncate">{selectedFloor ? selectedFloor.name : "Select Floor"}</span>
                            {selectedFloor && (
                                <span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    {selectedFloor.table_count} Tbls
                                </span>
                            )}
                        </div>
                        <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform duration-200", open ? "rotate-180" : "")} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-2 rounded-2xl shadow-2xl border-none" align="start">
                    {selectorContent}
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <div className="space-y-4">
            {selectedFloor ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/20 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Layers className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 leading-none">{selectedFloor.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{selectedFloor.table_count} Tables Configured</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(null)}
                        className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-lg"
                    >
                        Clear
                    </Button>
                </div>
            ) : (
                selectorContent
            )}
        </div>
    );
}
