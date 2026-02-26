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
    Check,
    User,
    LogOut
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
import { getCurrentUser, logout } from "@/auth/auth";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { X } from "lucide-react";

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
    const [showReceipt, setShowReceipt] = useState(false);
    const [autoPrint, setAutoPrint] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (showReceipt && autoPrint) {
            const timer = setTimeout(() => {
                window.print();
                setAutoPrint(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [showReceipt, autoPrint]);

    useEffect(() => {
        setCurrentUser(getCurrentUser());
    }, []);

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

    const handleRowPrint = (e: React.MouseEvent, order: any) => {
        e.stopPropagation();
        setSelectedOrder(order);
        setAutoPrint(true);
        setShowReceipt(true);
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
        // Allow 0 amount if we are just confirming waiter handover
        const isConfirmingHandover = (selectedOrder.payment_status === 'PAID' || selectedOrder.payment_status === 'PARTIAL') && selectedOrder.received_by_waiter && !selectedOrder.received_by_counter && parseFloat(selectedOrder.due_amount || 0) <= 0;

        if (!isConfirmingHandover && (!paymentAmount || parseFloat(paymentAmount) <= 0)) {
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

    const getDisplayStatus = (order: any) => {
        if (order.payment_status === 'PAID' && order.received_by_waiter && !order.received_by_counter) {
            return 'waiter-paid';
        }
        return order.payment_status?.toLowerCase() || 'unpaid';
    };

    const filteredOrders = useMemo(() => {
        if (!Array.isArray(orders)) return [];
        return orders.filter(order =>
            (order.invoice_number?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (order.customer_name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        ).sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
    }, [orders, searchQuery]);

    return (
        <div className="h-screen bg-stone-50 flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <header className="h-16 bg-white border-b px-6 pr-14 flex items-center justify-between shrink-0 z-10">
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
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowChangePassword(true)}
                        className="text-slate-500 hover:text-white font-bold transition-all px-3 hidden sm:flex"
                    >
                        Change Password
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => navigate('/counter/pos')}
                        className="h-11 px-6 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
                    >
                        <ShoppingBag className="h-5 w-5" />
                        Sell Items
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (confirm("Are you sure you want to log out?")) logout();
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <ChangePasswordModal
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
            />

            {/* Toolbar */}
            <div className="px-6 py-4 shrink-0 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by Order ID or Table Number..."
                        className="pl-10 h-10 rounded-lg border-slate-200 bg-white shadow-sm focus-visible:ring-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-10 px-4 rounded-lg font-medium border-slate-200 hover:bg-slate-50 gap-2 shadow-sm">
                    <Filter className="h-4 w-4" />
                    Filters
                </Button>
            </div>

            {/* Orders Table */}
            <main className="flex-1 overflow-hidden px-6 pb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
                    <div className="overflow-x-auto h-full custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Order ID</th>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Table / Mode</th>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Items</th>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Time</th>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Method</th>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Created By</th>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Total</th>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Status</th>
                                    <th className="px-6 py-4 text-base font-bold text-slate-700">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                                <p className="text-xl font-bold text-slate-500">Loading orders...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <ShoppingBag className="h-16 w-16" />
                                                <p className="text-xl font-bold">No orders found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                            onClick={() => handleRowClick(order)}
                                        >
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-[15px] font-semibold text-slate-600">#{order.invoice_number}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-bold text-slate-800">
                                                        {order.customer_name || 'Walk-in'}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{order.invoice_description || 'Sale'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-0.5 max-w-[180px]">
                                                    {order.items?.slice(0, 2).map((item: any, i: number) => {
                                                        const productName = item.product_name || productsMap[String(item.product)]?.name || `Product #${item.product}`;
                                                        return (
                                                            <span key={i} className="text-sm font-medium text-slate-600 truncate">
                                                                {item.quantity}x {productName}
                                                            </span>
                                                        );
                                                    })}
                                                    {(order.items?.length || 0) > 2 && (
                                                        <span className="text-xs font-bold text-primary">+{order.items.length - 2} more items</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[15px] font-medium text-slate-500">
                                                    {order.created_at ? format(parseISO(order.created_at), 'hh:mm a') : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {order.payment_methods?.length > 0 ? (
                                                        order.payment_methods.map((m: string, i: number) => (
                                                            <span key={i} className="text-[11px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-tight">
                                                                {m}
                                                            </span>
                                                        ))
                                                    ) : order.payment_status === 'PAID' || order.payment_status === 'PARTIAL' ? (
                                                        <span className="text-[11px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-600 uppercase tracking-tight">
                                                            {order.payment_status}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-slate-300 italic">UNPAID</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-semibold text-slate-600 truncate max-w-[120px]">
                                                        {order.created_by_name || 'Waiter'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-lg font-black text-slate-900">Rs.{parseFloat(order.total_amount).toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge
                                                        status={getDisplayStatus(order)}
                                                        className="text-[11px] px-2.5 py-1"
                                                        label={getDisplayStatus(order) === 'waiter-paid' ? `Paid to ${order.received_by_waiter_name || 'Waiter'}` : undefined}
                                                    />
                                                    {order.payment_status === 'PAID' && (
                                                        <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-success font-bold" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                                                        onClick={(e) => handleRowPrint(e, order)}
                                                    >
                                                        <Printer className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    {(order.payment_status === 'UNPAID' || order.payment_status === 'PARTIAL') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-lg hover:bg-success/5 hover:border-success/20 text-success"
                                                            onClick={(e) => { e.stopPropagation(); handlePayOpen(order); }}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
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

                                    {(selectedOrder?.received_by_waiter_name || selectedOrder?.received_by_counter_name) && (
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Payment Receipt Log</p>
                                            <div className="flex justify-between items-center text-xs">
                                                {selectedOrder?.received_by_waiter_name && (
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-400 font-medium">Waiter Handled:</span>
                                                        <span className="font-bold text-indigo-600">{selectedOrder.received_by_waiter_name}</span>
                                                    </div>
                                                )}
                                                {selectedOrder?.received_by_counter_name && (
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-slate-400 font-medium">Counter Received:</span>
                                                        <span className="font-bold text-emerald-600">{selectedOrder.received_by_counter_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {(selectedOrder?.payment_status !== 'PAID' && parseFloat(selectedOrder?.due_amount || "0") > 0) ? (
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
                                        <div className="py-10 text-center space-y-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-in zoom-in-95">
                                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                            </div>
                                            <div className="px-6">
                                                <p className="text-xl font-black text-emerald-800">Fully Paid</p>
                                                <p className="text-sm text-emerald-600 font-medium">This order is fully paid by the customer.</p>

                                                {selectedOrder?.received_by_waiter && !selectedOrder?.received_by_counter && (
                                                    <div className="mt-6 pt-6 border-t border-emerald-100 space-y-4">
                                                        {selectedOrder.payment_methods?.includes('QR') ? (
                                                            <>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700/50">Online Payment Received</p>
                                                                <p className="text-xs text-emerald-700 font-bold italic">This order was paid via QR. Click below to verify and finalize receipt at the counter.</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700/50">Cash Handover Required</p>
                                                                <p className="text-xs text-emerald-700 font-bold italic">Wait! The waiter ({selectedOrder.received_by_waiter_name}) still has this cash. Click below once you receive it at the counter.</p>
                                                            </>
                                                        )}
                                                        <Button
                                                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-lg"
                                                            onClick={() => {
                                                                const method = selectedOrder.payment_methods?.includes('QR') ? 'QR' : 'CASH';
                                                                setPaymentMethod(method as any);
                                                                setPaymentAmount("0");
                                                                // Small timeout to ensure state is updated
                                                                setTimeout(() => handlePaymentSubmit(), 50);
                                                            }}
                                                            disabled={isPaying}
                                                        >
                                                            {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : (selectedOrder.payment_methods?.includes('QR') ? "Finalize Receipt" : "Confirm Handover to Counter")}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="space-y-3">
                                        {selectedOrder?.items?.map((item: any, idx: number) => {
                                            const productName = item.product_name || productsMap[String(item.product)]?.name || `Product #${item.product}`;
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
                                            <span className="font-bold text-slate-600">Rs.{(parseFloat(selectedOrder?.total_amount || 0) - parseFloat(selectedOrder?.tax_amount || 0)).toFixed(2)}</span>
                                        </div>
                                        {parseFloat(selectedOrder?.tax_amount || 0) > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400 font-bold">Tax</span>
                                                <span className="font-bold text-slate-600">Rs.{parseFloat(selectedOrder?.tax_amount || 0).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-black text-slate-800">Grand Total</span>
                                            <span className="text-2xl font-black text-primary">Rs.{selectedOrder?.total_amount}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="h-14 rounded-2xl font-black gap-2 border-2" onClick={() => { setAutoPrint(true); setShowReceipt(true); }}>
                                            <Printer className="h-5 w-5" />
                                            POS Print
                                        </Button>
                                        <Button className="h-14 rounded-2xl font-black gap-2 gradient-warm" onClick={() => setShowReceipt(true)}>
                                            <FileText className="h-5 w-5" />
                                            View Bill
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-8 pt-0 flex gap-4">
                            <Button variant="ghost" className="h-12 flex-1 rounded-xl font-bold text-slate-400" onClick={() => setShowDetailModal(false)}>Close</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Receipt Dialog */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-[400px] p-0 bg-transparent border-none shadow-none no-print-close">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-3xl text-center space-y-6 relative overflow-hidden printable-receipt">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                        <div className="space-y-4 pt-4">
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
                                <span>#{selectedOrder?.invoice_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{selectedOrder?.created_at ? format(parseISO(selectedOrder.created_at), 'yyyy-MM-dd HH:mm') : new Date().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Customer:</span>
                                <span className="truncate ml-4">{selectedOrder?.customer_name || "Walk-in"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Operator:</span>
                                <span>{currentUser?.name}</span>
                            </div>
                        </div>

                        <Separator className="border-dashed" />

                        <div className="space-y-2">
                            {selectedOrder?.items?.map((item: any, idx: number) => {
                                const productName = item.product_name || productsMap[String(item.product)]?.name || `Product #${item.product}`;
                                return (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-left flex-1 font-medium">{productName} x {item.quantity}</span>
                                        <span className="font-bold">Rs.{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <Separator className="border-dashed" />

                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Subtotal</span>
                                <span className="font-bold">Rs.{(parseFloat(selectedOrder?.total_amount || 0) - parseFloat(selectedOrder?.tax_amount || 0)).toFixed(2)}</span>
                            </div>
                            {parseFloat(selectedOrder?.tax_amount || 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-bold uppercase text-[10px]">Tax</span>
                                    <span className="font-bold">Rs.{parseFloat(selectedOrder?.tax_amount || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-black pt-2">
                                <span className="text-slate-400">Total</span>
                                <span className="text-primary text-2xl">Rs.{selectedOrder?.total_amount}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1 border-t border-dashed mt-2">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Paid Amount</span>
                                <span className="font-bold">Rs.{parseFloat(selectedOrder?.paid_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400 font-bold uppercase text-[10px]">Balance Due</span>
                                <span className="font-bold text-primary">Rs.{parseFloat(selectedOrder?.due_amount || 0).toFixed(2)}</span>
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
        </div>
    );
}
