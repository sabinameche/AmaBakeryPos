import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MenuItemCard } from "@/components/waiter/MenuItemCard";
import { CartItem } from "@/components/waiter/CartItem";
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav";
import { menuItems, MenuItem } from "@/lib/mockData";
import { getTableOrder, saveTableOrder } from "@/lib/orderStorage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Send, Check, Search, X, Receipt } from "lucide-react";
import { toast } from "sonner";

interface CartItemData {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export default function OrderEntry() {
  const navigate = useNavigate();
  const { tableNumber } = useParams();
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('group');

  const [selectedCategory, setSelectedCategory] = useState("Bakery");
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load existing order when component mounts - Disabled as requested
  /*
  useEffect(() => {
    if (tableNumber) {
      const existingOrder = getTableOrder(tableNumber, groupName || undefined);
      if (existingOrder && existingOrder.cart.length > 0) {
        setCart(existingOrder.cart);
        toast.info("Existing order loaded", {
          description: `${existingOrder.cart.length} items in cart`,
        });
      }
    }
  }, [tableNumber, groupName]);
  */

  // Save cart to storage whenever it changes
  useEffect(() => {
    if (tableNumber && cart.length > 0) {
      saveTableOrder(tableNumber, groupName || undefined, cart);
    }
  }, [cart, tableNumber, groupName]);

  const categories = useMemo(() =>
    [...new Set(menuItems.map(item => item.category))],
    []
  );

  const filteredItems = useMemo(() => {
    let items = menuItems.filter(item => item.category === selectedCategory);

    if (searchQuery.trim()) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [selectedCategory, searchQuery]);

  const cartTotal = useMemo(() =>
    cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0),
    [cart]
  );

  const cartCount = useMemo(() =>
    cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart]
  );

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(c => c.item.id === itemId);
    return cartItem?.quantity || 0;
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.item.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing && existing.quantity > 1) {
        return prev.map(c =>
          c.item.id === item.id
            ? { ...c, quantity: c.quantity - 1 }
            : c
        );
      }
      return prev.filter(c => c.item.id !== item.id);
    });
  };

  const setQuantity = (item: MenuItem, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (quantity <= 0) {
        return prev.filter(c => c.item.id !== item.id);
      }
      if (existing) {
        return prev.map(c =>
          c.item.id === item.id
            ? { ...c, quantity }
            : c
        );
      }
      return [...prev, { item, quantity }];
    });
  };

  const deleteFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const updateNotes = (itemId: string, notes: string) => {
    setCart(prev => prev.map(c =>
      c.item.id === itemId ? { ...c, notes } : c
    ));
  };

  const handleSendOrder = () => {
    setIsCartOpen(false);
    proceedToCheckout();
  };

  const proceedToCheckout = () => {
    navigate('/waiter/checkout', {
      state: {
        cart,
        tableNumber,
        groupName,
      }
    });
  };

  const continueOrdering = () => {
    setShowConfirmDialog(false);
    toast.success("Order sent to kitchen!", {
      description: "You can continue adding more items.",
      icon: <Send className="h-5 w-5 text-success" />
    });
    // Optional: Reset cart locally if you want "Continue" to mean "Fresh Order for same group"
    // But usually in POS "Continue" means "Stay on current table view"
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader
        title={`Table ${tableNumber}${groupName ? ` • ${groupName}` : ''}`}
        showBack
        showNotification={false}
      />

      {/* Search Bar */}
      <div className="sticky top-[60px] z-50 glass-panel border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 text-base bg-background/50 border-border/50 focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-[120px] z-40 glass-panel border-b px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              size="sm"
              className="shrink-0"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <main className="p-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try searching with different keywords</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              quantity={getItemQuantity(item.id)}
              onAdd={addToCart}
              onRemove={removeFromCart}
              onSetQuantity={setQuantity}
            />
          ))
        )}
      </main>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Your Order
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-50" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add items from the menu</p>
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-3 max-h-[calc(80vh-200px)] overflow-y-auto">
                {cart.map((cartItem) => (
                  <CartItem
                    key={cartItem.item.id}
                    item={cartItem.item}
                    quantity={cartItem.quantity}
                    notes={cartItem.notes}
                    onAdd={() => addToCart(cartItem.item)}
                    onRemove={() => removeFromCart(cartItem.item)}
                    onDelete={() => deleteFromCart(cartItem.item.id)}
                    onNotesChange={(notes) => updateNotes(cartItem.item.id, notes)}
                  />
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{cartTotal}</span>
                </div>
                <Button
                  className="w-full btn-touch gradient-warm"
                  onClick={handleSendOrder}
                  disabled={orderSent}
                >
                  {orderSent ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Order Sent!
                    </>
                  ) : (
                    <>
                      <Receipt className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation Modal - Added as requested */}


      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <Button
            className="w-full btn-touch gradient-warm shadow-warm-lg flex items-center justify-between px-6"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-card text-primary text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              </div>
              <span>View Cart</span>
            </div>
            <span className="font-bold">₹{cartTotal}</span>
          </Button>
        </div>
      )}

      {/* Bottom Navigation */}
      <WaiterBottomNav />
    </div>
  );
}
