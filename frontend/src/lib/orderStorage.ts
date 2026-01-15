import { MenuItem } from "./mockData";

export interface CartItemData {
    item: MenuItem;
    quantity: number;
    notes?: string;
}

export interface TableOrder {
    tableNumber: string;
    groupName?: string;
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

// Get order for a specific table and group
export function getTableOrder(tableNumber: string, groupName?: string): TableOrder | null {
    const orders = getAllOrders();
    return orders.find(
        order =>
            order.tableNumber === tableNumber &&
            order.groupName === groupName
    ) || null;
}

// Save or update an order
export function saveTableOrder(tableNumber: string, groupName: string | undefined, cart: CartItemData[]): void {
    try {
        const orders = getAllOrders();
        const existingIndex = orders.findIndex(
            order =>
                order.tableNumber === tableNumber &&
                order.groupName === groupName
        );

        const newOrder: TableOrder = {
            tableNumber,
            groupName,
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
export function clearTableOrder(tableNumber: string, groupName?: string): void {
    try {
        const orders = getAllOrders();
        const filtered = orders.filter(
            order =>
                !(order.tableNumber === tableNumber && order.groupName === groupName)
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
