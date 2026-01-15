import { useState } from "react";
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
    Filter
} from "lucide-react";
import { sampleOrders, Order } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

export default function CounterOrders() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredOrders = sampleOrders.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tableNumber.toString().includes(searchQuery)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
                                {filteredOrders.length === 0 ? (
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
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="font-mono text-sm font-bold text-slate-600">#{order.id.toUpperCase()}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800">
                                                        {order.tableNumber > 0 ? `Table ${order.tableNumber}` : 'Takeaway'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.groupName || 'No Group'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1 max-w-[200px]">
                                                    {order.items.slice(0, 2).map((item, i) => (
                                                        <span key={i} className="text-xs font-medium text-slate-600 truncate">
                                                            {item.quantity}x {item.menuItem.name}
                                                        </span>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <span className="text-[10px] font-bold text-primary uppercase">+{order.items.length - 2} more items</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-medium text-slate-500">{format(order.createdAt, 'hh:mm a')}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-black text-slate-900 text-lg">₹{order.total}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100">
                                                        <Printer className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100">
                                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                                    </Button>
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
        </div>
    );
}
