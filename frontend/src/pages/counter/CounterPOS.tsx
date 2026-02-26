import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    User,
    Phone,
    CreditCard,
    Banknote,
    QrCode,
    Receipt,
    LogOut,
    Clock,
    Printer,
    X,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Monitor,
    Coffee,
    Cake,
    Cookie,
    Pizza,
    Sandwich,
    Soup,
    Pencil,
    LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logout, getCurrentUser } from "../../auth/auth";
import { CustomerSelector } from "@/components/pos/CustomerSelector";
import { fetchProducts, fetchCategories, createInvoice, fetchInvoices } from "@/api/index.js";
import { MenuItem, User as UserType } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";


interface CartItemData {
    item: MenuItem;
    quantity: number;
    notes?: string;
}

export default function CounterPOS() {
    const navigate = useNavigate();
    const location = useLocation();
    const [operator, setOperator] = useState<UserType | null>(null);
    const [products, setProducts] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<CartItemData[]>([]);
    const [taxEnabled, setTaxEnabled] = useState(false);
    const [taxRate, setTaxRate] = useState(5);

    // Billing States
    const [customer, setCustomer] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr" | null>(null);
    const [cashReceived, setCashReceived] = useState("");
    const [paidAmount, setPaidAmount] = useState(0);
    const [dueAmount, setDueAmount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Modals
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [autoPrint, setAutoPrint] = useState(false);
    const [showQtyDialog, setShowQtyDialog] = useState(false);
    const [qtyEditItem, setQtyEditItem] = useState<CartItemData | null>(null);
    const [qtyInput, setQtyInput] = useState("");

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setOperator(user as any);
            loadData();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);

            const mappedProducts: any[] = productsData.map((p: any) => ({
                id: p.id.toString(),
                name: p.name,
                price: parseFloat(p.selling_price),
                category: p.category_name,
                available: p.is_available,
                image: p.image || undefined
            }));

            setProducts(mappedProducts);
            const categoryNames = ["All", ...categoriesData.map((cat: any) => cat.name).sort()];
            setCategories(categoryNames);
            setSelectedCategory("All");
        } catch (err: any) {
            toast.error("Failed to load POS data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showQtyDialog) return;

            if (/^[0-9]$/.test(e.key)) {
                setQtyInput(prev => (prev.length < 3 ? prev + e.key : prev));
            } else if (e.key === "Backspace") {
                setQtyInput(prev => prev.slice(0, -1));
            } else if (e.key === "Enter") {
                handleQtySubmit();
            } else if (e.key === "Escape") {
                setShowQtyDialog(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showQtyDialog, qtyInput, qtyEditItem]);

    useEffect(() => {
        if (showReceipt && autoPrint) {
            const timer = setTimeout(() => {
                window.print();
                setAutoPrint(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [showReceipt, autoPrint]);

    // Handle loading specific order if passed via state
    useEffect(() => {
        if (location.state?.orderId && products.length > 0) {
            loadSpecificOrder(location.state.orderId);
        }
    }, [location.state?.orderId, products]);

    const loadSpecificOrder = async (orderId: number) => {
        try {
            const data = await fetchInvoices();
            if (Array.isArray(data)) {
                const order = data.find((inv: any) => inv.id === orderId);
                if (order) {
                    const mappedItems = order.items.map((item: any) => ({
                        item: products.find(p => p.id === item.product) || {
                            id: item.product,
                            name: item.product_name || `Product #${item.product}`,
                            price: parseFloat(item.unit_price),
                            category: "Unknown",
                            available: true
                        },
                        quantity: item.quantity
                    }));
                    setCart(mappedItems);
                    setCustomer(order.customer ? { id: order.customer, name: order.customer_name } : null);
                    setTaxEnabled(parseFloat(order.tax_amount) > 0);
                    // Estimate tax rate if possible
                    const sub = order.items.reduce((sum: number, i: any) => sum + (parseFloat(i.unit_price) * i.quantity), 0);
                    if (sub > 0) {
                        setTaxRate(Math.round((parseFloat(order.tax_amount) / sub) * 100));
                    }
                    setPaidAmount(parseFloat(order.paid_amount || 0));
                    setDueAmount(parseFloat(order.due_amount || 0));
                    setShowReceipt(true);

                    // Auto print if requested
                    if (location.state?.autoPrint) {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    }

                    // Clear state so it doesn't reload on every render
                    window.history.replaceState({}, document.title);
                }
            }
        } catch (err) {
            console.error("Failed to load specific order", err);
            toast.error("Failed to load order for printing");
        }
    };


    const filteredItems = useMemo(() => {
        let items = products;
        if (selectedCategory !== "All") {
            items = items.filter(item => item.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return items;
    }, [products, selectedCategory, searchQuery]);

    const subtotal = useMemo(() =>
        cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0),
        [cart]
    );

    const taxAmount = useMemo(() =>
        taxEnabled ? subtotal * (taxRate / 100) : 0,
        [subtotal, taxEnabled, taxRate]
    );
    const total = subtotal + taxAmount;

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(c => c.item.id === item.id);
            if (existing) {
                return prev.map(c =>
                    c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [...prev, { item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => prev.map(c => {
            if (c.item.id === itemId) {
                const newQty = Math.max(0, c.quantity + delta);
                return { ...c, quantity: newQty };
            }
            return c;
        }).filter(c => c.quantity > 0));
    };

    const setQuantity = (itemId: string, amount: number) => {
        setCart(prev => prev.map(c => {
            if (c.item.id === itemId) {
                return { ...c, quantity: Math.max(0, amount) };
            }
            return c;
        }).filter(c => c.quantity > 0));
    };

    const handleQtyEditOpen = (item: CartItemData) => {
        setQtyEditItem(item);
        setQtyInput("");
        setShowQtyDialog(true);
    };

    const handleQtySubmit = () => {
        if (qtyEditItem && qtyInput) {
            setQuantity(qtyEditItem.item.id, parseInt(qtyInput));
        }
        setShowQtyDialog(false);
        setQtyEditItem(null);
        setQtyInput("");
    };

    const deleteFromCart = (itemId: string) => {
        setCart(prev => prev.filter(c => c.item.id !== itemId));
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        setShowCheckoutModal(true);
    };

    const processPayment = async () => {
        if (!paymentMethod) {
            toast.error("Please select payment method");
            return;
        }
        if (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total)) {
            toast.error("Insufficient cash received");
            return;
        }

        setIsProcessing(true);
        const user = getCurrentUser();

        try {
            const invoiceData = {
                branch: user?.branch_id,
                customer: customer?.id || null,
                invoice_type: "SALE",
                description: "Counter Sale",
                tax_amount: taxAmount,
                discount: 0,
                paid_amount: total,
                items: cart.map(c => ({
                    item_type: "PRODUCT",
                    product: parseInt(c.item.id),
                    quantity: c.quantity,
                    unit_price: c.item.price,
                    discount_amount: 0
                }))
            };

            await createInvoice(invoiceData);

            setIsProcessing(false);
            setShowCheckoutModal(false);
            setShowSuccessModal(true);
            toast.success("Transaction completed successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to process payment");
            setIsProcessing(false);
        }
    };

    const resetOrder = () => {
        setCart([]);
        setCustomer(null);
        setPaymentMethod(null);
        setCashReceived("");
        setShowSuccessModal(false);
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="h-screen bg-stone-50 flex flex-col overflow-hidden font-sans">
            {/* Top Header */}
            <header className="h-16 bg-white border-b px-6 pr-14 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-4">
                    {(operator?.role === "ADMIN" || operator?.role === "BRANCH_MANAGER" || operator?.role === "SUPER_ADMIN") && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/admin/dashboard')}
                            className="mr-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5"
                            title="Back to Admin Dashboard"
                        >
                            <LayoutDashboard className="h-6 w-6" />
                        </Button>
                    )}
                    <div className="h-12 w-12 rounded-full flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm bg-white p-0.5">
                        <img src="/logos/logo1white.jfif" alt="AMA BAKERY" className="h-full w-full object-cover rounded-full" />
                    </div>
                    <div>
                        <h1 className="text-xl font-rockwell font-bold text-slate-800 leading-none">AMA BAKERY</h1>
                        <p className="text-[10px] font-bold text-primary tracking-widest uppercase mt-1">Counter POS Terminal</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-black text-slate-700">{operator?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{operator?.role}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <Button variant="ghost" size="icon" onClick={() => navigate('/counter/orders')} className="rounded-xl hover:bg-slate-100">
                        <Clock className="h-5 w-5 text-slate-500" />
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden">

                {/* Left Side: Menu Selection */}
                <section className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
                    {/* Search & Categories */}
                    <div className="flex flex-col gap-4 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search by product name or scan barcode..."
                                className="pl-12 h-14 text-lg rounded-2xl border-2 border-slate-200 focus:border-primary bg-white transition-all shadow-sm focus:shadow-md"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl overflow-x-auto">
                            {categories.map(cat => (
                                <Button
                                    key={cat}
                                    variant={selectedCategory === cat ? "default" : "ghost"}
                                    className={cn(
                                        "rounded-xl px-6 h-11 font-bold whitespace-nowrap transition-all",
                                        selectedCategory === cat ? "shadow-md" : "text-slate-500 hover:text-primary"
                                    )}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto pt-2 pb-10 px-2 custom-scrollbar -ml-2 -mr-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="group flex flex-col justify-between bg-white rounded-[1.5rem] p-5 text-left border-2 border-slate-200 hover:border-primary hover:bg-orange-50/50 hover:-translate-y-1 transition-all hover:shadow-2xl hover:shadow-primary/10 active:scale-95 min-h-[140px]"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-lg bg-primary/5 flex items-center justify-center">
                                                {(() => {
                                                    const Icons = [Cake, Coffee, Cookie, Pizza, Sandwich, Soup];
                                                    const Icon = Icons[item.id.length % Icons.length];
                                                    return <Icon className="h-3.5 w-3.5 text-primary/40" />;
                                                })()}
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">{item.category}</p>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-sm md:text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                                    </div>
                                    <div className="mt-4 flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Price</span>
                                            <span className="text-xl font-black text-slate-900 leading-none">Rs.{item.price}</span>
                                        </div>
                                        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all group-hover:rotate-6 group-hover:scale-110">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Right Side: Cart & Billing */}
                <aside className="w-[420px] bg-white border-l flex flex-col shadow-2xl z-20">
                    <div className="p-6 border-b shrink-0 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="h-6 w-6 text-primary" />
                            <h2 className="font-black text-slate-800 text-lg">Current Order</h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCart([])}
                            className="text-xs font-bold text-destructive hover:bg-destructive/5 rounded-lg"
                            disabled={cart.length === 0}
                        >
                            Clear All
                        </Button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60 px-8 text-center">
                                <div className="h-20 w-20 rounded-full bg-slate-50 mb-4 flex items-center justify-center">
                                    <ShoppingCart className="h-10 w-10" />
                                </div>
                                <p className="font-bold text-lg">Your cart is empty</p>
                                <p className="text-sm">Click on items to add them to the bill</p>
                            </div>
                        ) : (
                            cart.map(cartItem => (
                                <div key={cartItem.item.id} className="group bg-slate-50 rounded-2xl p-3 border border-slate-100 hover:border-primary/20 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="max-w-[180px]">
                                            <h4 className="font-bold text-sm text-slate-800 leading-tight">{cartItem.item.name}</h4>
                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">Rs.{cartItem.item.price} per unit</p>
                                        </div>
                                        <span className="font-black text-slate-900">Rs.{(cartItem.item.price * cartItem.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden h-8">
                                                <button
                                                    onClick={() => updateQuantity(cartItem.item.id, -1)}
                                                    className="p-1 px-2 hover:bg-slate-50 text-slate-500"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-xs font-black text-slate-700">
                                                    {cartItem.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(cartItem.item.id, 1)}
                                                    className="p-1 px-2 hover:bg-slate-50 text-slate-500"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleQtyEditOpen(cartItem)}
                                                className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90"
                                                title="Edit quantity"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => deleteFromCart(cartItem.item.id)}
                                            className="text-slate-300 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals & Actions */}
                    <div className="p-6 bg-slate-50 border-t space-y-4 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium text-slate-500">
                                <span>Subtotal</span>
                                <span>Rs.{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col gap-2 py-2">
                                {taxEnabled && (
                                    <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span>Tax</span>
                                            <Switch
                                                checked={taxEnabled}
                                                onCheckedChange={setTaxEnabled}
                                                className="scale-75 data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-white rounded-lg px-2 border w-20">
                                                <Input
                                                    type="number"
                                                    value={taxRate}
                                                    onChange={(e) => setTaxRate(Number(e.target.value))}
                                                    className="w-12 h-7 p-0 text-center border-none bg-transparent text-xs font-bold focus-visible:ring-0"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400">%</span>
                                            </div>
                                            <span className="font-bold text-slate-700">Rs.{taxAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                {!taxEnabled && (
                                    <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span>Tax</span>
                                            <Switch
                                                checked={taxEnabled}
                                                onCheckedChange={setTaxEnabled}
                                                className="scale-75"
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-slate-300">Disabled</span>
                                    </div>
                                )}
                                {taxEnabled && (
                                    <div className="flex gap-1 justify-end animate-in fade-in slide-in-from-top-1">
                                        {[5, 10, 15].map((rate) => (
                                            <button
                                                key={rate}
                                                onClick={() => setTaxRate(rate)}
                                                className={cn(
                                                    "px-2 py-1 rounded text-[10px] font-bold transition-all",
                                                    taxRate === rate
                                                        ? "bg-primary text-white shadow-sm"
                                                        : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                                                )}
                                            >
                                                {rate}%
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-lg font-black text-slate-800">Total Amount</span>
                                <span className="text-3xl font-black text-primary">Rs.{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 gradient-warm transition-all active:scale-95"
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                        >
                            <Receipt className="h-6 w-6 mr-3" />
                            Checkout & Bill
                        </Button>
                    </div>
                </aside>
            </main>

            {/* Checkout Dialog */}
            <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
                <DialogContent className="max-w-[700px] p-0 overflow-hidden border-none shadow-3xl rounded-[2.5rem]">
                    <div className="flex h-[500px]">
                        {/* Checkout Info */}
                        <div className="flex-1 p-10 space-y-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 mb-2">Checkout</h2>
                                <p className="text-sm text-slate-400 font-medium">Finalize the order and take payment</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Customer </Label>
                                    <CustomerSelector
                                        selectedCustomerId={customer?.id}
                                        onSelect={(c) => setCustomer(c)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Method</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setPaymentMethod('cash')}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-2",
                                                paymentMethod === 'cash' ? "border-primary bg-primary/5 shadow-inner" : "border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <Banknote className={cn("h-8 w-8", paymentMethod === 'cash' ? "text-primary" : "text-slate-300")} />
                                            <span className={cn("text-xs font-black uppercase", paymentMethod === 'cash' ? "text-primary" : "text-slate-400")}>Cash</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('qr')}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-2",
                                                paymentMethod === 'qr' ? "border-primary bg-primary/5 shadow-inner" : "border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <QrCode className={cn("h-8 w-8", paymentMethod === 'qr' ? "text-primary" : "text-slate-300")} />
                                            <span className={cn("text-xs font-black uppercase", paymentMethod === 'qr' ? "text-primary" : "text-slate-400")}>QR Payment</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Processing */}
                        <div className="w-[300px] bg-slate-50 border-l p-8 flex flex-col justify-between">
                            {paymentMethod === 'cash' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Cash Details</Label>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Payable</p>
                                        <p className="text-2xl font-black text-slate-800">Rs.{total.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-slate-400 font-bold uppercase">Amount Received</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="h-14 text-2xl font-black text-center border-2 border-primary/20 focus:border-primary"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    {cashReceived && parseFloat(cashReceived) >= total && (
                                        <div className="bg-success/10 p-4 rounded-2xl border border-success/20 animate-in zoom-in-95">
                                            <p className="text-[10px] uppercase font-black text-success/60">Change to return</p>
                                            <p className="text-2xl font-black text-success">Rs.{(parseFloat(cashReceived) - total).toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>
                            ) : paymentMethod === 'qr' ? (
                                <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-right-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Scan QR Code</Label>
                                    <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 w-full aspect-square flex items-center justify-center">
                                        <QrCode className="h-40 w-40 text-slate-800" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total Payable</p>
                                        <p className="text-3xl font-black text-primary">Rs.{total.toFixed(2)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <CreditCard className="h-12 w-12 mb-4 text-slate-300" />
                                    <p className="text-sm font-bold text-slate-400 px-4">Select a payment method to continue</p>
                                </div>
                            )}

                            <Button
                                className="w-full h-14 rounded-2xl font-black text-lg gradient-warm"
                                disabled={!paymentMethod || isProcessing}
                                onClick={processPayment}
                            >
                                {isProcessing ? (
                                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 mr-2" />
                                        Finish Order
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="max-w-[400px] p-8 text-center space-y-6 rounded-[2.5rem] border-none shadow-3xl">
                    <div className="h-24 w-24 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success border-4 border-success/5 animate-in zoom-in-75 duration-500">
                        <CheckCircle2 className="h-12 w-12 stroke-[3px]" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-800">Paid & Confirmed</h2>
                        <p className="text-slate-400 font-medium">Order has been successfully processed</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-400 uppercase tracking-widest text-[9px]">Total Amount</span>
                            <span className="text-slate-800">Rs.{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-400 uppercase tracking-widest text-[9px]">Payment Method</span>
                            <span className="text-slate-800 uppercase text-[10px]">{paymentMethod}</span>
                        </div>
                        {paymentMethod === 'cash' && cashReceived && (
                            <div className="pt-3 border-t border-dashed border-slate-200">
                                <div className="flex justify-between text-sm font-black text-success">
                                    <span className="uppercase tracking-widest text-[9px]">Change Returned</span>
                                    <span>Rs.{(parseFloat(cashReceived) - total).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-14 rounded-2xl font-black" onClick={() => { setAutoPrint(true); setShowReceipt(true); setShowSuccessModal(false); }}>
                            <Printer className="h-5 w-5 mr-2" />
                            Print Bill
                        </Button>
                        <Button className="h-14 rounded-2xl font-black gradient-warm" onClick={resetOrder}>
                            New Order
                            <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Receipt View logic would go here, similar to Checkout.tsx but adapted for desktop */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-[400px] p-0 bg-transparent border-none shadow-none no-print-close">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-3xl text-center space-y-6 relative overflow-hidden printable-receipt">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />

                        <div className="space-y-4">
                            <div className="h-20 w-20 mx-auto rounded-2xl border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                                <img src="/logos/logo1white.jfif" className="h-full w-full object-cover" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-black tracking-tight text-primary">AMA BAKERY</h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fresh & Daily Bakery</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2 text-left font-mono text-xs">
                            <div className="flex justify-between">
                                <span>Receipt:</span>
                                <span>#POS-{Date.now().toString().slice(-6)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{new Date().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Customer:</span>
                                <span className="truncate ml-4">{customer?.name || "Walk-in"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Operator:</span>
                                <span>{operator?.name}</span>
                            </div>
                        </div>

                        <Separator className="border-dashed" />

                        <div className="space-y-2">
                            {cart.map((ci, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-left flex-1 font-medium">{ci.item.name} x {ci.quantity}</span>
                                    <span className="font-bold">Rs.{(ci.item.price * ci.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <Separator className="border-dashed" />

                        <div className="space-y-1 text-lg">
                            <div className="flex justify-between font-black">
                                <span className="text-slate-400">Total</span>
                                <span className="text-primary text-2xl">Rs.{total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1 border-t border-dashed mt-2">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Paid Amount</span>
                                <span className="font-bold">Rs.{paidAmount > 0 ? paidAmount.toFixed(2) : parseFloat(cashReceived || "0").toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">

                                {dueAmount > 0 && (
                                    <>
                                        <span className="text-slate-400 font-bold uppercase text-[10px]">Balance Due</span>
                                        <span className="font-bold text-primary">Rs.{dueAmount.toFixed(2)}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 flex gap-3 no-print">
                            <Button className="flex-1 h-14 rounded-2xl font-black gradient-warm shadow-lg" onClick={() => window.print()}>
                                <Printer className="h-5 w-5 mr-2" />
                                Print Bill
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quantity Edit Dialog */}
            <Dialog open={showQtyDialog} onOpenChange={setShowQtyDialog}>
                <DialogContent className="max-w-[320px] p-6 rounded-[2rem] border-none shadow-3xl">
                    <div className="text-center space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-800 line-clamp-1">{qtyEditItem?.item.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter Quantity</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-primary/20">
                            <span className="text-4xl font-black text-primary">
                                {qtyInput || cart.find(c => c.item.id === qtyEditItem?.item.id)?.quantity || "0"}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((key) => (
                                <Button
                                    key={key.toString()}
                                    variant={key === "OK" ? "default" : "secondary"}
                                    className={cn(
                                        "h-12 text-lg font-black rounded-xl transition-all active:scale-90",
                                        key === "OK" ? "gradient-warm col-span-1" : "bg-white border hover:bg-slate-50 shadow-sm",
                                        key === "C" ? "text-destructive" : ""
                                    )}
                                    onClick={() => {
                                        if (key === "OK") handleQtySubmit();
                                        else if (key === "C") setQtyInput("");
                                        else setQtyInput(prev => (prev.length < 3 ? prev + key : prev));
                                    }}
                                >
                                    {key}
                                </Button>
                            ))}
                        </div>

                        <div className="pt-2 flex items-center justify-center gap-2 opacity-40">
                            <Monitor className="h-3 w-3 text-slate-400" />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Keyboard Numpad Enabled</span>
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full text-xs font-bold text-slate-400 mt-2"
                            onClick={() => setShowQtyDialog(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
