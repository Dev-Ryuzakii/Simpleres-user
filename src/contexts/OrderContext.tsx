import { createContext, useContext, useState, ReactNode } from 'react';
import type { Table, MenuItem, Order, PaymentMethodInfo } from '@/types/api';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface OrderContextType {
  // Table state
  table: Table | null;
  setTable: (table: Table | null) => void;
  
  // Cart state
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  updateCartItemInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  
  // Order state
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  
  // Payment methods
  paymentMethods: PaymentMethodInfo[];
  setPaymentMethods: (methods: PaymentMethodInfo[]) => void;
  
  // Selected payment method
  selectedPaymentMethod: PaymentMethodInfo | null;
  setSelectedPaymentMethod: (method: PaymentMethodInfo | null) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [table, setTable] = useState<Table | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodInfo | null>(null);

  const addToCart = (item: MenuItem, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + quantity }
            : ci
        );
      }
      return [...prev, { menuItem: item, quantity }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.menuItem.id === itemId ? { ...ci, quantity } : ci
      )
    );
  };

  const updateCartItemInstructions = (itemId: string, instructions: string) => {
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.menuItem.id === itemId
          ? { ...ci, specialInstructions: instructions }
          : ci
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  return (
    <OrderContext.Provider
      value={{
        table,
        setTable,
        cartItems,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        updateCartItemInstructions,
        clearCart,
        getCartTotal,
        currentOrder,
        setCurrentOrder,
        paymentMethods,
        setPaymentMethods,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}

