import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
    Receipt,
    CheckCircle2,
    Percent,
    IndianRupee,
    User,
    Phone,
    MessageSquare,
    Printer,
    Wallet,
    Clock,
    Banknote,
    QrCode,
    CreditCard,
    X
} from "lucide-react";
import { toast } from "sonner";
import { MenuItem } from "@/lib/mockData";
import { clearTableOrder } from "@/lib/orderStorage";
import { cn } from "@/lib/utils";
import { CustomerSelector } from "@/components/pos/CustomerSelector";
import { createInvoice } from "@/api/index.js";
import { getCurrentUser } from "@/auth/auth";

interface CartItemData {
    item: MenuItem;
    quantity: number;
    notes?: string;
}

interface CheckoutState {
    cart: CartItemData[];
    tableNumber: string;
    groupName?: string;
    floorId?: string;
}

type PaymentTiming = "now" | "later" | null;
type PaymentMethod = "cod" | "qr" | null;

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as CheckoutState;

    const [customer, setCustomer] = useState<any>(null);
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [discountPercent, setDiscountPercent] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
    const [taxEnabled, setTaxEnabled] = useState(false);
    const [taxRate, setTaxRate] = useState(5);
    const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
    const [showCashModal, setShowCashModal] = useState(false);
    const [cashReceived, setCashReceived] = useState("");
    const [showReceipt, setShowReceipt] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [changeAmount, setChangeAmount] = useState<number | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Calculate totals
    const subtotal = useMemo(() =>
        state?.cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0) || 0,
        [state?.cart]
    );

    const taxAmount = useMemo(() =>
        taxEnabled ? subtotal * (taxRate / 100) : 0,
        [subtotal, taxEnabled, taxRate]
    );

    const discountAmount = useMemo(() =>
        (subtotal * discountPercent) / 100,
        [subtotal, discountPercent]
    );

    const total = useMemo(() =>
        subtotal + taxAmount - discountAmount,
        [subtotal, taxAmount, discountAmount]
    );

    const handlePrint = () => {
        const itemRows = state?.cart.map(item => `
            <tr>
                <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;">
                    <div style="font-weight:800;font-size:12px;color:#1e293b;">${item.item.name}</div>
                    ${item.notes ? `<div style="font-size:10px;color:#a78bfa;font-style:italic;">"${item.notes}"</div>` : ''}
                </td>
                <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:12px;color:#64748b;font-weight:600;">x${item.quantity}</td>
                <td style="padding:8px 4px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:12px;font-weight:800;color:#1e293b;">Rs.${(item.item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('') || '';

        const taxRow = taxAmount > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:11px;color:#64748b;font-weight:600;">Tax (${taxRate}%)</span>
                <span style="font-size:11px;color:#64748b;font-weight:600;">Rs.${taxAmount.toFixed(2)}</span>
            </div>` : '';

        const discountRow = discountAmount > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:11px;color:#10b981;font-weight:700;">Discount (${discountPercent}%)</span>
                <span style="font-size:11px;color:#10b981;font-weight:700;">-Rs.${discountAmount.toFixed(2)}</span>
            </div>` : '';

        const customerRow = customer ? `
            <div style="grid-column:1/-1;border-top:1px solid #f8fafc;padding-top:6px;margin-top:2px;">
                <div style="font-size:8px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Customer</div>
                <div style="font-size:11px;font-weight:800;color:#ca8a04;">${customer.name} <span style="color:#94a3b8;font-weight:400;">${customer.phone}</span></div>
            </div>` : '';

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"/>
    <title>Receipt - Ama Bakery</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#fff; }
        @media print {
            @page { size: 80mm auto; margin: 4mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
<div style="width:100%;max-width:72mm;margin:0 auto;padding:8px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:16px;">
        <img src="/logos/logo1white.jfif" style="width:72px;height:72px;border-radius:50%;object-fit:contain;border:2px solid #fde68a;margin-bottom:8px;"/>
        <div style="font-size:20px;font-weight:900;color:#ca8a04;letter-spacing:0.05em;">AMA BAKERY</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:3px 0;">
            <span style="display:inline-block;height:1px;width:16px;background:#fde68a;"></span>
            <span style="font-size:8px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;">Freshly Baked Daily</span>
            <span style="display:inline-block;height:1px;width:16px;background:#fde68a;"></span>
        </div>
        <div style="font-size:10px;color:#94a3b8;font-weight:600;line-height:1.6;margin-top:4px;">
            123 Bakery Street, Kathmandu<br/>+977 9800000000
        </div>
    </div>

    <!-- Order Info -->
    <div style="border-top:1px dashed #cbd5e1;border-bottom:1px dashed #cbd5e1;padding:10px 0;margin-bottom:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div>
            <div style="font-size:8px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Order Receipt</div>
            <div style="font-size:11px;font-weight:800;color:#1e293b;">#${orderId ? String(orderId).slice(-6).toUpperCase() : 'NEW'}</div>
        </div>
        <div style="text-align:right;">
            <div style="font-size:8px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Date &amp; Time</div>
            <div style="font-size:10px;font-weight:700;color:#1e293b;">${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div>
            <div style="font-size:8px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Serving Location</div>
            <div style="font-size:11px;font-weight:800;color:#1e293b;">Table ${state?.tableNumber}</div>
        </div>
        <div style="text-align:right;">
            <div style="font-size:8px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Payment Status</div>
            <div style="display:inline-block;font-size:9px;font-weight:800;text-transform:uppercase;padding:2px 8px;border-radius:999px;${paymentTiming === 'now' ? 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;' : 'background:#fffbeb;color:#d97706;border:1px solid #fde68a;'}">${paymentTiming === 'now' ? 'Paid' : 'Due Later'}</div>
        </div>
        ${customerRow}
    </div>

    <!-- Items -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead>
            <tr>
                <th style="text-align:left;padding:6px 4px;font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Item</th>
                <th style="text-align:center;padding:6px 4px;font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Qty</th>
                <th style="text-align:right;padding:6px 4px;font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #e2e8f0;">Price</th>
            </tr>
        </thead>
        <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals -->
    <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:14px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:#64748b;font-weight:600;">Subtotal</span>
            <span style="font-size:11px;color:#64748b;font-weight:600;">Rs.${subtotal.toFixed(2)}</span>
        </div>
        ${taxRow}
        ${discountRow}
        <div style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:0.05em;">Total Amount</span>
            <span style="font-size:22px;font-weight:900;color:#ca8a04;line-height:1;">Rs.${total.toFixed(2)}</span>
        </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;border:1px dashed #e2e8f0;border-radius:8px;padding:8px;">
        <p style="font-size:10px;color:#94a3b8;font-style:italic;">Thank you for visiting Ama Bakery!</p>
    </div>
</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=400,height=700');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

    const submitInvoice = async (isPaid: boolean = false, paidAmount: number = 0, method: string | null = null) => {
        setIsProcessing(true);
        const user = getCurrentUser();

        try {
            const invoiceData = {
                branch: user?.branch_id,
                customer: customer?.id || null,
                invoice_type: "SALE",
                notes: specialInstructions,
                description: `Table ${state?.tableNumber} - ${state?.groupName || "Walk-in"}`,
                floor: state?.floorId ? parseInt(state.floorId) : null,
                tax_amount: taxAmount,
                discount: discountAmount,
                paid_amount: paidAmount,
                payment_method: method,
                items: state.cart.map(c => ({
                    item_type: "PRODUCT",
                    product: parseInt(c.item.id),
                    quantity: c.quantity,
                    unit_price: c.item.price,
                    discount_amount: 0 // Could distribute global discount here if needed
                }))
            };

            const result = await createInvoice(invoiceData);
            setOrderId(String(result.id)); // Ensure ID is a string

            // Clear the order from storage
            clearTableOrder(state?.tableNumber || "", state?.groupName);

            return result;
        } catch (err: any) {
            toast.error(err.message || "Failed to create invoice");
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (!paymentTiming) {
            toast.error("Please select payment option", {
                description: "Choose Pay Now or Pay Later",
            });
            return;
        }

        if (paymentTiming === "now" && !paymentMethod) {
            toast.error("Please select payment method", {
                description: "Choose Cash or QR payment",
            });
            return;
        }

        if (paymentTiming === "later") {
            try {
                await submitInvoice(false, 0);
                toast.success("Order Confirmed!", {
                    description: `Table ${state?.tableNumber} - Payment Pending`,
                    icon: <Clock className="h-5 w-5 text-warning" />,
                });
                setShowSuccess(true);
            } catch (err) { }
        } else {
            // Pay Now flow - show appropriate modal
            if (paymentMethod === "cod") {
                setShowCashModal(true);
            } else {
                // QR Code payment
                setShowPaymentConfirmation(true);
            }
        }
    };

    const handleCashPayment = async () => {
        const receivedAmount = parseFloat(cashReceived);

        if (!cashReceived || isNaN(receivedAmount)) {
            toast.error("Please enter amount received");
            return;
        }

        if (receivedAmount < total) {
            toast.error("Insufficient amount", {
                description: `Need Rs.${(total - receivedAmount).toFixed(2)} more`,
            });
            return;
        }

        try {
            await submitInvoice(true, total, "CASH");
            const change = receivedAmount - total;

            toast.success("Payment Confirmed!", {
                description: change > 0
                    ? `Change to return: Rs.${change.toFixed(2)}`
                    : "Exact amount received",
                icon: <CheckCircle2 className="h-5 w-5 text-success" />,
            });

            setChangeAmount(change);
            setShowCashModal(false);
            setShowSuccess(true);
            setShowReceipt(true);
        } catch (err) { }
    };

    const handleQRPayment = async () => {
        try {
            await submitInvoice(true, total, "QR");
            toast.success("Payment Confirmed!", {
                description: `Table ${state?.tableNumber} - Rs.${total.toFixed(2)} paid via QR Code`,
                icon: <CheckCircle2 className="h-5 w-5 text-success" />,
            });

            setShowPaymentConfirmation(false);
            setShowSuccess(true);
            setShowReceipt(true);
        } catch (err) { }
    };

    const handlePrintBill = () => {
        setShowReceipt(true);
        toast.success("Opening digital bill", {
            icon: <Receipt className="h-5 w-5" />,
        });
    };

    if (!state || !state.cart || state.cart.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="p-6 text-center">
                    <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">No items in cart</h2>
                    <p className="text-muted-foreground mb-4">Please add items before checkout</p>
                    <Button onClick={() => navigate(-1)}>Go Back</Button>
                </Card>
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
                        <div className="relative bg-success rounded-full w-24 h-24 flex items-center justify-center shadow-lg shadow-success/20">
                            <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-foreground">Order Received!</h2>
                        <p className="text-muted-foreground">Table {state?.tableNumber} • {paymentTiming === 'now' ? 'Paid' : 'Payment Pending'}</p>
                        <p className="text-emerald-600 font-bold bg-emerald-50 py-2 px-4 rounded-full inline-block mt-2">
                            Sent to Kitchen
                        </p>
                    </div>

                    <Card className="card-elevated p-6 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Order Total</span>
                            <span className="font-bold text-lg text-primary">Rs.{total.toFixed(2)}</span>
                        </div>

                        {changeAmount !== null && changeAmount > 0 && (
                            <div className="flex justify-between items-center pt-3 border-t">
                                <span className="text-muted-foreground">Change Returned</span>
                                <span className="font-bold text-lg text-success">Rs.{changeAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="pt-4 space-y-3">
                            <Button
                                className="w-full btn-touch gradient-warm shadow-warm-lg h-14 text-lg"
                                onClick={handlePrintBill}
                            >
                                <Printer className="h-6 w-6 mr-2" />
                                Print Bill
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-12"
                                    onClick={() => navigate('/waiter/tables')}
                                >
                                    New Order
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12"
                                    onClick={() => navigate('/waiter/orders')}
                                >
                                    View Orders
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <p className="text-xs text-muted-foreground">Order has been sent to the kitchen printer.</p>
                </div>

                {/* Digital Receipt Modal */}
                <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                    <DialogContent className="max-w-[360px] w-[92vw] p-0 border-none bg-transparent shadow-none overflow-visible max-h-[92vh] flex flex-col">
                        <DialogTitle className="sr-only">Digital Receipt</DialogTitle>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @media print {
                                @page {
                                    size: 80mm auto;
                                    margin: 5mm;
                                }
                                html, body {
                                    height: auto !important;
                                    overflow: visible !important;
                                }
                                body * {
                                    visibility: hidden !important;
                                }
                                #bill-print-root, #bill-print-root * {
                                    visibility: visible !important;
                                }
                                #bill-print-root {
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    width: 100% !important;
                                    height: auto !important;
                                    overflow: visible !important;
                                    box-shadow: none !important;
                                    border-radius: 0 !important;
                                }
                                .no-print {
                                    display: none !important;
                                }
                            }
                        `}} />
                        <div className="flex justify-end mb-2 no-print">
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-sm shadow-xl z-50 transition-all active:scale-95"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl overflow-y-auto shadow-2xl relative custom-scrollbar" style={{ overflowY: 'auto' }}>
                            <div id="bill-print-root">
                                <div className="h-1.5 bg-primary w-full rounded-t-2xl" />

                                <div className="px-5 pt-4 pb-2 space-y-3">
                                    {/* Logo & Info */}
                                    <div className="text-center space-y-1">
                                        <div className="mx-auto h-14 w-14 p-1 bg-white rounded-full border-2 border-primary/10 flex items-center justify-center overflow-hidden">
                                            <img src="/logos/logo1white.jfif" alt="Logo" className="h-full w-full object-contain" />
                                        </div>
                                        <div>
                                            <h1
                                                className="text-lg text-primary leading-tight tracking-widest"
                                                style={{ fontFamily: "'Rockwell', 'Rockwell Nova', 'Roboto Slab', 'Georgia', serif", fontWeight: 700 }}
                                            >
                                                AMA BAKERY
                                            </h1>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="h-[1px] w-3 bg-primary/20" />
                                                <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em] font-black">Freshly Baked Daily</p>
                                                <span className="h-[1px] w-3 bg-primary/20" />
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium leading-tight">
                                            <p>123 Bakery Street, Kathmandu • +977 9800000000</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-b border-dashed py-2 grid grid-cols-2 gap-y-2 text-[10px]">
                                        <div>
                                            <p className="text-slate-400 font-black uppercase text-[7px] tracking-widest">Order Receipt</p>
                                            <p className="font-black text-slate-800">#{orderId ? String(orderId).slice(-6).toUpperCase() : "NEW-ORDER"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-400 font-black uppercase text-[7px] tracking-widest">Date & Time</p>
                                            <p className="font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-black uppercase text-[7px] tracking-widest">Serving Location</p>
                                            <p className="font-black text-slate-800">Table {state?.tableNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-400 font-black uppercase text-[7px] tracking-widest">Payment Status</p>
                                            <p className={cn(
                                                "font-black uppercase text-[8px] px-2 py-0.5 rounded-full inline-block",
                                                paymentTiming === 'now' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                            )}>
                                                {paymentTiming === 'now' ? 'Paid' : 'Due Later'}
                                            </p>
                                        </div>
                                        {customer && (
                                            <div className="col-span-2 border-t border-slate-50 pt-1.5">
                                                <p className="text-slate-400 font-black uppercase text-[7px] tracking-widest">Customer</p>
                                                <p className="font-black text-primary text-[10px]">{customer.name} <span className="text-slate-400 font-medium ml-1">{customer.phone}</span></p>
                                            </div>
                                        )}
                                    </div>

                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="text-left py-1.5 font-black text-slate-400 uppercase text-[8px]">Item</th>
                                                <th className="text-center py-1.5 font-black text-slate-400 uppercase text-[8px]">Qty</th>
                                                <th className="text-right py-1.5 font-black text-slate-400 uppercase text-[8px]">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {state?.cart.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-1.5 pr-2">
                                                        <p className="font-bold text-slate-800 leading-tight">{item.item.name}</p>
                                                        {item.notes && <p className="text-[9px] text-primary italic">"{item.notes}"</p>}
                                                    </td>
                                                    <td className="py-1.5 text-center text-slate-500">x{item.quantity}</td>
                                                    <td className="py-1.5 text-right font-semibold text-slate-700">Rs.{(item.item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Totals Section — professional receipt style */}
                                    <div className="border-t border-slate-200 pt-2 space-y-1">
                                        <div className="flex justify-between text-[11px] text-slate-500">
                                            <span>Subtotal</span>
                                            <span className="tabular-nums">Rs.{subtotal.toFixed(2)}</span>
                                        </div>
                                        {taxAmount > 0 && (
                                            <div className="flex justify-between text-[11px] text-slate-500">
                                                <span>Tax ({taxRate}%)</span>
                                                <span className="tabular-nums">Rs.{taxAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-[11px] text-emerald-600">
                                                <span>Discount ({discountPercent}%)</span>
                                                <span className="tabular-nums">-Rs.{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center border-t border-dashed border-slate-300 pt-1.5 mt-1">
                                            <span className="text-[12px] font-black text-slate-900 uppercase tracking-wide">Total</span>
                                            <span className="text-[13px] font-black text-primary tabular-nums">Rs.{total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Footer + Print */}
                                    <div className="space-y-2 text-center pb-1">
                                        <p className="text-[9px] text-slate-400 font-medium italic">Thank you for visiting Ama Bakery!</p>
                                        <Button
                                            className="w-full h-10 bg-slate-900 text-white font-bold rounded-xl shadow-lg text-sm"
                                            onClick={() => handlePrint()}
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            Download / Print Bill
                                        </Button>
                                    </div>
                                </div>

                            </div>{/* /bill-print-root */}
                        </div>{/* /overflow scroll wrapper */}
                    </DialogContent>
                </Dialog>


                <WaiterBottomNav />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-40">
            <MobileHeader
                title="Checkout"
                showBack
                showNotification={false}
            />

            <div className="p-4 space-y-4 max-w-2xl mx-auto">
                <Card className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Customer Information
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <CustomerSelector
                            selectedCustomerId={customer?.id}
                            onSelect={(c) => setCustomer(c)}
                        />

                        <Separator className="my-2" />

                        <div>
                            <Label htmlFor="specialInstructions" className="text-sm font-medium">Special Instructions</Label>
                            <Input
                                id="specialInstructions"
                                type="text"
                                placeholder="Any special requests?"
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </Card>

                {/* Order Summary Card */}
                <Card className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-white p-1 shadow-sm border border-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                            <img src="/logos/logo1white.jfif" alt="Logo" className="h-full w-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-primary">Ama Bakery</h2>
                            <p className="text-sm text-muted-foreground font-medium">
                                Table {state.tableNumber}{state.groupName ? ` • ${state.groupName}` : ''}
                            </p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Items List */}
                    <div className="space-y-3 mb-4">
                        {state.cart.map((cartItem, index) => (
                            <div
                                key={cartItem.item.id}
                                className="flex justify-between items-start p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex-1">
                                    <h3 className="font-medium">{cartItem.item.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Rs.{cartItem.item.price} × {cartItem.quantity}
                                    </p>
                                    {cartItem.notes && (
                                        <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" />
                                            {cartItem.notes}
                                        </p>
                                    )}
                                </div>
                                <span className="font-semibold text-lg">
                                    Rs.{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Billing Details */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>Rs.{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex flex-col gap-2 py-2 animate-in fade-in slide-in-from-top-1">
                            {taxEnabled && (
                                <div className="flex justify-between items-center text-muted-foreground">
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
                                        <span className="font-bold text-foreground">Rs.{taxAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {!taxEnabled && (
                                <div className="flex justify-between items-center text-muted-foreground">
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
                                <div className="flex gap-1 justify-end">
                                    {[5, 10, 15].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => setTaxRate(rate)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm border",
                                                taxRate === rate
                                                    ? "bg-primary text-white border-primary"
                                                    : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                                            )}
                                        >
                                            {rate}%
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {discountPercent > 0 && (
                            <div className="flex justify-between text-success">
                                <span className="flex items-center gap-1">
                                    <Percent className="h-4 w-4" />
                                    Discount ({discountPercent}%)
                                </span>
                                <span>-Rs.{discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <Separator className="my-3" />

                        <div className="flex justify-between items-center text-xl font-bold">
                            <span>Total</span>
                            <span className="text-primary flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" />
                                {total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </Card>


                {/* Discount Card */}
                <Card className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        Apply Discount (Optional)
                    </h3>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Discount %"
                                value={discountPercent || ""}
                                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                            />
                        </div>
                        <div className="flex gap-2">
                            {[5, 10, 15].map((percent) => (
                                <Button
                                    key={percent}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDiscountPercent(percent)}
                                    className="min-w-[60px]"
                                >
                                    {percent}%
                                </Button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Payment Timing Card */}
                <Card className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        Payment Option
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                setPaymentTiming("now");
                                setShowPaymentConfirmation(false);
                            }}
                            className={cn(
                                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 hover:scale-105",
                                paymentTiming === "now"
                                    ? "border-primary bg-primary/10 shadow-lg"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <Banknote className={cn(
                                "h-8 w-8",
                                paymentTiming === "now" ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                "font-semibold",
                                paymentTiming === "now" ? "text-primary" : "text-foreground"
                            )}>
                                Pay Now
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                setPaymentTiming("later");
                                setPaymentMethod(null);
                                setShowPaymentConfirmation(false);
                            }}
                            className={cn(
                                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 hover:scale-105",
                                paymentTiming === "later"
                                    ? "border-warning bg-warning/10 shadow-lg"
                                    : "border-border hover:border-warning/50"
                            )}
                        >
                            <Clock className={cn(
                                "h-8 w-8",
                                paymentTiming === "later" ? "text-warning" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                "font-semibold",
                                paymentTiming === "later" ? "text-warning" : "text-foreground"
                            )}>
                                Pay Later
                            </span>
                        </button>
                    </div>
                </Card>

                {/* Payment Method Card - Only show if Pay Now is selected */}
                {paymentTiming === "now" && !showPaymentConfirmation && (
                    <Card className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Select Payment Method
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod("cod")}
                                className={cn(
                                    "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 hover:scale-105",
                                    paymentMethod === "cod"
                                        ? "border-success bg-success/10 shadow-lg"
                                        : "border-border hover:border-success/50"
                                )}
                            >
                                <Banknote className={cn(
                                    "h-8 w-8",
                                    paymentMethod === "cod" ? "text-success" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    "font-semibold",
                                    paymentMethod === "cod" ? "text-success" : "text-foreground"
                                )}>
                                    Cash (COD)
                                </span>
                            </button>

                            <button
                                onClick={() => setPaymentMethod("qr")}
                                className={cn(
                                    "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 hover:scale-105",
                                    paymentMethod === "qr"
                                        ? "border-info bg-info/10 shadow-lg"
                                        : "border-border hover:border-info/50"
                                )}
                            >
                                <QrCode className={cn(
                                    "h-8 w-8",
                                    paymentMethod === "qr" ? "text-info" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    "font-semibold",
                                    paymentMethod === "qr" ? "text-info" : "text-foreground"
                                )}>
                                    QR Code
                                </span>
                            </button>
                        </div>
                    </Card>
                )}

                {/* Cash Payment Modal - Now as a true Dialog */}
                <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
                    <DialogContent className="max-w-[calc(100%-2rem)] w-[380px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                        <div className="bg-primary p-6 text-white text-center">
                            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 border border-white/30">
                                <Banknote className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold">Cash Payment</h3>
                            <p className="text-white/80 text-sm">Collect cash from customer</p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-muted-foreground font-medium">Total Amount</span>
                                    <span className="text-xl font-black text-primary">Rs.{total.toFixed(2)}</span>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Amount Received</Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xl">Rs.</div>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            className="text-center text-3xl h-16 font-black border-2 border-primary/20 focus:border-primary pl-8 rounded-xl shadow-inner bg-slate-50"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {cashReceived && parseFloat(cashReceived) >= total && (
                                    <div className="p-4 rounded-xl bg-success/10 border-2 border-success/20 text-success animate-in zoom-in-95 duration-300 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-0.5">Change to Return</p>
                                                <p className="text-3xl font-black">Rs.{(parseFloat(cashReceived) - total).toFixed(2)}</p>
                                            </div>
                                            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                                                <IndianRupee className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    className="flex-1 h-14 font-bold text-muted-foreground hover:bg-slate-100"
                                    onClick={() => setShowCashModal(false)}
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-[1.5] h-14 text-lg font-bold gradient-warm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    onClick={handleCashPayment}
                                    disabled={isProcessing || !cashReceived || parseFloat(cashReceived) < total}
                                >
                                    {isProcessing ? (
                                        <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5 mr-2" />
                                            Complete Order
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* QR Payment Modal - Now as a true Dialog */}
                <Dialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
                    <DialogContent className="max-w-[calc(100%-2rem)] w-[360px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                        <div className="bg-info p-6 text-white text-center">
                            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 border border-white/30">
                                <QrCode className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold">Scan to Pay</h3>
                            <p className="text-white/80 text-sm">Ready to receive payment</p>
                        </div>

                        <div className="p-8 text-center space-y-6">
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-sm font-medium">Customer Payment Amount</p>
                                <p className="text-4xl font-black text-primary">Rs.{total.toFixed(2)}</p>
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-info/20 to-primary/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative bg-white p-4 rounded-xl mx-auto border border-info/10 shadow-xl flex flex-col items-center">
                                    <QrCode className="h-44 w-44 text-slate-800" />
                                    <div className="mt-4 flex items-center justify-center gap-4 w-full opacity-60 grayscale scale-90">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-4" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1024px-Google_Pay_Logo.svg.png" alt="GPay" className="h-4" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-4" />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">Wait for confirmation</p>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={() => setShowPaymentConfirmation(false)}
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-[1.5] h-12 font-bold bg-info hover:bg-info/90 text-white shadow-lg shadow-info/20 transition-all active:scale-95"
                                    onClick={handleQRPayment}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5 mr-2" />
                                            Confirm Paid
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-card border-t shadow-lg z-50">
                <div className="max-w-2xl mx-auto space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Total Amount</span>
                        <span className="text-2xl font-bold text-primary">Rs.{total.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            className="w-full btn-touch gradient-warm shadow-warm-lg"
                            onClick={handleConfirmOrder}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="h-5 w-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    {paymentTiming === 'later' ? 'Confirm Order' : 'Proceed to Payment'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <WaiterBottomNav />
        </div>
    );
}
