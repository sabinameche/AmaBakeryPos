import { MenuItem } from "./mockData";

export interface CartItemData {
    item: MenuItem;
    quantity: number;
    notes?: string;
}

export interface TableOrder {
    tableNumber: string;
    cart: CartItemData[];
    timestamp: number;
}

const STORAGE_KEY = "ama_bakery_orders";

// Get all orders from localStorage
export function getAllOrders(): TableOrder[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error loading orders:", error);
        return [];
    }
}

// Get order for a specific table
export function getTableOrder(tableNumber: string): TableOrder | null {
    const orders = getAllOrders();
    return orders.find(
        order => order.tableNumber === tableNumber
    ) || null;
}

// Save or update an order
export function saveTableOrder(tableNumber: string, cart: CartItemData[]): void {
    try {
        const orders = getAllOrders();
        const existingIndex = orders.findIndex(
            order => order.tableNumber === tableNumber
        );

        const newOrder: TableOrder = {
            tableNumber,
            cart,
            timestamp: Date.now()
        };

        if (existingIndex >= 0) {
            orders[existingIndex] = newOrder;
        } else {
            orders.push(newOrder);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
        console.error("Error saving order:", error);
    }
}

// Clear order for a specific table
export function clearTableOrder(tableNumber: string): void {
    try {
        const orders = getAllOrders();
        const filtered = orders.filter(
            order => order.tableNumber !== tableNumber
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error("Error clearing order:", error);
    }
}

// Clear all orders
export function clearAllOrders(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Error clearing all orders:", error);
    }
}
