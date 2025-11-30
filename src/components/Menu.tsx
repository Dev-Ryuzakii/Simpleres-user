import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useOrder } from '@/contexts/OrderContext';
import type { MenuCategory, MenuItem, Table } from '@/types/api';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

export function Menu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { table, setTable, cartItems, addToCart, updateCartItemQuantity, getCartTotal } = useOrder();
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const menuData = await api.getMenu();
      console.log('Menu data received:', menuData);
      console.log('First category structure:', menuData[0]);
      if (menuData[0]) {
        console.log('First category menuItems:', menuData[0].menuItems);
        console.log('First category keys:', Object.keys(menuData[0]));
      }
      
      // Filter active categories and ensure menuItems is an array
      // Show categories even if they have no items (they'll show empty state)
      const validCategories = menuData
        .filter(cat => {
          // Only filter out inactive categories
          if (!cat.isActive) {
            console.log('Category filtered out (inactive):', cat.name);
            return false;
          }
          return true;
        })
        .map(cat => {
          // Check if menuItems exists and log its structure
          console.log(`Category "${cat.name}" menuItems:`, cat.menuItems, 'Type:', typeof cat.menuItems, 'Is Array:', Array.isArray(cat.menuItems));
          
          // Handle different possible property names
          const items = cat.menuItems || cat.items || [];
          const menuItemsArray = Array.isArray(items) ? items : [];
          
          console.log(`Category "${cat.name}" processed items count:`, menuItemsArray.length);
          
          return {
            ...cat,
            menuItems: menuItemsArray
          };
        });
      
      console.log('Valid categories:', validCategories);
      validCategories.forEach(cat => {
        console.log(`Category "${cat.name}" has ${cat.menuItems.length} items`);
      });
      setMenu(validCategories);
      
      if (validCategories.length > 0) {
        setSelectedCategory(validCategories[0].id);
        console.log('Selected category:', validCategories[0].id, validCategories[0].name);
      } else {
        console.warn('No valid categories found');
        setError('No menu categories available. Please add menu items through the admin panel.');
      }
    } catch (err: any) {
      console.error('Error loading menu:', err);
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  // Extract table data from URL parameters (from QR code)
  useEffect(() => {
    const tableId = searchParams.get('tableId');
    const tableNumber = searchParams.get('tableNumber');
    const tableName = searchParams.get('tableName');
    const capacity = searchParams.get('capacity');
    const location = searchParams.get('location');

    // If table data is in URL params, create table object from it
    if (tableId) {
      const tableData: Table = {
        id: tableId,
        tableNumber: tableNumber || 'Unknown',
        tableName: tableName || 'Table',
        capacity: capacity ? parseInt(capacity, 10) : 0,
        location: location || 'Unknown',
      };
      setTable(tableData);
      // Load menu after setting table
      loadMenu();
    } else if (table) {
      // Table already in context (from previous navigation), just load menu
      loadMenu();
    } else {
      // No table data in URL and no table in context
      setError('Table information not found. Please scan the QR code again.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const getItemQuantity = (itemId: string) => {
    const item = cartItems.find((ci) => ci.menuItem.id === itemId);
    return item?.quantity || 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item, 1);
  };

  const handleQuantityChange = (item: MenuItem, delta: number) => {
    const currentQty = getItemQuantity(item.id);
    const newQty = Math.max(0, currentQty + delta);
    updateCartItemQuantity(item.id, newQty);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97415] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadMenu}
            className="px-4 py-2 bg-[#F97415] text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cartTotal = getCartTotal();
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {table?.tableName || `Table ${table?.tableNumber}`}
              </h1>
              <p className="text-sm text-gray-600">{table?.location}</p>
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="relative p-3 bg-[#F97415] text-white rounded-full hover:bg-[#E8650D] transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {menu.length > 0 && (
        <div className="bg-white border-b sticky top-[73px] z-10 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-1">
              {menu.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-3 whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'text-[#F97415] border-b-2 border-[#F97415]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category.name}
              </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {menu.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No menu categories available</p>
            <p className="text-sm mt-2">Please add menu items through the admin panel.</p>
          </div>
        ) : !selectedCategory ? (
          <div className="text-center py-12 text-gray-500">
            <p>Please select a category</p>
          </div>
        ) : (
          menu
            .filter((cat) => cat.id === selectedCategory)
            .map((category) => {
              console.log('Rendering category:', category.name, 'Items:', category.menuItems?.length);
              return (
            <div key={category.id} className="space-y-6">
              {category.description && (
                <p className="text-gray-600">{category.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(!category.menuItems || category.menuItems.length === 0 || 
                  category.menuItems.filter((item) => item.isAvailable).length === 0) ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <p>No items available in this category</p>
                  </div>
                ) : (
                  category.menuItems
                    .filter((item) => item.isAvailable)
                    .map((item) => {
                    const quantity = getItemQuantity(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {item.imageUrl && (
                          <div className="aspect-video bg-gray-200 overflow-hidden">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-[#F97415]">
                              ₦{item.price.toLocaleString()}
                            </span>
                            {quantity === 0 ? (
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="px-4 py-2 bg-[#F97415] text-white rounded-lg hover:bg-[#E8650D] transition-colors text-sm font-medium"
                              >
                                Add
                              </button>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleQuantityChange(item, -1)}
                                  className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-semibold w-8 text-center">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item, 1)}
                                  className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            );
            })
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={() => navigate('/cart')}
            className="bg-[#F97415] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#E8650D] transition-colors flex items-center space-x-2 font-semibold"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>View Cart ({cartItemCount})</span>
            <span className="ml-2">₦{cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  );
}

