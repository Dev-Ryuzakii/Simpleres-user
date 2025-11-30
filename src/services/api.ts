/**
 * API Service for Customer Ordering System
 * 
 * This service implements all public customer-facing endpoints as documented in user.md
 * Base URL: http://localhost:3030 (or VITE_API_BASE_URL env variable)
 * 
 * All endpoints are public and do not require authentication.
 * 
 * Documentation Reference: user.md
 */

import type {
  Restaurant,
  Table,
  MenuCategory,
  Order,
  CreateOrderRequest,
  PaymentMethodInfo,
  Payment,
  InitiatePaymentRequest,
  UploadReceiptRequest,
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030';

/**
 * Custom API Error class that matches the error response format from the API
 * Error Response Format: { statusCode: number, message: string, error: string }
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper that handles API requests
 * Automatically adds JSON headers and handles error responses
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // Parse error response matching API format: { statusCode, message, error }
    const error = await response.json().catch(() => ({
      message: response.statusText,
      error: 'Unknown error',
    }));
    throw new ApiError(
      response.status,
      error.message || 'An error occurred',
      error.error
    );
  }

  return response.json();
}

/**
 * API client with all customer-facing endpoints
 * All endpoints are public and require no authentication
 */
export const api = {
  /**
   * Restaurant Information
   * GET /restaurant
   * 
   * Get basic restaurant information including name, logo, and contact details.
   * No authentication required.
   * 
   * Use Case: Display restaurant branding and contact information on the customer ordering website.
   * 
   * @returns Restaurant object with id, name, contactInfo, logoUrl, isActive, createdAt, updatedAt
   */
  async getRestaurant(): Promise<Restaurant> {
    return fetchApi<Restaurant>('/restaurant');
  },

  /**
   * Table Information by Table ID
   * GET /tables/info/{tableId}
   * 
   * Retrieve table details using the table ID.
   * Note: This endpoint is optional since all table data is now embedded in the QR code URL parameters.
   * No authentication required.
   * 
   * @param tableId - UUID of the table (path parameter, required)
   * @returns Table object with id, tableNumber, tableName, capacity, location
   * @throws ApiError with 400 if invalid table ID format
   * @throws ApiError with 404 if table not found or inactive
   * 
   * Use Case: Optional endpoint for validation or if you need to refresh table data.
   * The QR code now contains all table information in the URL parameters, so this endpoint may not be necessary.
   * 
   * Example QR Code URL: https://your-restaurant.com/order?tableId=abc-123&tableNumber=1&capacity=4&location=Main%20Hall
   */
  async getTableById(tableId: string): Promise<Table> {
    return fetchApi<Table>(`/tables/info/${tableId}`);
  },

  /**
   * Table Information by QR Code Data
   * GET /tables/{qrCode}
   * 
   * Retrieve table details using the QR code data (for QR codes that contain JSON data instead of URLs).
   * No authentication required.
   * 
   * @param qrCode - URL-encoded QR code data (JSON string or URL) (path parameter, required)
   * @returns Table object with id, tableNumber, tableName, qrCodeUrl, qrCodeData, capacity, location, orderWebsiteUrl, isActive, createdAt, updatedAt
   * @throws ApiError with 404 if table not found or inactive
   * 
   * Use Case: For QR codes that contain JSON data, this endpoint can be used to retrieve full table information.
   */
  async getTableByQRCode(qrCode: string): Promise<Table> {
    return fetchApi<Table>(`/tables/${encodeURIComponent(qrCode)}`);
  },

  /**
   * Get Public Menu
   * GET /menu
   * 
   * Retrieve the complete menu with categories and items. Only active categories and available items are returned.
   * No authentication required.
   * 
   * Response Fields:
   * - Categories are sorted by displayOrder
   * - Only isActive: true categories are included
   * - Only isAvailable: true menu items are included
   * - Menu items include full details including images and prices
   * 
   * @returns Array of MenuCategory objects, each containing menuItems array
   * 
   * Use Case: Display the complete menu on the customer ordering website, organized by categories.
   */
  async getMenu(): Promise<MenuCategory[]> {
    return fetchApi<MenuCategory[]>('/menu');
  },

  /**
   * Create Order
   * POST /orders
   * Content-Type: application/json
   * 
   * Create a new order for a table. This is the main endpoint customers use to place their orders.
   * No authentication required.
   * 
   * Request Fields:
   * - tableId (required, UUID): The table ID where the order is placed
   * - items (required, array): Array of order items
   *   - menuItemId (required, UUID): ID of the menu item
   *   - quantity (required, number): Quantity of the item
   *   - specialInstructions (optional, string): Special instructions for this item
   * - paymentMethod (required, enum): Payment method type (cash, pos, transfer)
   * - specialInstructions (optional, string): General instructions for the order
   * 
   * Order Status Values:
   * - pending: Order just created, awaiting acceptance
   * - accepted: Order accepted by kitchen/tablet
   * - rejected: Order rejected (e.g., item unavailable)
   * - preparing: Order being prepared
   * - ready: Order ready for pickup/delivery
   * - completed: Order completed
   * 
   * @param data - Order creation data
   * @returns Order object with id, orderNumber, tableId, status, totalAmount, paymentMethod, paymentStatus, items, createdAt, updatedAt
   * @throws ApiError with 400 if invalid request body or missing required fields
   * @throws ApiError with 404 if table or menu item not found
   * 
   * Use Case: Customer places an order after selecting items from the menu.
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get Orders for Table
   * GET /orders/table/{tableId}
   * 
   * Retrieve all orders for a specific table. Useful for customers to see their order history.
   * No authentication required.
   * 
   * @param tableId - UUID of the table (path parameter, required)
   * @returns Array of Order objects with id, orderNumber, tableId, status, totalAmount, paymentMethod, paymentStatus, items, createdAt, updatedAt
   * 
   * Use Case: Display order history and current order status for the table.
   */
  async getTableOrders(tableId: string): Promise<Order[]> {
    return fetchApi<Order[]>(`/orders/table/${tableId}`);
  },

  /**
   * Get Order by ID
   * GET /orders/{id}
   * 
   * Retrieve detailed information about a specific order.
   * No authentication required.
   * 
   * @param orderId - UUID of the order (path parameter, required)
   * @returns Order object with full details including table info, menu items with images, and all order information
   * @throws ApiError with 404 if order not found
   * 
   * Use Case: Display detailed order information, including real-time status updates.
   * Customers can poll this endpoint to get real-time updates on their order status.
   */
  async getOrderById(orderId: string): Promise<Order> {
    return fetchApi<Order>(`/orders/${orderId}`);
  },

  /**
   * Get Available Payment Methods
   * GET /payment-methods
   * 
   * Retrieve all active payment methods available for customers.
   * No authentication required.
   * 
   * Payment Method Types:
   * - cash: Cash payment
   * - pos: Point of Sale / Card payment
   * - transfer: Bank transfer payment
   * 
   * @returns Array of PaymentMethodInfo objects with id, type, name, isActive, and for transfer type: bankName, accountNumber, accountName
   * 
   * Use Case: Display available payment options to customers during checkout.
   */
  async getPaymentMethods(): Promise<PaymentMethodInfo[]> {
    return fetchApi<PaymentMethodInfo[]>('/payment-methods');
  },

  /**
   * Initiate Payment
   * POST /payments/initiate
   * Content-Type: application/json
   * 
   * Create a payment record for an order. This should be called after an order is created.
   * No authentication required.
   * 
   * Request Fields:
   * - orderId (required, UUID): ID of the order to pay for
   * - paymentMethod (required, enum): Payment method type (cash, pos, transfer)
   * 
   * Payment Status Values:
   * - pending: Payment initiated, awaiting confirmation
   * - completed: Payment confirmed
   * - failed: Payment failed
   * 
   * @param data - Payment initiation data
   * @returns Payment object with id, orderId, paymentMethod, status, amount, createdAt, updatedAt
   * @throws ApiError with 400 if invalid request or order not found
   * @throws ApiError with 404 if order not found
   * 
   * Use Case: Create a payment record when customer selects a payment method.
   */
  async initiatePayment(data: InitiatePaymentRequest): Promise<Payment> {
    return fetchApi<Payment>('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Upload Transfer Receipt
   * POST /payments/transfer/upload
   * Content-Type: application/json
   * 
   * Upload a receipt image for bank transfer payments. This is used when customers pay via bank transfer
   * and need to provide proof of payment.
   * No authentication required.
   * 
   * Request Fields:
   * - paymentId (required, UUID): ID of the payment record
   * - receiptUrl (required, string): URL of the uploaded receipt image
   * 
   * Note: The receipt image should be uploaded to your image hosting service (e.g., Cloudinary) first,
   * then the URL should be sent to this endpoint.
   * 
   * @param data - Receipt upload data
   * @returns Payment object with id, orderId, paymentMethod, status, amount, receiptImageUrl, updatedAt
   * @throws ApiError with 400 if invalid request or payment not found
   * @throws ApiError with 404 if payment not found
   * 
   * Use Case: Customer uploads a screenshot or photo of their bank transfer receipt for verification.
   */
  async uploadTransferReceipt(data: UploadReceiptRequest): Promise<Payment> {
    return fetchApi<Payment>('/payments/transfer/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

