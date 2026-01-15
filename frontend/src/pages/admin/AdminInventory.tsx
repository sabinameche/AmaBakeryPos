import { useState } from "react";
import { inventoryItems } from "@/lib/mockData";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  category: string;
}

export default function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustmentItem, setAdjustmentItem] = useState<InventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");

  const lowStockItems = items.filter(item => item.stock <= item.minStock);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustStock = () => {
    if (adjustmentItem && adjustmentAmount) {
      const newStock = parseInt(adjustmentAmount);
      setItems(prev => prev.map(item =>
        item.id === adjustmentItem.id
          ? { ...item, stock: newStock }
          : item
      ));
      toast.success(`Stock updated: ${adjustmentItem.name} → ${newStock} ${adjustmentItem.unit}`);
      setAdjustmentItem(null);
      setAdjustmentAmount("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Track and manage stock levels</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" placeholder="Enter item name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input id="stock" type="number" placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" placeholder="kg, L, pcs" />
                </div>
              </div>
              <div>
                <Label htmlFor="minStock">Minimum Stock Alert</Label>
                <Input id="minStock" type="number" placeholder="0" />
              </div>
              <Button type="button" className="w-full" onClick={() => toast.success("Item added")}>
                Add Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Low Stock Alert</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <span
                key={item.id}
                className="bg-destructive/20 text-destructive px-3 py-1 rounded-full text-sm font-medium"
              >
                {item.name}: {item.stock} {item.unit}
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
            placeholder="Search finished goods stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card-elevated overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Item</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Category</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Stock Status</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Current Stock</th>
                <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium uppercase text-[10px] tracking-wider">{item.category}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={isLow ? 'low' : 'ok'} className="border-none shadow-none font-black text-[10px]" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{item.stock} {item.unit}</span>
                      <span className="text-[10px] text-slate-400 ml-2">(Min: {item.minStock})</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded">Planning</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Dialog */}
      <Dialog open={!!adjustmentItem} onOpenChange={() => setAdjustmentItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock: {adjustmentItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Stock</Label>
              <p className="text-2xl font-bold text-primary">
                {adjustmentItem?.stock} {adjustmentItem?.unit}
              </p>
            </div>
            <div>
              <Label htmlFor="newStock">New Stock Level</Label>
              <Input
                id="newStock"
                type="number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="Enter new stock"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAdjustmentItem(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAdjustStock}>
                Update Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
