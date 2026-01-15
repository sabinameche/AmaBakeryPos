import { MenuItem } from "@/lib/mockData";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface CartItemProps {
  item: MenuItem;
  quantity: number;
  notes?: string;
  onAdd: () => void;
  onRemove: () => void;
  onDelete: () => void;
  onNotesChange: (notes: string) => void;
}

export function CartItem({ item, quantity, notes, onAdd, onRemove, onDelete, onNotesChange }: CartItemProps) {
  const [showNotes, setShowNotes] = useState(!!notes);

  return (
    <div className="bg-card border border-border rounded-lg p-3 animate-slide-up">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground">{item.name}</h4>
          <p className="text-sm text-muted-foreground">₹{item.price} each</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onRemove}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center font-semibold">{quantity}</span>
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={onAdd}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <span className="font-semibold text-primary">₹{item.price * quantity}</span>
        <button 
          className="text-xs text-muted-foreground underline"
          onClick={() => setShowNotes(!showNotes)}
        >
          {showNotes ? 'Hide notes' : 'Add notes'}
        </button>
      </div>
      
      {showNotes && (
        <Input
          className="mt-2 text-sm"
          placeholder="Special instructions..."
          value={notes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      )}
    </div>
  );
}
