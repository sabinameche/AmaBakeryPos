import { useState } from "react";
import { menuItems, MenuItem } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for Categories Management
  // Initialize with unique categories from mock data
  const [categories, setCategories] = useState<string[]>([...new Set(menuItems.map(item => item.category))].sort());
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleToggleAvailability = (itemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
    toast.success("Availability updated");
  };

  const handleDelete = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.success("Item deleted");
  };

  const handleAddCategory = () => {
    if (newCategoryInput.trim()) {
      if (!categories.includes(newCategoryInput.trim())) {
        const updatedCategories = [...categories, newCategoryInput.trim()].sort();
        setCategories(updatedCategories);
        setNewCategoryInput("");
        toast.success("Category added");
      } else {
        toast.error("Category already exists");
      }
    }
  };

  const handleDeleteCategory = (cat: string) => {
    // Check if category is in use
    const isInUse = items.some(item => item.category === cat);
    if (isInUse) {
      toast.error("Cannot delete category attached to existing items");
      return;
    }
    setCategories(prev => prev.filter(c => c !== cat));
    toast.success("Category deleted");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground">Manage your bakery items and categories</p>
        </div>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" placeholder="Enter item name" defaultValue={editItem?.name} />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input id="price" type="number" placeholder="0" defaultValue={editItem?.price} />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue={editItem?.category || categories[0]}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Available</Label>
                  <Switch id="available" defaultChecked={editItem?.available ?? true} />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => {
                    toast.success(editItem ? "Item updated" : "Item added");
                    setIsDialogOpen(false);
                    setEditItem(null);
                  }}>
                    {editItem ? 'Update' : 'Add'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="items" className="space-y-4 mt-0">

          {/* Filters */}
          <div className="space-y-4">
            <div className="card-elevated p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
                className="whitespace-nowrap rounded-full"
              >
                All
              </Button>
              {categories.sort().map(cat => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="whitespace-nowrap rounded-full"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`card-elevated p-4 ${!item.available && 'opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">₹{item.price}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.available}
                      onCheckedChange={() => handleToggleAvailability(item.id)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.available ? 'Available' : 'Out of stock'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
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
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="card-elevated py-12 text-center text-muted-foreground">
              No items found matching your criteria
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6 mt-6">
          <div className="card-elevated p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Manage Categories</h2>
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Enter new category name..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
              />
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                  <span className="font-medium">{category}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => handleDeleteCategory(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
