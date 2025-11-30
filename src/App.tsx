import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { OrderProvider } from '@/contexts/OrderContext';
import { Menu } from '@/components/Menu';
import { Cart } from '@/components/Cart';
import { Payment } from '@/components/Payment';
import { OrderStatus } from '@/components/OrderStatus';

function App() {
  return (
    <OrderProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/order" element={<Menu />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/order-status" element={<OrderStatus />} />
        </Routes>
      </BrowserRouter>
    </OrderProvider>
  );
}

export default App;
