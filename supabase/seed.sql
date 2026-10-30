-- =============================================================================
-- DukaanMate — Seed Data (Demo Store)
-- Creates "Sharma General Store" with 15 products including 2 low-stock items.
--
-- HOW TO USE:
-- 1. First sign up with email: demo@sharma.store  password: sharma123
-- 2. Then run this SQL in Supabase SQL Editor, replacing USER_ID_HERE
--    with the actual UUID from: Authentication → Users → copy the user's UID
-- =============================================================================

-- Step 1: Create the demo shop
-- Replace 'USER_ID_HERE' with the actual user UUID from Supabase Auth
INSERT INTO shops (
    user_id, shop_name, owner_name, city, state, business_type,
    gst_registered, gstin, preferred_language, product_category
) VALUES (
    'USER_ID_HERE',
    'Sharma General Store',
    'Ramesh Sharma',
    'Ludhiana',
    'Punjab',
    'General Store',
    TRUE,
    '03ABCDE1234F1Z5',   -- Demo GSTIN (not real)
    'pa',
    'Food & Grocery'
) ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Insert products (we reference the shop we just created)
WITH shop AS (
    SELECT id FROM shops WHERE shop_name = 'Sharma General Store' LIMIT 1
)
INSERT INTO products (shop_id, user_id, name, category, purchase_price, selling_price, quantity, unit, low_stock_limit)
SELECT
    shop.id, 'USER_ID_HERE', name, category, purchase_price, selling_price, quantity, unit, low_stock_limit
FROM shop, (VALUES
    -- Normal stock items
    ('Lay''s Classic Chips 26g',       'Food & Grocery',  18.00,  25.00, 45,  'packet', 10),
    ('Britannia Good Day Biscuits',    'Food & Grocery',  22.00,  30.00, 30,  'packet', 8),
    ('Parle-G Biscuits 250g',          'Food & Grocery',  14.00,  20.00, 60,  'packet', 15),
    ('Coca-Cola 250ml',                'Beverages',       22.00,  30.00, 36,  'bottle', 12),
    ('Pepsi 250ml',                    'Beverages',       20.00,  28.00, 24,  'bottle', 10),
    ('Thums Up 250ml',                 'Beverages',       22.00,  30.00, 18,  'bottle', 10),
    ('Lifebuoy Soap 100g',             'Personal Care',   28.00,  38.00, 20,  'piece',  8),
    ('Surf Excel Quick Wash 500g',     'Household',       85.00, 110.00, 12,  'packet', 5),
    ('Tata Salt 1kg',                  'Food & Grocery',  22.00,  28.00, 25,  'packet', 8),
    ('Amul Butter 100g',               'Food & Grocery',  55.00,  65.00, 15,  'piece',  5),
    ('Maggi Noodles 70g',              'Food & Grocery',  12.00,  16.00, 50,  'packet', 15),
    ('Haldiram Aloo Bhujia 200g',      'Food & Grocery',  55.00,  70.00, 20,  'packet', 6),
    ('Dove Shampoo 80ml',              'Personal Care',   75.00,  95.00, 18,  'bottle', 5),

    -- LOW STOCK items (quantity <= low_stock_limit)
    ('Harvest Gold Bread 400g',        'Food & Grocery',  32.00,  42.00,  3,  'piece',  5),  -- LOW STOCK!
    ('Pears Soap 75g',                 'Personal Care',   45.00,  58.00,  2,  'piece',  5)   -- LOW STOCK!
) AS p(name, category, purchase_price, selling_price, quantity, unit, low_stock_limit);

