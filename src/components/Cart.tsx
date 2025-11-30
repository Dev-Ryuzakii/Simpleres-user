import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useOrder } from '@/contexts/OrderContext';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';

export function Cart() {
  const navigate = useNavigate();
  const {
    table,
    cartItems,
    updateCartItemQuantity,
    updateCartItemInstructions,
    removeFromCart,
    getCartTotal,
    clearCart,
    setCurrentOrder,
    setPaymentMethods,
    setSelectedPaymentMethod,
  } = useOrder();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    if (!table) {
      navigate('/');
      return;
    }
    loadPaymentMethods();
  }, [table, navigate]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await api.getPaymentMethods();
      setPaymentMethods(methods.filter((m) => m.isActive));
    } catch (err: any) {
      console.error('Failed to load payment methods:', err);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Get first payment method as default (or let user select)
      const paymentMethods = await api.getPaymentMethods();
      const activeMethods = paymentMethods.filter((m) => m.isActive);
      const defaultMethod = activeMethods[0]?.type || 'cash';

      const order = await api.createOrder({
        tableId: table!.id,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
        })),
        paymentMethod: defaultMethod as any,
        specialInstructions: specialInstructions || undefined,
      });

      setCurrentOrder(order);
      clearCart();
      navigate('/payment', { state: { orderId: order.id } });
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const total = getCartTotal();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/menu')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Menu
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/menu')}
            className="px-6 py-3 bg-[#F97415] text-white rounded-lg hover:bg-[#E8650D] transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Menu
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {cartItems.map((item) => (
            <div
              key={item.menuItem.id}
              className="p-4 border-b last:border-b-0 flex items-start space-x-4"
            >
              {item.menuItem.imageUrl && (
                <img
                  src={item.menuItem.imageUrl}
                  alt={item.menuItem.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.menuItem.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  ₦{item.menuItem.price.toLocaleString()} each
                </p>
                <div className="flex items-center space-x-3 mb-2">
                  <button
                    onClick={() => updateCartItemQuantity(item.menuItem.id, item.quantity - 1)}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItemQuantity(item.menuItem.id, item.quantity + 1)}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.menuItem.id)}
                    className="ml-auto p-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Special instructions (optional)"
                  value={item.specialInstructions || ''}
                  onChange={(e) =>
                    updateCartItemInstructions(item.menuItem.id, e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F97415] focus:border-transparent outline-none"
                />
                <p className="text-sm font-semibold text-gray-900 mt-2">
                  Subtotal: ₦{(item.menuItem.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Special Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Special Instructions
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any special instructions for your order..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F97415] focus:border-transparent outline-none"
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-[#F97415]">
              ₦{total.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-[#F97415] text-white py-4 rounded-lg font-semibold hover:bg-[#E8650D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

