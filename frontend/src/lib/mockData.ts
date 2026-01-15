// Mock Data for Ama Bakery Restaurant Management System

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}

export interface Table {
  id: string;
  number: number;
  status: 'available' | 'occupied' | 'order-in-progress' | 'payment-pending';
  capacity: number;
  groups?: TableGroup[];
}

export interface TableGroup {
  id: string;
  name: string;
  orders: Order[];
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  groupName?: string;
  items: OrderItem[];
  status: 'new' | 'preparing' | 'ready' | 'completed';
  createdAt: Date;
  waiter: string;
  total: number;
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: 'cash' | 'online';
}

export interface User {
  id: string;
  name: string;
  role: 'waiter' | 'kitchen' | 'supervisor' | 'admin' | 'counter';
  pin: string;
}

// Menu Items
export const menuItems: MenuItem[] = [
  // Bakery
  { id: 'b1', name: 'Croissant', price: 45, category: 'Bakery', available: true },
  { id: 'b2', name: 'Chocolate Muffin', price: 55, category: 'Bakery', available: true },
  { id: 'b3', name: 'Cinnamon Roll', price: 65, category: 'Bakery', available: true },
  { id: 'b4', name: 'Blueberry Scone', price: 50, category: 'Bakery', available: true },
  { id: 'b5', name: 'Banana Bread', price: 40, category: 'Bakery', available: false },
  { id: 'b6', name: 'Danish Pastry', price: 60, category: 'Bakery', available: true },

  // Coffee
  { id: 'c1', name: 'Espresso', price: 80, category: 'Coffee', available: true },
  { id: 'c2', name: 'Americano', price: 100, category: 'Coffee', available: true },
  { id: 'c3', name: 'Cappuccino', price: 120, category: 'Coffee', available: true },
  { id: 'c4', name: 'Latte', price: 130, category: 'Coffee', available: true },
  { id: 'c5', name: 'Mocha', price: 150, category: 'Coffee', available: true },
  { id: 'c6', name: 'Cold Brew', price: 140, category: 'Coffee', available: true },

  // Beverages
  { id: 'd1', name: 'Fresh Orange Juice', price: 90, category: 'Beverages', available: true },
  { id: 'd2', name: 'Iced Tea', price: 60, category: 'Beverages', available: true },
  { id: 'd3', name: 'Lemonade', price: 70, category: 'Beverages', available: true },
  { id: 'd4', name: 'Mango Smoothie', price: 120, category: 'Beverages', available: true },
  { id: 'd5', name: 'Hot Chocolate', price: 100, category: 'Beverages', available: true },

  // Snacks
  { id: 's1', name: 'Veg Sandwich', price: 120, category: 'Snacks', available: true },
  { id: 's2', name: 'Cheese Toast', price: 80, category: 'Snacks', available: true },
  { id: 's3', name: 'Paneer Wrap', price: 140, category: 'Snacks', available: true },
  { id: 's4', name: 'French Fries', price: 90, category: 'Snacks', available: true },
  { id: 's5', name: 'Garlic Bread', price: 70, category: 'Snacks', available: true },
  { id: 's6', name: 'Nachos', price: 110, category: 'Snacks', available: true },
];

// Tables
export const tables: Table[] = [
  { id: 't1', number: 1, status: 'available', capacity: 2 },
  {
    id: 't2', number: 2, status: 'occupied', capacity: 4, groups: [
      { id: 'g1', name: 'Group A', orders: [] },
      { id: 'g2', name: 'Group B', orders: [] }
    ]
  },
  { id: 't3', number: 3, status: 'order-in-progress', capacity: 4, groups: [{ id: 'g3', name: 'Group A', orders: [] }] },
  { id: 't4', number: 4, status: 'available', capacity: 6 },
  { id: 't5', number: 5, status: 'payment-pending', capacity: 2, groups: [{ id: 'g5', name: 'Group A', orders: [] }] },
  { id: 't6', number: 6, status: 'available', capacity: 4 },
  { id: 't7', number: 7, status: 'occupied', capacity: 8, groups: [{ id: 'g7', name: 'Group A', orders: [] }] },
  { id: 't8', number: 8, status: 'available', capacity: 2 },
  { id: 't9', number: 9, status: 'order-in-progress', capacity: 4, groups: [{ id: 'g9', name: 'Group A', orders: [] }] },
  { id: 't10', number: 10, status: 'available', capacity: 6 },
  { id: 't11', number: 11, status: 'available', capacity: 4 },
  { id: 't12', number: 12, status: 'payment-pending', capacity: 2, groups: [{ id: 'g12', name: 'Group A', orders: [] }] },
];

