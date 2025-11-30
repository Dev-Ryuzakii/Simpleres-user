// API Types based on the specification

export interface Restaurant {
  id: string;
  name: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  logoUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  tableNumber: string;
  tableName: string;
  capacity: number;
  location: string;
  qrCodeUrl?: string;
  qrCodeData?: string;
  orderWebsiteUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number;
  categoryId: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  menuItems: MenuItem[];
}

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'completed';
export type PaymentMethod = 'cash' | 'pos' | 'transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  table?: {
    id: string;
    tableNumber: string;
    location: string;
  };
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  specialInstructions?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  tableId: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
}

export interface PaymentMethodInfo {
  id: string;
  type: PaymentMethod;
  name: string;
  isActive: boolean;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: string;
  status: PaymentStatus;
  amount: number;
  receiptImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
}

export interface UploadReceiptRequest {
  paymentId: string;
  receiptUrl: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

