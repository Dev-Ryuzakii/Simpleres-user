import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/services/api';
import { useOrder } from '@/contexts/OrderContext';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrder, setCurrentOrder, paymentMethods, selectedPaymentMethod, setSelectedPaymentMethod } = useOrder();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const orderId = location.state?.orderId || currentOrder?.id;

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    if (!currentOrder && orderId) {
      loadOrder();
    }
  }, [orderId, currentOrder, navigate]);

  const loadOrder = async () => {
    try {
      const order = await api.getOrderById(orderId);
      setCurrentOrder(order);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    }
  };

  const handleInitiatePayment = async () => {
    if (!selectedPaymentMethod || !orderId) return;

    setLoading(true);
    setError(null);

    try {
      const payment = await api.initiatePayment({
        orderId,
        paymentMethod: selectedPaymentMethod.type,
      });

      setPaymentId(payment.id);

      if (selectedPaymentMethod.type === 'transfer') {
        setPaymentInitiated(true);
      } else {
        // For cash or POS, navigate to order status
        navigate('/order-status', { state: { orderId } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptUrl.trim() || !paymentId) return;

    setUploading(true);
    setError(null);

    try {
      await api.uploadTransferReceipt({
        paymentId: paymentId,
        receiptUrl: receiptUrl,
      });

      navigate('/order-status', { state: { orderId } });
    } catch (err: any) {
      setError(err.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97415] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  const selectedMethod = selectedPaymentMethod || paymentMethods.find(m => m.type === currentOrder.paymentMethod);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number</span>
              <span className="font-semibold">{currentOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-[#F97415] text-xl">
                ₦{currentOrder.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {!paymentInitiated ? (
          <>
            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Payment Method
              </h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedPaymentMethod?.id === method.id
                        ? 'border-[#F97415] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{method.name}</h3>
                        {method.type === 'transfer' && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Bank: {method.bankName}</p>
                            <p>Account: {method.accountNumber}</p>
                            <p>Name: {method.accountName}</p>
                          </div>
                        )}
                      </div>
                      {selectedPaymentMethod?.id === method.id && (
                        <CheckCircle className="w-6 h-6 text-[#F97415]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleInitiatePayment}
              disabled={loading || !selectedPaymentMethod}
              className="w-full bg-[#F97415] text-white py-4 rounded-lg font-semibold hover:bg-[#E8650D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Proceed with Payment'}
            </button>
          </>
        ) : (
          /* Transfer Receipt Upload */
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Transfer Receipt
            </h2>
            {selectedMethod && selectedMethod.type === 'transfer' && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Transfer to:</p>
                <p className="font-semibold">{selectedMethod.bankName}</p>
                <p className="font-semibold">{selectedMethod.accountNumber}</p>
                <p className="font-semibold">{selectedMethod.accountName}</p>
                <p className="mt-2 text-sm font-semibold text-[#F97415]">
                  Amount: ₦{currentOrder.totalAmount.toLocaleString()}
                </p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Image URL
              </label>
              <input
                type="text"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="Paste receipt image URL here"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F97415] focus:border-transparent outline-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                Upload your receipt image to a hosting service (e.g., Cloudinary) and paste the URL here
              </p>
            </div>
            <button
              onClick={handleUploadReceipt}
              disabled={uploading || !receiptUrl.trim()}
              className="w-full bg-[#F97415] text-white py-4 rounded-lg font-semibold hover:bg-[#E8650D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Receipt'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

