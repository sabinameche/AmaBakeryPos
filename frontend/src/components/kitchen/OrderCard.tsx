import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";

interface OrderCardProps {
  order: any;
  onStatusChange: (orderId: string, status: string) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const getNextStatus = (): string | null => {
    switch (order.status) {
      case 'new': return 'ready';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getActionLabel = (): string => {
    switch (order.status) {
      case 'new': return 'Mark Ready';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Complete';
      default: return '';
    }
  };

  const nextStatus = getNextStatus();
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      if (order.createdAt) {
        try {
          setTimeAgo(formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }));
        } catch (e) {
          setTimeAgo("");
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [order.createdAt]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300">
      {/* Status Header Strip */}
      <div className={cn(
        "h-1.5 w-full",
        order.status === 'new' && "bg-blue-500",
        order.status === 'preparing' && "bg-amber-500",
        order.status === 'ready' && "bg-emerald-500",
        order.status === 'completed' && "bg-slate-400"
      )} />

      {/* Card Header (Minimized Metadata) */}
      <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <span className="text-[10px] sm:text-xs font-black text-slate-400 shrink-0">#{order.id.slice(-3)}</span>
          {timeAgo && (
            <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded animate-pulse shrink-0">
              <Clock className="h-2.5 w-2.5" />
              <span className="text-[10px] font-black uppercase tracking-tight">{timeAgo}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right flex flex-col items-end gap-1.5">
            {order.tableNumber ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TABLE</span>
                <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 min-w-[30px] text-center shadow-sm">
                  {order.tableNumber}
                </span>
              </div>
            ) : (
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">TAKEAWAY</span>
            )}
            {order.tableNumber && order.floorName && (
              <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 shadow-sm">
                <Layers className="h-3 w-3 text-primary opacity-70" />
                <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-tight">
                  {order.floorName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 flex-grow space-y-2">
        {order.items?.map((item: any, index: number) => (
          <div key={index} className="flex flex-col group bg-slate-50/30 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all">
            <div className="flex justify-between items-center gap-4">
              <p className="text-lg font-black text-slate-800 leading-tight tracking-tight capitalize">
                {item.menuItem.name}
              </p>
              <div className="flex-shrink-0 min-w-[40px] h-10 px-2 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center text-xl font-black text-slate-900 shadow-sm">
                x{item.quantity}
              </div>
            </div>
            {item.notes && (
              <div className="mt-2 flex items-start gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                <span className="text-amber-600 text-[10px] font-black uppercase mt-0.5 tracking-tighter">ITEM SPEC:</span>
                <p className="text-[13px] text-amber-700 font-bold italic leading-tight">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        ))}
        {order.notes && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-black uppercase text-[10px] tracking-widest mt-0.5">ORDER NOTE:</span>
              <p className="text-red-700 font-bold text-sm italic leading-tight flex-1">
                {order.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {nextStatus && (
        <div className="p-3 border-t border-slate-50 bg-white flex gap-2">
          <Button
            size="lg"
            className={cn(
              "flex-1 font-black shadow-lg shadow-slate-200/50 h-11 rounded-xl text-base transition-all active:scale-95",
              order.status === 'new' && "bg-blue-600 hover:bg-blue-700 shadow-blue-200/50",
              order.status === 'preparing' && "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200/50",
              order.status === 'ready' && "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50"
            )}
            onClick={() => onStatusChange(order.id, nextStatus)}
          >
            {getActionLabel()}
          </Button>
          {order.status === 'ready' && (
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl border-slate-100 text-slate-300 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 shadow-sm"
              onClick={() => onStatusChange(order.id, 'new')}
              title="Reverse to New"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