// Sample Orders
export const sampleOrders: Order[] = [
  {
    id: 'ord1',
    tableNumber: 3,
    items: [
      { menuItem: menuItems[0], quantity: 2, notes: 'Extra butter' },
      { menuItem: menuItems[7], quantity: 2 },
    ],
    status: 'new',
    createdAt: new Date(Date.now() - 5 * 60000),
    waiter: 'Rahul',
    total: 290,
    paymentStatus: 'pending',
  },
  {
    id: 'ord2',
    tableNumber: 7,
    groupName: 'Group A',
    items: [
      { menuItem: menuItems[3], quantity: 1 },
      { menuItem: menuItems[8], quantity: 3 },
      { menuItem: menuItems[17], quantity: 2 },
    ],
    status: 'new',
    createdAt: new Date(Date.now() - 2 * 60000),
    waiter: 'Priya',
    total: 650,
    paymentStatus: 'pending',
  },
  {
    id: 'ord3',
    tableNumber: 9,
    items: [
      { menuItem: menuItems[10], quantity: 2 },
      { menuItem: menuItems[19], quantity: 1 },
    ],
    status: 'ready',
    createdAt: new Date(Date.now() - 12 * 60000),
    waiter: 'Rahul',
    total: 390,
    paymentStatus: 'pending',
  },
  {
    id: 'ord4',
    tableNumber: 5,
    items: [
      { menuItem: menuItems[5], quantity: 1 },
      { menuItem: menuItems[9], quantity: 2 },
    ],
    status: 'completed',
    createdAt: new Date(Date.now() - 30 * 60000),
    waiter: 'Priya',
    total: 320,
    paymentStatus: 'pending',
  },
];

// Users
export const users: User[] = [
  { id: 'u1', name: 'Rahul', role: 'waiter', pin: '1234' },
  { id: 'u2', name: 'Priya', role: 'waiter', pin: '2345' },
  { id: 'u3', name: 'Kitchen1', role: 'kitchen', pin: '3456' },
  { id: 'u4', name: 'Admin', role: 'admin', pin: '0000' },
  { id: 'u5', name: 'Counter', role: 'counter', pin: '1111' },
];

// Analytics Data
export const analyticsData = {
  todaySales: 28450,
  weekSales: 185200,
  monthSales: 742800,
  totalOrders: 156,
  avgOrderValue: 182,
  peakHour: '12:00 PM - 2:00 PM',
  topItems: [
    { name: 'Cappuccino', count: 48, revenue: 5760 },
    { name: 'Croissant', count: 42, revenue: 1890 },
    { name: 'Latte', count: 38, revenue: 4940 },
    { name: 'Veg Sandwich', count: 32, revenue: 3840 },
    { name: 'Chocolate Muffin', count: 28, revenue: 1540 },
  ],
  categoryBreakdown: [
    { category: 'Coffee', percentage: 42, revenue: 31200 },
    { category: 'Bakery', percentage: 28, revenue: 20800 },
    { category: 'Snacks', percentage: 18, revenue: 13400 },
    { category: 'Beverages', percentage: 12, revenue: 8900 },
  ],
  hourlyData: [
    { hour: '8AM', orders: 8 },
    { hour: '9AM', orders: 12 },
    { hour: '10AM', orders: 18 },
    { hour: '11AM', orders: 22 },
    { hour: '12PM', orders: 28 },
    { hour: '1PM', orders: 32 },
    { hour: '2PM', orders: 24 },
    { hour: '3PM', orders: 18 },
    { hour: '4PM', orders: 20 },
    { hour: '5PM', orders: 26 },
    { hour: '6PM', orders: 30 },
    { hour: '7PM', orders: 22 },
    { hour: '8PM', orders: 16 },
  ],
};

// Inventory Data (Finished Goods)
export const inventoryItems = [
  { id: 'inv1', name: 'Croissant', unit: 'pcs', stock: 24, minStock: 10, category: 'Bakery' },
  { id: 'inv2', name: 'Chocolate Muffin', unit: 'pcs', stock: 18, minStock: 8, category: 'Bakery' },
  { id: 'inv3', name: 'Cinnamon Roll', unit: 'pcs', stock: 12, minStock: 5, category: 'Bakery' },
  { id: 'inv4', name: 'Blueberry Scone', unit: 'pcs', stock: 15, minStock: 5, category: 'Bakery' },
  { id: 'inv5', name: 'Veg Sandwich', unit: 'pcs', stock: 8, minStock: 10, category: 'Snacks' },
  { id: 'inv6', name: 'Paneer Wrap', unit: 'pcs', stock: 5, minStock: 5, category: 'Snacks' },
  { id: 'inv7', name: 'Fresh Orange Juice', unit: 'bottles', stock: 20, minStock: 10, category: 'Beverages' },
  { id: 'inv8', name: 'Cold Brew (Bottled)', unit: 'bottles', stock: 15, minStock: 5, category: 'Beverages' },
];
