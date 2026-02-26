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

  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Merge static table data with dynamic order data from storage
  const activeOrders = getAllOrders();

  const tablesWithOrders = allTables.map(table => {
    // Find all active orders for this table on THIS floor in localStorage
    // Note: orderStorage might need floor awareness, but for now we'll match by table number
    // In a real app, we'd prefix with floorId
    const tableOrders = activeOrders.filter(o => o.tableNumber === table.number.toString());

    // Create virtual groups based on active orders
    const dynamicGroups = tableOrders.map(o => ({
      id: `local-${table.number}-${o.groupName || 'Group A'}`,
      name: o.groupName || 'Group A',
      orders: []
    }));

    // Merge static groups with dynamic ones
    const combinedGroups = [...(table.groups || [])];
    dynamicGroups.forEach(dg => {
      if (!combinedGroups.find(cg => cg.name === dg.name)) {
        combinedGroups.push(dg as any);
      }
    });

    // A table is occupied if it has active orders in storage
    const isActuallyOccupied = tableOrders.length > 0 || table.status !== 'available';

    if (isActuallyOccupied && combinedGroups.length === 0) {
      combinedGroups.push({
        id: `default-${table.number}-A`,
        name: 'Group A',
        orders: []
      } as any);
    }

    // Filter out 'Group A' for Table 2 and 4 as requested
    const finalGroups = combinedGroups.filter(g =>
      !((table.number === 2 || table.number === 4) && g.name === 'Group A')
    );

    return {
      ...table,
      status: 'available' as const,
      groups: finalGroups
    };
  });

  const handleTableClick = (table: Table) => {
    const tableWithOrders = tablesWithOrders.find(t => t.id === table.id) || table;
    setSelectedTable(tableWithOrders);

    if (tableWithOrders.status === 'available') {
      navigate(`/waiter/order/${tableWithOrders.number}?group=Group A&floorId=${selectedFloor.id}`);
    } else {
      setShowGroupDialog(true);
    }
  };

  const handleSelectGroup = (groupName?: string) => {
    if (selectedTable && selectedFloor) {
      const path = groupName
        ? `/waiter/order/${selectedTable.number}?group=${encodeURIComponent(groupName)}&floorId=${selectedFloor.id}`
        : `/waiter/order/${selectedTable.number}?floorId=${selectedFloor.id}`;
      navigate(path);
    }
    setShowGroupDialog(false);
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim() && selectedTable) {
      handleSelectGroup(newGroupName.trim());
      setNewGroupName("");
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
          {tablesWithOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No tables found on this floor</p>
            </div>
          ) : (
            tablesWithOrders.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={handleTableClick}
              />
            ))
          )}
        </div>
      </main>

      {/* Group Selection Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-w-sm rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-6 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-white">
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest font-black text-white/60 mb-0.5">Table {selectedTable?.number}</p>
                  <p className="text-xl font-black">Select Group</p>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              {(!selectedTable?.groups || selectedTable.groups.length === 0) && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 rounded-xl border-slate-100 bg-slate-50 hover:bg-white hover:border-primary transition-all font-bold group"
                  onClick={() => handleSelectGroup("Group A")}
                >
                  <span className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center mr-3 group-hover:border-primary/20 group-hover:text-primary transition-all">A</span>
                  Group A
                </Button>
              )}

              {selectedTable?.groups?.map((group, idx) => (
                <Button
                  key={group.id}
                  variant="outline"
                  className="w-full justify-start h-14 rounded-xl border-slate-100 bg-slate-50 hover:bg-white hover:border-primary transition-all font-bold group"
                  onClick={() => handleSelectGroup(group.name)}
                >
                  <span className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center mr-3 group-hover:border-primary/20 group-hover:text-primary transition-all">
                    {group.name.slice(-1)}
                  </span>
                  {group.name}
                </Button>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3">Create New Group</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Group B"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-primary/20"
                />
                <Button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="h-12 w-12 rounded-xl gradient-warm shadow-lg"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <WaiterBottomNav />
    </div>
  );
}
