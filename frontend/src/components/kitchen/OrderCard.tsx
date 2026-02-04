import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface OrderCardProps {
  order: any;
  onStatusChange: (orderId: string, status: string) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const getNextStatus = (): string | null => {
    switch (order.status) {
      case 'new': return 'ready';
      case 'preparing': return 'ready'; // Fallback for any existing preparing orders
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
  const timeAgo = formatDistanceToNow(order.createdAt, { addSuffix: true });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      {/* Status Header Strip */}
      <div className={cn(
        "h-1 w-full",
        order.status === 'new' && "bg-blue-500",
        order.status === 'preparing' && "bg-amber-500",
        order.status === 'ready' && "bg-emerald-500",
        order.status === 'completed' && "bg-slate-400"
      )} />

      {/* Card Header */}
      <div className="p-3 border-b border-slate-100 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-slate-800">#{order.id.slice(-3)}</span>
            <StatusBadge status={order.status} className={cn(
              "text-[10px] px-1.5 py-0 border-none",
              order.status === 'new' && "bg-blue-50 text-blue-700",
              order.status === 'preparing' && "bg-amber-50 text-amber-700",
              order.status === 'ready' && "bg-emerald-50 text-emerald-700"
            )} />
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-slate-700">Tb {order.tableNumber}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{order.groupName || 'Group A'}</div>
          <div className="text-xs text-slate-400">{order.waiter}</div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-3 flex-grow space-y-2">
        {order.items?.map((item: any, index: number) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
              {item.quantity}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {item.menuItem.name}
              </p>
              {item.notes && (
                <p className="text-xs text-amber-600 italic leading-tight">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {nextStatus && (
        <div className="p-2 border-t border-slate-50 bg-slate-50/50 flex gap-2">
          <Button
            size="sm"
            className={cn(
              "flex-1 font-semibold shadow-none h-8",
              order.status === 'new' && "bg-blue-600 hover:bg-blue-700",
              order.status === 'preparing' && "bg-amber-600 hover:bg-amber-700 text-white",
              order.status === 'ready' && "bg-emerald-600 hover:bg-emerald-700"
            )}
            onClick={() => onStatusChange(order.id, nextStatus)}
          >
            {getActionLabel()}
          </Button>
          {order.status === 'ready' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50"
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
