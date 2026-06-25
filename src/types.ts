export interface User {
  id: string;
  email: string;
  fullname: string;
  phone: string;
  role: "Admin" | "Manager" | "Cashier";
  profilePhoto?: string;
  createdAt: string;
  activityLogs: string[];
  password?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstNo: string;
}

export interface Product {
  id: string;
  barcode: string;
  qrCode: string;
  name: string;
  categoryId: string;
  brand: string;
  supplierId: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  expiryDate: string; // YYYY-MM-DD
  stockQty: number;
  lowStockThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // Used for mobile
  email: string;
  address?: string; // New field
  type: "Regular" | "Wholesale" | "VIP" | "Premier" | "Premium";
  loyaltyPoints: number;
  purchaseHistory?: string[];
}

export interface BillItem {
  productId: string;
  name: string;
  barcode: string;
  qty: number;
  sellingPrice: number;
  purchasePrice: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}

export interface Bill {
  id: string;
  billNo: string;
  date: string;
  items: BillItem[];
  cashierId: string;
  cashierName: string;
  cashierEmail: string;
  customerId?: string;
  customerName?: string;
  subtotal: number;
  totalGst: number;
  discount: number;
  grandTotal: number;
  paymentMode: "Cash" | "Card" | "UPI" | "Mixed";
  receivedAmount: number;
  changeAmount: number;
}

export interface Notification {
  id: string;
  type: "warning" | "alert" | "info" | "success";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Log {
  id: string;
  userId: string;
  userEmail: string;
  fullname: string;
  role: string;
  action: string;
  timestamp: string;
}

export interface Settings {
  storeName: string;
  storeAddress: string;
  gstNumber: string;
  logoUrl?: string;
  theme: "light" | "dark" | "telegram" | "midnight" | "emerald" | "amber" | "retro";
  language: string;
  fontSize?: "small" | "medium" | "large" | "xlarge";
  fontFamily?: "sans" | "display" | "mono" | "serif";
  telegramCompactMode?: boolean;
  accentColor?: string;
  borderRadius?: "none" | "small" | "medium" | "large" | "full";
}

export interface DBState {
  users: User[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  customers: Customer[];
  purchases: any[];
  bills: Bill[];
  notifications: Notification[];
  logs: Log[];
  settings: Settings;
}
