import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { TableCard } from "@/components/waiter/TableCard";
import { WaiterBottomNav } from "@/components/waiter/WaiterBottomNav";
import { tables, Table } from "@/lib/mockData";
import { getAllOrders } from "@/lib/orderStorage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users } from "lucide-react";

export default function TableSelection() {
  const navigate = useNavigate();
  const [allTables] = useState<Table[]>(tables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Merge static table data with dynamic order data from storage
  const activeOrders = getAllOrders();

  const tablesWithOrders = allTables.map(table => {
    // Find all active orders for this table in localStorage
    const tableOrders = activeOrders.filter(o => o.tableNumber === table.number.toString());

    // Create virtual groups based on active orders
    const dynamicGroups = tableOrders.map(o => ({
      id: `local-${table.number}-${o.groupName || 'Group A'}`,
      name: o.groupName || 'Group A',
      orders: []
    }));

    // Merge static groups (from mockData) with dynamic ones
    const combinedGroups = [...(table.groups || [])];
    dynamicGroups.forEach(dg => {
      if (!combinedGroups.find(cg => cg.name === dg.name)) {
        combinedGroups.push(dg as any);
      }
    });

    // A table is occupied if it has active orders in storage OR if mockData says so
    const isActuallyOccupied = tableOrders.length > 0 || table.status !== 'available';

    // Ensure every occupied table has at least one group (Group A) for visual consistency
    if (isActuallyOccupied && combinedGroups.length === 0) {
      combinedGroups.push({
        id: `default-${table.number}-A`,
        name: 'Group A',
        orders: []
      } as any);
    }

    return {
      ...table,
      status: isActuallyOccupied ? ('occupied' as const) : ('available' as const),
      groups: combinedGroups
    };
  });

  const handleTableClick = (table: Table) => {
    // Look up the "live" version of the table
    const tableWithOrders = tablesWithOrders.find(t => t.id === table.id) || table;
    setSelectedTable(tableWithOrders);

    if (tableWithOrders.status === 'available') {
      // New table: Start with Group A by default as requested
      navigate(`/waiter/order/${tableWithOrders.number}?group=Group A`);
    } else {
      // Occupied table: Show selection dialog for groups
      setShowGroupDialog(true);
    }
  };

  const handleSelectGroup = (groupName?: string) => {
    if (selectedTable) {
      const path = groupName
        ? `/waiter/order/${selectedTable.number}?group=${encodeURIComponent(groupName)}`
        : `/waiter/order/${selectedTable.number}`;
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
      <MobileHeader title="Select Table" notificationCount={2} />

      <main className="p-4 max-w-2xl mx-auto pt-2">
        {/* Table List (Row-wise) */}
        <div className="space-y-1">
          {tablesWithOrders.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onClick={handleTableClick}
            />
          ))}
        </div>
      </main>

      {/* Group Selection Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Table {selectedTable?.number} Groups
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Consolidated Groups List */}

            {/* Show Group A as default if no groups exist for an occupied table */}
            {(!selectedTable?.groups || selectedTable.groups.length === 0) && (
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => handleSelectGroup("Group A")}
              >
                Group A
              </Button>
            )}

            {selectedTable?.groups?.map((group) => (
              <Button
                key={group.id}
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => handleSelectGroup(group.name)}
              >
                {group.name}
              </Button>
            ))}

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">Create new group:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                  <Plus className="h-4 w-4" />
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
