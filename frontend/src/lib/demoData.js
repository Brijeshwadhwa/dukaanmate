/**
 * DukaanMate — Frontend Demo Store Data
 * For instant zero-setup demonstration of "Sharma General Store".
 */

export const DEMO_USER = {
  id: 'demo-user-sharma-123',
  email: 'demo@sharma.store',
}

export const DEMO_SHOP = {
  id: 'demo-shop-sharma-123',
  user_id: 'demo-user-sharma-123',
  shop_name: 'Sharma General Store',
  owner_name: 'Ramesh Sharma',
  city: 'Ludhiana',
  state: 'Punjab',
  business_type: 'General Store',
  gst_registered: true,
  gstin: '03ABCDE1234F1Z5',
  preferred_language: 'pa',
  product_category: 'Food & Grocery',
}

export const DEMO_INITIAL_PRODUCTS = [
  { id: 'p1',  name: "Lay's Classic Chips 26g",     category: "Food & Grocery", purchase_price: 18.00, selling_price: 25.00,  quantity: 45, unit: "packet", low_stock_limit: 10, is_active: true },
  { id: 'p2',  name: "Britannia Good Day Biscuits", category: "Food & Grocery", purchase_price: 22.00, selling_price: 30.00,  quantity: 30, unit: "packet", low_stock_limit: 8,  is_active: true },
  { id: 'p3',  name: "Parle-G Biscuits 250g",        category: "Food & Grocery", purchase_price: 14.00, selling_price: 20.00,  quantity: 60, unit: "packet", low_stock_limit: 15, is_active: true },
  { id: 'p4',  name: "Coca-Cola 250ml",              category: "Beverages",      purchase_price: 22.00, selling_price: 30.00,  quantity: 36, unit: "bottle", low_stock_limit: 12, is_active: true },
  { id: 'p5',  name: "Pepsi 250ml",                  category: "Beverages",      purchase_price: 20.00, selling_price: 28.00,  quantity: 24, unit: "bottle", low_stock_limit: 10, is_active: true },
  { id: 'p6',  name: "Thums Up 250ml",               category: "Beverages",      purchase_price: 22.00, selling_price: 30.00,  quantity: 18, unit: "bottle", low_stock_limit: 10, is_active: true },
  { id: 'p7',  name: "Lifebuoy Soap 100g",           category: "Personal Care",  purchase_price: 28.00, selling_price: 38.00,  quantity: 20, unit: "piece",  low_stock_limit: 8,  is_active: true },
  { id: 'p8',  name: "Surf Excel Quick Wash 500g",   category: "Household",      purchase_price: 85.00, selling_price: 110.00, quantity: 12, unit: "packet", low_stock_limit: 5,  is_active: true },
  { id: 'p9',  name: "Tata Salt 1kg",                category: "Food & Grocery", purchase_price: 22.00, selling_price: 28.00,  quantity: 25, unit: "packet", low_stock_limit: 8,  is_active: true },
  { id: 'p10', name: "Amul Butter 100g",             category: "Food & Grocery", purchase_price: 55.00, selling_price: 65.00,  quantity: 15, unit: "piece",  low_stock_limit: 5,  is_active: true },
  { id: 'p11', name: "Maggi Noodles 70g",            category: "Food & Grocery", purchase_price: 12.00, selling_price: 16.00,  quantity: 50, unit: "packet", low_stock_limit: 15, is_active: true },
  { id: 'p12', name: "Haldiram Aloo Bhujia 200g",    category: "Food & Grocery", purchase_price: 55.00, selling_price: 70.00,  quantity: 20, unit: "packet", low_stock_limit: 6,  is_active: true },
  { id: 'p13', name: "Dove Shampoo 80ml",            category: "Personal Care",  purchase_price: 75.00, selling_price: 95.00,  quantity: 18, unit: "bottle", low_stock_limit: 5,  is_active: true },
  // 2 LOW STOCK items (quantity <= low_stock_limit)
  { id: 'p14', name: "Harvest Gold Bread 400g",      category: "Food & Grocery", purchase_price: 32.00, selling_price: 42.00,  quantity: 3,  unit: "piece",  low_stock_limit: 5,  is_active: true },
  { id: 'p15', name: "Pears Soap 75g",               category: "Personal Care",  purchase_price: 45.00, selling_price: 58.00,  quantity: 2,  unit: "piece",  low_stock_limit: 5,  is_active: true },
]

