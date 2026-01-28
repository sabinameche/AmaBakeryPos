import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, AlertTriangle, Package, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "../../api/index.js";

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
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: any) {
      toast.error("Failed to load products", { description: err.message });
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
    const payload = {
      name: formData.get("name"),
      cost_price: formData.get("cost_price"),
      selling_price: formData.get("selling_price"),
      product_quantity: parseInt(formData.get("product_quantity") as string),
      low_stock_bar: parseInt(formData.get("low_stock_bar") as string),
      category: parseInt(formData.get("category") as string),
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
      toast.error("Operation failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success("Product deleted");
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    }
  };

  const calculateProfit = (costPrice: string, sellingPrice: string) => {
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    const profit = selling - cost;
    const margin = ((profit / selling) * 100).toFixed(1);
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" placeholder="Enter product name" defaultValue={editProduct?.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_price">Cost Price (Rs.)</Label>
                  <Input id="cost_price" name="cost_price" type="number" step="0.01" placeholder="0.00" defaultValue={editProduct?.cost_price} required />
                </div>
                <div>
                  <Label htmlFor="selling_price">Selling Price (Rs.)</Label>
                  <Input id="selling_price" name="selling_price" type="number" step="0.01" placeholder="0.00" defaultValue={editProduct?.selling_price} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product_quantity">Current Stock</Label>
                  <Input id="product_quantity" name="product_quantity" type="number" placeholder="0" defaultValue={editProduct?.product_quantity} required />
                </div>
                <div>
                  <Label htmlFor="low_stock_bar">Low Stock Alert</Label>
                  <Input id="low_stock_bar" name="low_stock_bar" type="number" placeholder="0" defaultValue={editProduct?.low_stock_bar} required />
                </div>
              </div>
              <div>
                <Label htmlFor="category">Category ID</Label>
                <Input id="category" name="category" type="number" placeholder="Enter category ID" defaultValue={editProduct?.category} required />
                <p className="text-xs text-muted-foreground mt-1">Note: Category management will be added in future updates</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
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

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Low Stock Alert ({lowStockItems.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(product => (
              <span
                key={product.id}
                className="bg-destructive/20 text-destructive px-3 py-1 rounded-full text-sm font-medium"
              >
                {product.name}: {product.product_quantity} units
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card-elevated p-4 border-none shadow-sm bg-white mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="card-elevated overflow-hidden border-none shadow-sm bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Branch</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Pricing</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No products found</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLow = product.product_quantity <= product.low_stock_bar;
                    const { profit, margin } = calculateProfit(product.cost_price, product.selling_price);
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{product.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium uppercase text-[10px] tracking-wider">{product.category_name}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{product.branch_name}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 uppercase">Cost:</span>
                              <span className="font-bold text-slate-600">Rs.{product.cost_price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 uppercase">Sell:</span>
                              <span className="font-bold text-primary">Rs.{product.selling_price}</span>
                            </div>
                            <div className="text-[10px] text-green-600 font-bold">
                              +Rs.{profit.toFixed(2)} ({margin}%)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-700">{product.product_quantity} units</span>
                          <span className="text-[10px] text-slate-400 ml-2">(Min: {product.low_stock_bar})</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={isLow ? 'low' : 'ok'} className="border-none shadow-none font-black text-[10px]" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
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
                              className="text-destructive hover:text-destructive"
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
