import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { TableCard } from "@/components/waiter/TableCard";
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav";
import { Table } from "@/lib/mockData";
import { getAllOrders } from "@/lib/orderStorage";
import { fetchTables } from "@/api/index.js";
import { getCurrentUser } from "../../auth/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users, Layers, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TableSelection() {
  const navigate = useNavigate();
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const user = getCurrentUser();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const branchFloors = await fetchTables();
        setFloors(branchFloors || []);

        // Load from localStorage
        const storedFloorId = localStorage.getItem('selectedFloorId');
        if (storedFloorId && branchFloors) {
          const found = branchFloors.find((f: any) => f.id.toString() === storedFloorId);
          if (found) {
            setSelectedFloor(found);
            return;
          }
        }

        if (branchFloors && branchFloors.length > 0) {
          setSelectedFloor(branchFloors[0]);
        }
      } catch (error) {
        console.error("Failed to fetch floors:", error);
      }
    };
    loadInitialData();
  }, [user?.branch_id]);

  const handleFloorChange = (floor: any) => {
    setSelectedFloor(floor);
    localStorage.setItem('selectedFloorId', floor.id.toString());
  };

  useEffect(() => {
    if (selectedFloor) {
      const count = selectedFloor.table_count || 0;
      const generatedTables: Table[] = Array.from({ length: count }, (_, i) => ({
        id: `table-${selectedFloor.id}-${i + 1}`,
        number: i + 1,
        status: 'available',
        capacity: 4
      }));
      setAllTables(generatedTables);
    }
  }, [selectedFloor]);

  const activeOrders = getAllOrders();

  const handleTableClick = (table: Table) => {
    if (selectedFloor) {
      navigate(`/waiter/order/${table.number}?floorId=${selectedFloor.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <MobileHeader title="" />

      <main className="p-4 max-w-2xl mx-auto pt-4 space-y-6">
        {/* Floor Selection */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-14 rounded-2xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all font-bold">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-0.5">Current Floor</p>
                    <p className="text-slate-700">{selectedFloor?.name || "Loading..."}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-2xl rounded-2xl p-2">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-black text-slate-400 px-3 py-2">Switch Floor</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {floors.map((floor) => (
                <DropdownMenuItem
                  key={floor.id}
                  className="h-12 rounded-xl focus:bg-primary/10 focus:text-primary transition-colors cursor-pointer"
                  onClick={() => handleFloorChange(floor)}
                >
                  <Layers className="h-4 w-4 mr-3 opacity-50" />
                  <span className="font-bold">{floor.name}</span>
                  <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">
                    {floor.table_count} Tables
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table List (Row-wise) */}
        <div className="space-y-1">
          {allTables.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No tables found on this floor</p>
            </div>
          ) : (
            allTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={handleTableClick}
              />
            ))
          )}
        </div>
      </main>



      {/* Bottom Navigation */}
      <WaiterBottomNav />
    </div>
  );
}
