import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/services/api';
import { useOrder } from '@/contexts/OrderContext';
import { CheckCircle, Clock, XCircle, ChefHat, Package, Home } from 'lucide-react';
import type { OrderStatus as OrderStatusType } from '@/types/api';

export function OrderStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrder, setCurrentOrder } = useOrder();
  const [order, setOrder] = useState(currentOrder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = location.state?.orderId || currentOrder?.id;

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    loadOrder();
    const interval = setInterval(loadOrder, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [orderId, navigate]);

  const loadOrder = async () => {
    try {
      const orderData = await api.getOrderById(orderId);
      setOrder(orderData);
      setCurrentOrder(orderData);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: OrderStatusType) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'preparing':
        return <ChefHat className="w-8 h-8 text-[#F97415]" />;
      case 'ready':
        return <Package className="w-8 h-8 text-blue-500" />;
      default:
        return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: OrderStatusType) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'preparing':
        return 'bg-orange-100 text-orange-700';
      case 'ready':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusMessage = (status: OrderStatusType) => {
    switch (status) {
      case 'pending':
        return 'Your order is pending confirmation';
      case 'accepted':
        return 'Your order has been accepted';
      case 'preparing':
        return 'Your order is being prepared';
      case 'ready':
        return 'Your order is ready!';
      case 'completed':
        return 'Your order has been completed';
      case 'rejected':
        return 'Your order was rejected';
      default:
        return 'Processing your order';
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97415] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#F97415] text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon(order.status)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order {order.orderNumber}
          </h1>
          <div className={`inline-block px-4 py-2 rounded-full font-semibold mb-4 ${getStatusColor(order.status)}`}>
            {order.status.toUpperCase()}
          </div>
          <p className="text-gray-600">{getStatusMessage(order.status)}</p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Table</span>
              <span className="font-semibold">
                {order.table?.tableNumber || order.tableId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status</span>
              <span className={`font-semibold capitalize ${
                order.paymentStatus === 'completed' ? 'text-green-600' :
                order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-[#F97415]">
                ₦{order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                {item.menuItem?.imageUrl && (
                  <img
                    src={item.menuItem.imageUrl}
                    alt={item.menuItem.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.menuItem?.name || 'Item'}</h3>
                  {item.specialInstructions && (
                    <p className="text-sm text-gray-600 mt-1">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">
                      {item.quantity} × ₦{item.price.toLocaleString()}
                    </span>
                    <span className="font-semibold">
                      ₦{item.subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Special Instructions</h2>
            <p className="text-gray-600">{order.specialInstructions}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/menu')}
            className="flex-1 bg-white border-2 border-[#F97415] text-[#F97415] py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            Order Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-[#F97415] text-white py-3 rounded-lg font-semibold hover:bg-[#E8650D] transition-colors flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

