import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    Monitor,
    Coffee,
    Cake,
    Cookie,
    Pizza,
    Sandwich,
    Soup
} from "lucide-react";
import { menuItems, MenuItem, User as UserType } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CartItemData {
    item: MenuItem;
    quantity: number;
    notes?: string;
}

export default function CounterPOS() {
    const navigate = useNavigate();
    const [operator, setOperator] = useState<UserType | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("Bakery");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<CartItemData[]>([]);

    // Billing States
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr" | null>(null);
    const [cashReceived, setCashReceived] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Modals
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('currentUser');
        if (user) {
            setOperator(JSON.parse(user));
        } else {
            navigate('/counter');
        }
    }, [navigate]);

    const categories = useMemo(() =>
        ["All", ...new Set(menuItems.map(item => item.category))],
        []
    );

    const filteredItems = useMemo(() => {
        let items = menuItems;
        if (selectedCategory !== "All") {
            items = items.filter(item => item.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return items;
    }, [selectedCategory, searchQuery]);

    const subtotal = useMemo(() =>
        cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0),
        [cart]
    );

    const taxAmount = subtotal * 0.05;
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

    const processPayment = () => {
        if (!paymentMethod) {
            toast.error("Please select payment method");
            return;
        }
        if (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total)) {
            toast.error("Insufficient cash received");
            return;
        }

        setIsProcessing(true);
        // Simulate processing
        setTimeout(() => {
            setIsProcessing(false);
            setShowCheckoutModal(false);
            setShowSuccessModal(true);
            toast.success("Transaction completed successfully!");
        }, 1000);
    };

    const resetOrder = () => {
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setPaymentMethod(null);
        setCashReceived("");
        setShowSuccessModal(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        navigate('/');
    };

    return (
        <div className="h-screen bg-stone-50 flex flex-col overflow-hidden font-sans">
            {/* Top Header */}
            <header className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm bg-white p-0.5">
                        <img src="/logos/logo1white.jfif" alt="Ama Bakery" className="h-full w-full object-cover rounded-lg" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 leading-none">Ama Bakery</h1>
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
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl text-destructive hover:bg-destructive/5">
                        <LogOut className="h-5 w-5" />
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
                                className="pl-12 h-14 text-lg rounded-2xl border-2 focus:border-primary bg-white transition-all shadow-sm"
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
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="group flex flex-col bg-white rounded-[2rem] p-4 text-left border-2 border-transparent hover:border-primary transition-all hover:shadow-xl hover:shadow-primary/5 active:scale-95"
                                >
                                    <div className="w-full aspect-[4/3] bg-amber-50 rounded-[1.5rem] mb-4 flex items-center justify-center overflow-hidden border border-amber-100/50">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (() => {
                                            const Icons = [Cake, Coffee, Cookie, Pizza, Sandwich, Soup];
                                            const Icon = Icons[item.id.length % Icons.length];
                                            return <Icon className="h-12 w-12 text-primary/30 group-hover:scale-110 transition-transform duration-500" />;
                                        })()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{item.category}</p>
                                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{item.name}</h3>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-lg font-black text-slate-900">₹{item.price}</span>
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Plus className="h-4 w-4" />
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
                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">₹{cartItem.item.price} per unit</p>
                                        </div>
                                        <span className="font-black text-slate-900">₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden">
                                            <button
                                                onClick={() => updateQuantity(cartItem.item.id, -1)}
                                                className="p-1 px-2 hover:bg-slate-50 text-slate-500"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-8 text-center text-xs font-black text-slate-700">{cartItem.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(cartItem.item.id, 1)}
                                                className="p-1 px-2 hover:bg-slate-50 text-slate-500"
                                            >
                                                <Plus className="h-3 w-3" />
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
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium text-slate-500">
                                <span>Tax (5%)</span>
                                <span>₹{taxAmount.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-lg font-black text-slate-800">Total Amount</span>
                                <span className="text-3xl font-black text-primary">₹{total.toFixed(2)}</span>
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
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Customer (Optional)</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Name"
                                                className="pl-9 h-12 rounded-xl"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Phone"
                                                className="pl-9 h-12 rounded-xl"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
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
                                        <p className="text-2xl font-black text-slate-800">₹{total.toFixed(2)}</p>
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
                                            <p className="text-2xl font-black text-success">₹{(parseFloat(cashReceived) - total).toFixed(2)}</p>
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
                                        <p className="text-3xl font-black text-primary">₹{total.toFixed(2)}</p>
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
                            <span className="text-slate-800">₹{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-400 uppercase tracking-widest text-[9px]">Payment Method</span>
                            <span className="text-slate-800 uppercase text-[10px]">{paymentMethod}</span>
                        </div>
                        {paymentMethod === 'cash' && cashReceived && (
                            <div className="pt-3 border-t border-dashed border-slate-200">
                                <div className="flex justify-between text-sm font-black text-success">
                                    <span className="uppercase tracking-widest text-[9px]">Change Returned</span>
                                    <span>₹{(parseFloat(cashReceived) - total).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-14 rounded-2xl font-black" onClick={() => { setShowReceipt(true); setShowSuccessModal(false); }}>
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
                <DialogContent className="max-w-[400px] p-0 bg-transparent border-none shadow-none">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-3xl text-center space-y-6 relative overflow-hidden">
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
                                <span>Operator:</span>
                                <span>{operator?.name}</span>
                            </div>
                        </div>

                        <Separator className="border-dashed" />

                        <div className="space-y-2">
                            {cart.map((ci, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-left flex-1 font-medium">{ci.item.name} x {ci.quantity}</span>
                                    <span className="font-bold">₹{(ci.item.price * ci.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <Separator className="border-dashed" />

                        <div className="space-y-1 text-lg">
                            <div className="flex justify-between font-black">
                                <span className="text-slate-400">Total</span>
                                <span className="text-primary text-2xl">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="pt-8 flex gap-3">
                            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => { setShowReceipt(false); resetOrder(); }}>Close</Button>
                            <Button className="flex-1 rounded-xl gradient-warm" onClick={() => window.print()}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
