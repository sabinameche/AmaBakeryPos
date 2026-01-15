import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav";
import { sampleOrders, Order } from "@/lib/mockData";
import { CreditCard, Banknote, Check, Users, CheckCircle2, IndianRupee, Receipt, Printer, MessageSquare, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function PaymentCollection() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(
    sampleOrders.filter(o => o.paymentStatus === 'pending')
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedChange, setCompletedChange] = useState<number>(0);

  const handlePayment = (method: 'cash' | 'online') => {
    if (method === 'cash') {
      setShowPaymentDialog(false);
      setShowCashDialog(true);
    } else {
      processPayment('online');
    }
  };

  const processPayment = async (method: string, change = 0) => {
    if (!selectedOrder) return;

    setIsProcessing(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));

    toast.success("Payment Received!", {
      description: method === 'cash' && change > 0
        ? `Change to return: ₹${change.toFixed(2)}`
        : `Table ${selectedOrder.tableNumber} - ₹${selectedOrder.total} paid via ${method}`,
      icon: <CheckCircle2 className="h-5 w-5 text-success" />
    });

    setIsProcessing(false);
    setShowPaymentDialog(false);
    setShowCashDialog(false);

    // Set completed order for receipt
    setCompletedOrder({
      ...selectedOrder,
      paymentMethod: method as any,
      paymentStatus: 'paid'
    });
    setCompletedChange(change);
    setShowReceipt(true);

    setSelectedOrder(null);
    setCashReceived("");
  };

  const handleCashPayment = () => {
    const received = parseFloat(cashReceived);
    if (!cashReceived || isNaN(received)) {
      toast.error("Please enter amount received");
      return;
    }

    if (received < (selectedOrder?.total || 0)) {
      toast.error("Insufficient amount");
      return;
    }

    const change = received - (selectedOrder?.total || 0);
    processPayment('cash', change);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Collect Payment" showBack />

      <main className="p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Check className="h-16 w-16 mb-4 text-success opacity-70" />
            <h3 className="text-lg font-medium">All bills cleared!</h3>
            <p className="text-sm">No pending payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                className="card-elevated p-4 w-full text-left hover:shadow-warm-lg transition-all"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowPaymentDialog(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">Table {order.tableNumber}</span>
                      {order.groupName && (
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {order.groupName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} items • {order.waiter}
                    </p>
                  </div>
                  <StatusBadge status={order.paymentStatus} />
                </div>

                <div className="space-y-1 text-sm border-t pt-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}× {item.menuItem.name}</span>
                      <span>₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold text-primary">₹{order.total}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Amount Due</p>
                <p className="text-4xl font-bold text-primary">₹{selectedOrder.total}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Table {selectedOrder.tableNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handlePayment('cash')}
                >
                  <Banknote className="h-6 w-6 text-success" />
                  <span>Cash</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handlePayment('online')}
                >
                  <CreditCard className="h-6 w-6 text-info" />
                  <span>Online</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cash Payment Dialog - Added this as requested */}
      <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] w-[380px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-success p-6 text-white text-center">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 border border-white/30">
              <Banknote className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Cash Collection</h3>
            <p className="text-white/80 text-sm">Table {selectedOrder?.tableNumber}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-muted-foreground font-medium">Total Bill</span>
                <span className="text-xl font-black text-primary">₹{selectedOrder?.total.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Amount Received</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xl">₹</div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="text-center text-3xl h-16 font-black border-2 border-success/20 focus:border-success pl-8 rounded-xl shadow-inner bg-slate-50"
                    autoFocus
                  />
                </div>
              </div>

              {cashReceived && parseFloat(cashReceived) >= (selectedOrder?.total || 0) && (
                <div className="p-4 rounded-xl bg-success/10 border-2 border-success/20 text-success animate-in zoom-in-95 duration-300 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-0.5">Change to Return</p>
                      <p className="text-3xl font-black">₹{(parseFloat(cashReceived) - (selectedOrder?.total || 0)).toFixed(2)}</p>
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
                className="flex-1 h-14 font-bold text-muted-foreground"
                onClick={() => setShowCashDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-[1.5] h-14 text-lg font-bold gradient-warm shadow-lg"
                onClick={handleCashPayment}
                disabled={isProcessing || !cashReceived || parseFloat(cashReceived) < (selectedOrder?.total || 0)}
              >
                {isProcessing ? (
                  <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Receive Cash
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Digital Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-[360px] w-[92vw] p-0 border-none bg-transparent shadow-none overflow-visible max-h-[92vh] flex flex-col">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowReceipt(false)}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-sm shadow-xl z-50 transition-all active:scale-95"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-white rounded-[2rem] overflow-y-auto shadow-2xl relative">
            <div className="h-2 bg-primary w-full sticky top-0 z-10" />

            {completedOrder && (
              <div className="p-8 space-y-6">
                {/* Logo & Info */}
                <div className="text-center space-y-3">
                  <div className="mx-auto h-20 w-20 p-1 bg-white rounded-2xl shadow-sm border border-slate-50 overflow-hidden">
                    <img src="/logos/logo1white.jfif" alt="Logo" className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-primary">AMA BAKERY</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Artisanal & Fresh Daily</p>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    <p>123 Bakery Street, Kathmandu</p>
                    <p>Phone: +977 9800000000</p>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-y-3 text-[12px]">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Order Date</p>
                    <p className="font-bold">{new Date(completedOrder.createdAt).toLocaleDateString()} {new Date(completedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Table / Group</p>
                    <p className="font-bold">Table {completedOrder.tableNumber} {completedOrder.groupName ? `(${completedOrder.groupName})` : ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Waiter</p>
                    <p className="font-bold">{completedOrder.waiter}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest text-right">Status</p>
                    <p className="font-black uppercase text-[10px] px-3 py-1 rounded-full whitespace-nowrap bg-emerald-100 text-emerald-600">
                      Paid
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-slate-100" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Items List</span>
                    <div className="h-[1px] flex-1 bg-slate-100" />
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {completedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 text-sm font-medium">
                        <div className="flex-1">
                          <p className="text-slate-800 leading-tight">{item.menuItem.name}</p>
                          <p className="text-[10px] text-slate-400">{item.quantity} x ₹{item.menuItem.price}</p>
                        </div>
                        <p className="text-slate-800 font-bold whitespace-nowrap">₹{(item.menuItem.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span>₹{(completedOrder.total / 1.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500 font-medium">
                    <span>Tax (5%)</span>
                    <span>₹{(completedOrder.total - (completedOrder.total / 1.05)).toFixed(2)}</span>
                  </div>
                  {completedChange > 0 && (
                    <div className="flex justify-between text-sm text-success font-bold">
                      <span>Change Given</span>
                      <span>₹{completedChange.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-lg font-black text-slate-900 leading-none">Total</span>
                    <span className="text-2xl font-black text-primary leading-none">₹{completedOrder.total.toFixed(2)}</span>
                  </div>
                  {completedOrder.paymentMethod && (
                    <div className="text-center pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        Paid via {completedOrder.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-6 space-y-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-[10px] text-slate-400 font-medium italic">Thank you for visiting Ama Bakery!</p>
                  </div>
                  <Button
                    className="w-full h-12 bg-slate-900 text-white font-bold rounded-xl shadow-lg"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Download / Print Bill
                  </Button>
                </div>
              </div>
            )}

            {/* Receipt Zig Zag Bottom */}
            <div className="flex w-full overflow-hidden h-2">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 shrink-0 -translate-y-1" />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <WaiterBottomNav />
    </div>
  );
}
