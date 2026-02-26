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
  customerId?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'waiter' | 'kitchen' | 'supervisor' | 'admin' | 'counter' | 'superadmin' | 'ADMIN' | 'BRANCH_MANAGER' | 'SUPER_ADMIN';
  username: string;
  password: string;
  branchId?: string; // For branch-specific users; superadmin doesn't have this
  kitchenType?: 'main' | 'breakfast'; // For kitchen staff only
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  status: 'active' | 'inactive';
  revenue: number;
  orderCount: number;
  image?: string;
  staffCount: number;
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

  // Snacks (Breakfast Items)
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
  { id: 't2', number: 2, status: 'available', capacity: 4 },
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
    customerId: 'c1',
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
    customerId: 'c3',
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
    customerId: 'c1',
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
    customerId: 'c5',
  },
];

// Users
export const users: User[] = [
  // Super Admin (no branch)
  { id: 'u0', name: 'Super Admin', role: 'superadmin', username: 'superadmin', password: 'superadmin' },

  // Kathmandu Main Branch (b1)
  { id: 'u1', name: 'Rajdeep Sharma', role: 'admin', username: 'admin@kathmandu', password: 'admin123', branchId: 'b1' },
  { id: 'u2', name: 'Rahul Kumar', role: 'waiter', username: 'rahul@kathmandu', password: 'rahul123', branchId: 'b1' },
  { id: 'u3', name: 'Priya Sharma', role: 'waiter', username: 'priya@kathmandu', password: 'priya123', branchId: 'b1' },
  { id: 'u4', name: 'Counter Staff KTM', role: 'counter', username: 'counter@kathmandu', password: 'counter123', branchId: 'b1' },
  { id: 'u5', name: 'Chef Ramesh (Main)', role: 'kitchen', username: 'kitchen@kathmandu', password: 'kitchen123', branchId: 'b1', kitchenType: 'main' },
  { id: 'u5b', name: 'Chef Suresh (Breakfast)', role: 'kitchen', username: 'kitchen-breakfast@kathmandu', password: 'kitchen123', branchId: 'b1', kitchenType: 'breakfast' },

  // Pokhara Lakeside Branch (b2)
  { id: 'u6', name: 'Anjali Gurung', role: 'admin', username: 'admin@pokhara', password: 'admin123', branchId: 'b2' },
  { id: 'u7', name: 'Bikash Thapa', role: 'waiter', username: 'bikash@pokhara', password: 'bikash123', branchId: 'b2' },
  { id: 'u8', name: 'Sita Rai', role: 'waiter', username: 'sita@pokhara', password: 'sita123', branchId: 'b2' },
  { id: 'u9', name: 'Counter Staff PKR', role: 'counter', username: 'counter@pokhara', password: 'counter123', branchId: 'b2' },
  { id: 'u10', name: 'Chef Binod', role: 'kitchen', username: 'kitchen@pokhara', password: 'kitchen123', branchId: 'b2', kitchenType: 'main' },

  // Lalitpur Heritage Branch (b3)
  { id: 'u11', name: 'Suresh Maharjan', role: 'admin', username: 'admin@lalitpur', password: 'admin123', branchId: 'b3' },
  { id: 'u12', name: 'Anjana Shakya', role: 'waiter', username: 'anjana@lalitpur', password: 'anjana123', branchId: 'b3' },
  { id: 'u13', name: 'Dipak Tamang', role: 'waiter', username: 'dipak@lalitpur', password: 'dipak123', branchId: 'b3' },
  { id: 'u14', name: 'Counter Staff LTP', role: 'counter', username: 'counter@lalitpur', password: 'counter123', branchId: 'b3' },
  { id: 'u15', name: 'Chef Sunil', role: 'kitchen', username: 'kitchen@lalitpur', password: 'kitchen123', branchId: 'b3', kitchenType: 'main' },

  // Chitwan Express Branch (b4) - Inactive but has users
  { id: 'u16', name: 'Bikash Chaudhary', role: 'admin', username: 'admin@chitwan', password: 'admin123', branchId: 'b4' },
  { id: 'u17', name: 'Ramesh Tharu', role: 'waiter', username: 'ramesh@chitwan', password: 'ramesh123', branchId: 'b4' },
  { id: 'u18', name: 'Counter Staff CTW', role: 'counter', username: 'counter@chitwan', password: 'counter123', branchId: 'b4' },
  { id: 'u19', name: 'Chef Prakash', role: 'kitchen', username: 'kitchen@chitwan', password: 'kitchen123', branchId: 'b4', kitchenType: 'main' },
];

// Categories Configuration
export interface Category {
  id: string;
  name: string;
  type: 'main' | 'breakfast';
}

export const initialCategories: Category[] = [
  { id: 'cat1', name: 'Bakery', type: 'breakfast' },
  { id: 'cat2', name: 'Coffee', type: 'main' },
  { id: 'cat3', name: 'Beverages', type: 'main' },
  { id: 'cat4', name: 'Snacks', type: 'breakfast' },
];

// Helper to get categories (simulating DB/LocalStorage)
export const getCategories = (): Category[] => {
  const stored = localStorage.getItem('categories');
  return stored ? JSON.parse(stored) : initialCategories;
};

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

// Customers Data
export const customers: Customer[] = [
  {
    id: 'c1',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+977 9841234567',
    totalOrders: 12,
    totalSpent: 4500,
    lastOrderDate: '2024-03-15'
  },
  {
    id: 'c2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    phone: '+977 9801234567',
    totalOrders: 8,
    totalSpent: 2800,
    lastOrderDate: '2024-03-18'
  },
  {
    id: 'c3',
    name: 'Anita Gurung',
    email: 'anita.g@example.com',
    phone: '+977 9851098765',
    totalOrders: 25,
    totalSpent: 12500,
    lastOrderDate: '2024-03-20'
  },
  {
    id: 'c4',
    name: 'David Wilson',
    email: 'david.w@example.com',
    phone: '+977 9812345678',
    totalOrders: 3,
    totalSpent: 1200,
    lastOrderDate: '2024-02-28'
  },
  {
    id: 'c5',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    phone: '+977 9849876543',
    totalOrders: 15,
    totalSpent: 6200,
    lastOrderDate: '2024-03-10'
  }
];

// Branches Data
export const branches: Branch[] = [
  {
    id: 'b1',
    name: 'Kathmandu Main',
    location: 'Lazimpat, Kathmandu',
    manager: 'Rajdeep Sharma',
    status: 'active',
    revenue: 1250000,
    orderCount: 4500,
    staffCount: 15,
  },
  {
    id: 'b2',
    name: 'Pokhara Lakeside',
    location: 'Lakeside, Pokhara',
    manager: 'Anjali Gurung',
    status: 'active',
    revenue: 850000,
    orderCount: 3200,
    staffCount: 12,
  },
  {
    id: 'b3',
    name: 'Lalitpur Heritage',
    location: 'Patan Durbar Square',
    manager: 'Suresh Maharjan',
    status: 'active',
    revenue: 620000,
    orderCount: 2100,
    staffCount: 8,
  },
  {
    id: 'b4',
    name: 'Chitwan Express',
    location: 'Bharatpur, Chitwan',
    manager: 'Bikash Chaudhary',
    status: 'inactive',
    revenue: 0,
    orderCount: 0,
    staffCount: 5,
  }
];
