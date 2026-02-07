import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Search,
    Clock,
    CheckCircle2,
    Printer,
    MoreHorizontal,
    Monitor,
    Calendar,
    Filter,
    Loader2,
    Banknote,
    QrCode,
    CreditCard,
    ShoppingBag,
    FileText,
    Check
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { format, parseISO } from "date-fns";
import { fetchInvoices, addPayment, fetchProducts } from "@/api/index.js";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function CounterOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Payment States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "ONLINE" | "QR">("CASH");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [isPaying, setIsPaying] = useState(false);
    const [productsMap, setProductsMap] = useState<Record<string, any>>({});
    const [activeTab, setActiveTab] = useState<"payment" | "items">("payment");
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadInvoices();
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await fetchProducts();
            if (!Array.isArray(data)) {
                console.warn("fetchProducts returned non-array:", data);
                setProductsMap({});
                return;
            }
            const map = data.reduce((acc: any, p: any) => {
                acc[String(p.id)] = p;
                return acc;
            }, {});
            setProductsMap(map);
        } catch (err) {
            console.error("Failed to load products for mapping", err);
            setProductsMap({});
        }
    };

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await fetchInvoices();
            if (Array.isArray(data)) {
                // Filter locally to avoid crashing on invalid/deleted invoices
                const validOrders = data.filter((inv: any) =>
                    inv.invoice_type === 'SALE' && !inv.is_deleted
                );
                // Sort by ID descending (newest first)
                validOrders.sort((a: any, b: any) => b.id - a.id);
                setOrders(validOrders);
            } else {
                setOrders([]);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to load orders");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePayOpen = (order: any) => {
        setSelectedOrder(order);
        setPaymentAmount(order.due_amount || (order.total_amount - (order.paid_amount || 0)));
        setPaymentMethod("CASH");
        setPaymentNotes("");
        setActiveTab("payment");
        setShowDetailModal(true);
    };

    const handleRowClick = (order: any) => {
        setSelectedOrder(order);
        setPaymentAmount(order.due_amount || (order.total_amount - (order.paid_amount || 0)));
        setPaymentMethod("CASH");
        setPaymentNotes("");
        setActiveTab(order.payment_status === 'PAID' ? "items" : "payment");
        setShowDetailModal(true);
    };

    const handlePaymentSubmit = async () => {
        if (!selectedOrder) return;
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsPaying(true);
        try {
            await addPayment(selectedOrder.id, {
                amount: parseFloat(paymentAmount),
                payment_method: paymentMethod,
                notes: paymentNotes
            });
            toast.success("Payment added successfully");
            setShowDetailModal(false);
            loadInvoices(); // Refresh list
        } catch (err: any) {
            toast.error(err.message || "Failed to process payment");
        } finally {
            setIsPaying(false);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!Array.isArray(orders)) return [];
        return orders.filter(order =>
            (order.invoice_number?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (order.customer_name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        ).sort((a, b) => {
            const dateA = a.order_date ? new Date(a.order_date).getTime() : 0;
            const dateB = b.order_date ? new Date(b.order_date).getTime() : 0;
            return dateB - dateA;
        });
    }, [orders, searchQuery]);

    return (
        <div className="h-screen bg-stone-50 flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <header className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/counter/pos')} className="rounded-xl">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 h-10 w-10 rounded-xl flex items-center justify-center">
                            <Monitor className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-xl font-black text-slate-800">Order History</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="default"
                        onClick={() => navigate('/counter/pos')}
                        className="h-11 px-6 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
                    >
                        <ShoppingBag className="h-5 w-5" />
                        Sell Items
                    </Button>
                    <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-xl gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(), 'dd MMM yyyy')}
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="p-6 shrink-0 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search by Order ID or Table Number..."
                        className="pl-12 h-14 text-lg rounded-2xl border-2 focus:border-primary bg-white shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-14 px-6 rounded-2xl font-bold border-2 hover:bg-slate-50 gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                </Button>
            </div>

            {/* Orders Table */}
            <main className="flex-1 overflow-hidden px-6 pb-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 h-full flex flex-col overflow-hidden">
                    <div className="overflow-x-auto h-full custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-10 border-b">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Table / Mode</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Items</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                                <p className="text-xl font-black text-slate-400">Loading orders...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <Clock className="h-20 w-20" />
                                                <p className="text-xl font-black">No orders found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                            onClick={() => handleRowClick(order)}
                                        >
                                            <td className="px-8 py-5">
                                                <span className="font-mono text-sm font-bold text-slate-600">#{order.invoice_number}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800">
                                                        {order.customer_name || 'Walk-in'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.invoice_description || 'Sale'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1 max-w-[200px]">
                                                    {order.items?.slice(0, 2).map((item: any, i: number) => {
                                                        const productName = productsMap[String(item.product)]?.name || `Product #${item.product}`;
                                                        return (
                                                            <span key={i} className="text-xs font-medium text-slate-600 truncate">
                                                                {item.quantity}x {productName}
                                                            </span>
                                                        );
                                                    })}
                                                    {(order.items?.length || 0) > 2 && (
                                                        <span className="text-[10px] font-bold text-primary uppercase">+{order.items.length - 2} more items</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-medium text-slate-500">
                                                    {order.order_date ? format(parseISO(order.order_date), 'hh:mm a') : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-black text-slate-900 text-lg">Rs.{order.total_amount}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status={(order.payment_status?.toLowerCase() || 'unpaid')} />
                                                    {order.payment_status === 'PAID' && (
                                                        <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-success font-black" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/counter/pos`, { state: { orderId: order.id } }); }}
                                                        title="Print"
                                                    >
                                                        <Printer className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    {(order.payment_status === 'UNPAID' || order.payment_status === 'PARTIAL') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-xl hover:bg-success/10 hover:shadow-md border border-transparent hover:border-success/20 group/pay"
                                                            onClick={(e) => { e.stopPropagation(); handlePayOpen(order); }}
                                                            title="Receive Payment"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 text-success group-hover/pay:scale-110 transition-transform" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Order Details / Payment Dialog */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-[480px] p-0 overflow-hidden border-none shadow-3xl rounded-[2.5rem]">
                    <div className="bg-white">
                        <div className="p-8 pb-4">
                            <DialogHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <DialogTitle className="text-2xl font-black text-slate-800">Order Details</DialogTitle>
                                        <p className="text-sm text-slate-400 font-medium">#{selectedOrder?.invoice_number} • {selectedOrder?.customer_name || 'Walk-in'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Grand Total</p>
                                        <p className="text-2xl font-black text-primary">Rs.{selectedOrder?.total_amount}</p>
                                    </div>
                                </div>
                            </DialogHeader>
                        </div>

                        {/* Tabs */}
                        <div className="px-8 flex border-b">
                            <button
                                onClick={() => setActiveTab("payment")}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all",
                                    activeTab === "payment" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Banknote className="h-4 w-4" />
                                Payment
                            </button>
                            <button
                                onClick={() => setActiveTab("items")}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all",
                                    activeTab === "items" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <FileText className="h-4 w-4" />
                                Order Items
                            </button>
                        </div>

                        <div className="p-8 pt-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {activeTab === "payment" ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Paid Amount</p>
                                            <p className="text-xl font-black text-emerald-600">Rs.{selectedOrder?.paid_amount || 0}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Due Balance</p>
                                            <p className="text-xl font-black text-slate-800">Rs.{selectedOrder?.due_amount || (selectedOrder ? (selectedOrder.total_amount - (selectedOrder.paid_amount || 0)) : 0)}</p>
                                        </div>
                                    </div>

                                    {(selectedOrder?.payment_status !== 'PAID') ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Amount to Pay</Label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">Rs.</span>
                                                    <Input
                                                        type="number"
                                                        className="h-16 text-3xl font-black text-center border-2 border-primary/20 focus:border-primary rounded-2xl pl-10"
                                                        value={paymentAmount}
                                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Payment Method</Label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { id: 'CASH', icon: Banknote, label: 'Cash' },
                                                        { id: 'QR', icon: QrCode, label: 'QR' },
                                                        { id: 'ONLINE', icon: CreditCard, label: 'Online' }
                                                    ].map((method) => (
                                                        <button
                                                            key={method.id}
                                                            onClick={() => setPaymentMethod(method.id as any)}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-1",
                                                                paymentMethod === method.id ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-100 text-slate-400 hover:border-slate-200"
                                                            )}
                                                        >
                                                            <method.icon className="h-6 w-6" />
                                                            <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Internal Notes</Label>
                                                <Input
                                                    placeholder="Add any internal payment notes..."
                                                    className="h-12 rounded-xl"
                                                    value={paymentNotes}
                                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                                />
                                            </div>

                                            <Button
                                                className="w-full h-16 rounded-[1.5rem] font-black text-xl gradient-warm shadow-xl shadow-primary/20"
                                                onClick={handlePaymentSubmit}
                                                disabled={isPaying}
                                            >
                                                {isPaying ? <Loader2 className="h-6 w-6 animate-spin" /> : "Receive Payment"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center space-y-4 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-in zoom-in-95">
                                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-emerald-800">Fully Paid</p>
                                                <p className="text-sm text-emerald-600 font-medium">No outstanding balance for this order</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="space-y-3">
                                        {selectedOrder?.items?.map((item: any, idx: number) => {
                                            const productName = productsMap[String(item.product)]?.name || `Product #${item.product}`;
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-black text-primary border border-slate-100">
                                                            {item.quantity}x
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{productName}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">Rs.{item.unit_price} / unit</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-slate-900">Rs.{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</p>
                                                </div>
                                            );
                                        })}
                                        {(!selectedOrder?.items || selectedOrder.items.length === 0) && (
                                            <div className="text-center py-10 text-slate-300">
                                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                                <p className="font-bold">No items found</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-dashed space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400 font-bold">Subtotal</span>
                                            <span className="font-bold text-slate-600">Rs.{selectedOrder?.total_amount}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-black text-slate-800">Grand Total</span>
                                            <span className="text-2xl font-black text-primary">Rs.{selectedOrder?.total_amount}</span>
                                        </div>
                                    </div>

                                    <Button variant="outline" className="w-full h-14 rounded-2xl font-black gap-2 border-2" onClick={() => navigate(`/counter/pos`, { state: { orderId: selectedOrder?.id } })}>
                                        <Printer className="h-5 w-5" />
                                        Print Invoice
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="p-8 pt-0 flex gap-4">
                            <Button variant="ghost" className="h-12 flex-1 rounded-xl font-bold text-slate-400" onClick={() => setShowDetailModal(false)}>Close</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
