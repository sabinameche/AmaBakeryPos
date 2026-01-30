import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Info,
  CheckCircle2,
  XCircle,
  Store,
  Calendar,
  Tag,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCategories } from "../../api/index.js";

interface Product {
  id: number;
  name: string;
  cost_price: string;
  selling_price: string;
  product_quantity: number;
  low_stock_bar: number;
  category: number;
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

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const lowStockItems = products.filter(product => product.product_quantity <= product.low_stock_bar);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === editProduct.id ? updated : p));
        toast.success("Product updated");
      } else {
        const newProduct = await createProduct(payload);
        setProducts(prev => [...prev, newProduct]);
        toast.success("Product added");
      }
      setIsDialogOpen(false);
      setEditProduct(null);
    } catch (err: any) {
      console.error("Product operation error:", err);
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const data = await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success(data.message || "Product deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const calculateProfit = (costPrice: string, sellingPrice: string) => {
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    const profit = selling - cost;
    const margin = selling > 0 ? ((profit / selling) * 100).toFixed(1) : "0.0";
    return { profit, margin };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Track and manage product stock levels</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditProduct(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Product Name</Label>
                <Input id="name" name="name" className="h-12 text-lg rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20" placeholder="Enter product name" defaultValue={editProduct?.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Cost Price (Rs.)</Label>
                  <Input id="cost_price" name="cost_price" className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20" type="number" step="0.01" placeholder="0.00" defaultValue={editProduct?.cost_price} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Selling Price (Rs.)</Label>
                  <Input id="selling_price" name="selling_price" className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20 font-bold text-primary" type="number" step="0.01" placeholder="0.00" defaultValue={editProduct?.selling_price} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_quantity" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Current Stock</Label>
                  <Input id="product_quantity" name="product_quantity" className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20" type="number" placeholder="0" defaultValue={editProduct?.product_quantity} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low_stock_bar" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Low Stock Limit</Label>
                  <Input id="low_stock_bar" name="low_stock_bar" className="h-12 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary/20" type="number" placeholder="0" defaultValue={editProduct?.low_stock_bar} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Category</Label>
                  <Select name="category" defaultValue={editProduct?.category?.toString()}>
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
                  <Switch id="is_available" defaultChecked={editProduct?.is_available ?? true} />
                  <Label htmlFor="is_available" className="text-sm font-bold text-slate-600">Available for Sale</Label>
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl font-bold"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editProduct ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editProduct ? 'Update Product' : 'Add Product'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert Banner (User Style) */}
      {lowStockItems.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Low Stock Alert ({lowStockItems.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(product => (
              <span
                key={product.id}
                className="bg-destructive/20 text-destructive px-3 py-1 rounded-full text-sm font-medium border border-destructive/20"
              >
                {product.name}: {product.product_quantity} units
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View Details Dialog (Mirrors Edit style) */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              Product Details
            </DialogTitle>
          </DialogHeader>
          {viewProduct && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Product Name</Label>
                <div className="h-12 px-4 flex items-center text-lg font-bold rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                  {viewProduct.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Cost Price (Rs.)</Label>
                  <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                    {viewProduct.cost_price}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Selling Price (Rs.)</Label>
                  <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 font-bold text-primary">
                    {viewProduct.selling_price}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Current Stock</Label>
                  <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold">
                    {viewProduct.product_quantity}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Low Stock Limit</Label>
                  <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                    {viewProduct.low_stock_bar}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Category</Label>
                  <div className="h-12 px-4 flex items-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold">
                    {viewProduct.category_name}
                  </div>
                </div>
                <div className="flex items-center space-x-3 pb-2.5 pl-2">
                  <div className={`h-12 w-full px-4 flex items-center gap-2 rounded-2xl border border-slate-200 ${viewProduct.is_available ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {viewProduct.is_available ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span className="text-sm font-black uppercase">{viewProduct.is_available ? 'Available for Sale' : 'Hidden from Menu'}</span>
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
                    setEditProduct(viewProduct);
                    setIsViewDialogOpen(false);
                    setIsDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search (User Style) */}
      <div className="card-elevated p-4 border-none shadow-sm bg-white mb-6 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border border-slate-200 bg-white rounded-lg focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Products Table (User Style merged with backend logic) */}
      <div className="card-elevated overflow-hidden border-none shadow-sm bg-white rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Price (Rs.)</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 opacity-20" />
                        <p className="font-medium">No products found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLow = product.product_quantity <= product.low_stock_bar;
                    const { profit, margin } = calculateProfit(product.cost_price, product.selling_price);

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          setViewProduct(product);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{product.name}</span>
                          {!product.is_available && (
                            <Badge variant="outline" className="ml-2 text-[8px] font-black uppercase text-slate-400 border-slate-200">Hidden</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium uppercase text-[10px] tracking-wider">
                          {product.category_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary">Rs.{product.selling_price}</span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>
                            {product.product_quantity} units
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2">(Min: {product.low_stock_bar})</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={isLow ? 'low' : 'ok'} className="border-none shadow-none font-black text-[10px]" />
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-slate-900"
                              onClick={() => {
                                setViewProduct(product);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-primary"
                              onClick={() => {
                                setEditProduct(product);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
