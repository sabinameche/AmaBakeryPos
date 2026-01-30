import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Loader2,
    Package,
    Eye,
    Info,
    CheckCircle2,
    XCircle,
    Tag,
    Store
} from "lucide-react";
import { toast } from "sonner";
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCategories, createCategory, deleteCategory, updateCategory } from "../../api/index.js";

interface Product {
    id: number;
    name: string;
    cost_price: string;
    selling_price: string;
    product_quantity: number;
    low_stock_bar: number;
    category: number; // This is the ID
    category_name: string;
    branch_id: number;
    branch_name: string;
    date_added: string;
    is_available: boolean;
}

interface BackendCategory {
    id: number;
    name: string;
    branch: number;
    branch_name: string;
}

export default function AdminMenu() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<BackendCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [editItem, setEditItem] = useState<Product | null>(null);
    const [viewItem, setViewItem] = useState<Product | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState("");
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (err: any) {
            toast.error(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = products.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category_name === categoryFilter;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const handleToggleAvailability = async (productId: number, currentStatus: boolean) => {
        try {
            // Optimistic update
            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, is_available: !currentStatus } : p
            ));

            const p = products.find(item => item.id === productId);
            if (p) {
                const payload = {
                    name: p.name,
                    cost_price: p.cost_price,
                    selling_price: p.selling_price,
                    product_quantity: p.product_quantity,
                    low_stock_bar: p.low_stock_bar,
                    category: p.category,
                    is_available: !currentStatus
                };
                await updateProduct(productId, payload);
                toast.success("Availability updated");
            }
        } catch (err: any) {
            // Revert on error
            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, is_available: currentStatus } : p
            ));
            toast.error(err.message || "Failed to update availability");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);

        // Get switch value manually
        const is_available = e.currentTarget.querySelector<HTMLButtonElement>('[role="switch"]')?.['aria-checked' as any] === 'true';

        const payload = {
            name: formData.get("name"),
            cost_price: formData.get("cost_price"),
            selling_price: formData.get("selling_price"),
            product_quantity: parseInt(formData.get("product_quantity") as string),
            low_stock_bar: parseInt(formData.get("low_stock_bar") as string),
            category: parseInt(formData.get("category") as string),
            is_available: is_available !== undefined ? is_available : true
        };

        try {
            if (editItem) {
                const updated = await updateProduct(editItem.id, payload);
                setProducts(prev => prev.map(p => p.id === editItem.id ? updated : p));
                toast.success("Item updated");
            } else {
                const newProduct = await createProduct(payload);
                setProducts(prev => [...prev, newProduct]);
                toast.success("Item added");
            }
            setIsDialogOpen(false);
            setEditItem(null);
        } catch (err: any) {
            console.error("Product operation error:", err);
            toast.error(err.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (productId: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const data = await deleteProduct(productId);
            setProducts(prev => prev.filter(p => p.id !== productId));
            toast.success(data.message || "Item deleted");
        } catch (err: any) {
            toast.error(err.message || "Delete failed");
        }
    };

    const handleAddCategory = async () => {
        if (newCategoryInput.trim()) {
            try {
                const response = await createCategory({ name: newCategoryInput.trim() });
                setCategories(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
                setNewCategoryInput("");
                toast.success(response.message || "Category added");
            } catch (err: any) {
                toast.error(err.message || "Failed to add category");
            }
        }
    };
    const handleUpdateCategory = async (id: number) => {
        if (!editingCategoryName.trim()) return;
        try {
            const response = await updateCategory(id, { name: editingCategoryName.trim() });
            setCategories(prev => prev.map(c => c.id === id ? response.data : c));
            setEditingCategoryId(null);
            toast.success(response.message || "Category updated");
        } catch (err: any) {
            toast.error(err.message || "Failed to update category");
        }
    };

    const handleDeleteCategory = async (catId: number, catName: string) => {
        const isInUse = products.some(item => item.category === catId);
        if (isInUse) {
            toast.error("Cannot delete category attached to existing items");
            return;
        }

        if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

        try {
            await deleteCategory(catId);
            setCategories(prev => prev.filter(c => c.id !== catId));
            toast.success("Category deleted");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete category");
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Menu Management</h1>
                    <p className="text-sm text-muted-foreground">Manage your bakery items and categories</p>
                </div>
            </div>

            <Tabs defaultValue="items" className="w-full">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full grid-cols-2 max-w-full sm:max-w-[300px]">
                        <TabsTrigger value="items">Menu Items</TabsTrigger>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                    </TabsList>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="w-full sm:w-auto font-bold" onClick={() => setEditItem(null)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                    {editItem ? 'Edit Item' : 'Add New Item'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Item Name</Label>
                                    <Input id="name" name="name" className="h-12 text-lg rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20" placeholder="Enter item name" defaultValue={editItem?.name} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cost_price" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Cost Price (Rs.)</Label>
                                        <Input id="cost_price" name="cost_price" className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20" type="number" step="0.01" placeholder="0.00" defaultValue={editItem?.cost_price} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="selling_price" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Selling Price (Rs.)</Label>
                                        <Input id="selling_price" name="selling_price" className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20 font-bold text-primary" type="number" step="0.01" placeholder="0.00" defaultValue={editItem?.selling_price} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="product_quantity" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Initial Stock</Label>
                                        <Input id="product_quantity" name="product_quantity" className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20" type="number" placeholder="0" defaultValue={editItem?.product_quantity} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="low_stock_bar" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Low Stock Limit</Label>
                                        <Input id="low_stock_bar" name="low_stock_bar" className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20" type="number" placeholder="0" defaultValue={editItem?.low_stock_bar} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Category</Label>
                                        <Select name="category" defaultValue={editItem?.category?.toString()}>
                                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()} className="rounded-xl my-1">{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-3 pb-2.5 pl-2">
                                        <Switch id="is_available" defaultChecked={editItem?.is_available ?? true} />
                                        <Label htmlFor="is_available" className="text-sm font-bold text-slate-600">Available</Label>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <Button type="button" variant="outline" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={submitting}>
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (editItem ? 'Update Item' : 'Add Item')}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* View Details Dialog (Mirrors Edit style) */}
                    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                        <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl overflow-hidden">
                            <DialogHeader className="pb-4 border-b">
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                                    <Info className="h-6 w-6 text-primary" />
                                    Item Details
                                </DialogTitle>
                            </DialogHeader>
                            {viewItem && (
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Item Name</Label>
                                        <div className="h-12 px-4 flex items-center text-lg font-bold rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                                            {viewItem.name}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Cost Price (Rs.)</Label>
                                            <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                                                {viewItem.cost_price}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Selling Price (Rs.)</Label>
                                            <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 font-bold text-primary">
                                                {viewItem.selling_price}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Current Stock</Label>
                                            <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                                                {viewItem.product_quantity}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Low Stock Limit</Label>
                                            <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                                                {viewItem.low_stock_bar}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 items-end">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Category</Label>
                                            <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold">
                                                {viewItem.category_name}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 pb-2.5 pl-2">
                                            <div className={`h-12 w-full px-4 flex items-center gap-2 rounded-2xl border border-slate-200 ${viewItem.is_available ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {viewItem.is_available ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                <span className="text-sm font-black uppercase">{viewItem.is_available ? 'Available' : 'Hidden'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 rounded-2xl font-bold"
                                            onClick={() => setIsViewDialogOpen(false)}
                                        >
                                            Close
                                        </Button>
                                        <Button
                                            className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
                                            onClick={() => {
                                                setEditItem(viewItem);
                                                setIsViewDialogOpen(false);
                                                setIsDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit this Item
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                <TabsContent value="items" className="space-y-4 mt-0">
                    <div className="space-y-4">
                        <div className="card-elevated p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search menu items..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <Button
                                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCategoryFilter('all')}
                                className="whitespace-nowrap rounded-full font-medium"
                            >
                                All
                            </Button>
                            {categories.map(cat => (
                                <Button
                                    key={cat.id}
                                    variant={categoryFilter === cat.name ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setCategoryFilter(cat.name)}
                                    className="whitespace-nowrap rounded-full font-medium"
                                >
                                    {cat.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setViewItem(item);
                                        setIsViewDialogOpen(true);
                                    }}
                                    className={`card-elevated p-4 transition-all hover:shadow-lg cursor-pointer active:scale-[0.98] group ${!item.is_available && 'opacity-60 grayscale-[0.5]'}`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-primary transition-colors">{item.name}</h3>
                                            <p className="text-[11px] uppercase font-black tracking-widest text-slate-400 mt-0.5">{item.category_name}</p>
                                        </div>
                                        <span className="text-xl font-black text-primary">Rs.{item.selling_price}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={item.is_available}
                                                onCheckedChange={() => handleToggleAvailability(item.id, item.is_available)}
                                            />
                                            <span className={`text-[11px] font-black uppercase ${item.is_available ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {item.is_available ? 'Available' : 'Hidden'}
                                            </span>
                                        </div>
                                        <div className="flex gap-0.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                                onClick={() => {
                                                    setEditItem(item);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && filteredItems.length === 0 && (
                        <div className="card-elevated py-20 text-center flex flex-col items-center justify-center bg-slate-50/50 border-dashed border-2">
                            <Package className="h-16 w-16 text-slate-200 mb-4" />
                            <p className="text-xl font-bold text-slate-900">No items found</p>
                            <p className="text-slate-500 mt-1">Try a different search or filter!</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="categories" className="space-y-6 mt-6">
                    <div className="card-elevated p-8 max-w-2xl mx-auto shadow-2xl rounded-[2.5rem]">
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
                            Manage Categories
                        </h2>
                        <div className="flex gap-3 mb-8">
                            <Input
                                placeholder="Enter new category name..."
                                value={newCategoryInput}
                                onChange={(e) => setNewCategoryInput(e.target.value)}
                                className="h-12 text-lg shadow-sm border-slate-200 focus:border-primary focus:ring-primary rounded-2xl"
                            />
                            <Button onClick={handleAddCategory} className="h-12 px-6 font-bold shadow-md hover:shadow-lg transition-all rounded-2xl">
                                <Plus className="h-5 w-5 mr-2" />
                                Add New
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                <div className="col-span-8">Category Name</div>
                                <div className="col-span-4 text-right pr-2">Actions</div>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                {categories.map((category) => (
                                    <div key={category.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all rounded-2xl border border-transparent group">
                                        <div className="col-span-8">
                                            {editingCategoryId === category.id ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={editingCategoryName}
                                                        onChange={(e) => setEditingCategoryName(e.target.value)}
                                                        className="h-10 text-lg rounded-xl focus:ring-primary"
                                                        autoFocus
                                                    />
                                                    <Button size="sm" onClick={() => handleUpdateCategory(category.id)} className="h-10 rounded-xl px-4">Save</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingCategoryId(null)} className="h-10 rounded-xl px-4">Cancel</Button>
                                                </div>
                                            ) : (
                                                <div className="font-bold text-slate-700 text-lg">{category.name}</div>
                                            )}
                                        </div>
                                        <div className="col-span-4 text-right flex justify-end gap-1">
                                            {editingCategoryId !== category.id && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-all rounded-xl h-10 w-10"
                                                        onClick={() => {
                                                            setEditingCategoryId(category.id);
                                                            setEditingCategoryName(category.name);
                                                        }}
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded-xl h-10 w-10"
                                                        onClick={() => handleDeleteCategory(category.id, category.name)}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <div className="py-12 text-center text-slate-400 font-medium">
                                        No categories added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
