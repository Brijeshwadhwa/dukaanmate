-- =============================================================================
-- DukaanMate — Supabase Row Level Security (RLS) Migration 002
-- RLS ensures a user can ONLY see and modify their own shop's data.
-- Run this AFTER migration 001.
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste & Run
-- =============================================================================

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
ALTER TABLE shops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SHOPS — Users can only read/write their own shop
-- =============================================================================
DROP POLICY IF EXISTS "shops_select_own" ON shops;
CREATE POLICY "shops_select_own" ON shops
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "shops_insert_own" ON shops;
CREATE POLICY "shops_insert_own" ON shops
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "shops_update_own" ON shops;
CREATE POLICY "shops_update_own" ON shops
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "shops_delete_own" ON shops;
CREATE POLICY "shops_delete_own" ON shops
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- PRODUCTS — Users can only read/write products of their own shop
-- =============================================================================
DROP POLICY IF EXISTS "products_select_own" ON products;
CREATE POLICY "products_select_own" ON products
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_insert_own" ON products;
CREATE POLICY "products_insert_own" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_update_own" ON products;
CREATE POLICY "products_update_own" ON products
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_delete_own" ON products;
CREATE POLICY "products_delete_own" ON products
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- SALES — Users can only read/write their own sales
-- =============================================================================
DROP POLICY IF EXISTS "sales_select_own" ON sales;
CREATE POLICY "sales_select_own" ON sales
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sales_insert_own" ON sales;
CREATE POLICY "sales_insert_own" ON sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- SALE_ITEMS — Accessible through shop ownership
-- =============================================================================
DROP POLICY IF EXISTS "sale_items_select_own" ON sale_items;
CREATE POLICY "sale_items_select_own" ON sale_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shops WHERE shops.id = sale_items.shop_id AND shops.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "sale_items_insert_own" ON sale_items;
CREATE POLICY "sale_items_insert_own" ON sale_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shops WHERE shops.id = sale_items.shop_id AND shops.user_id = auth.uid()
        )
    );

-- =============================================================================
-- CUSTOMERS
-- =============================================================================
DROP POLICY IF EXISTS "customers_select_own" ON customers;
CREATE POLICY "customers_select_own" ON customers
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_insert_own" ON customers;
CREATE POLICY "customers_insert_own" ON customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_update_own" ON customers;
CREATE POLICY "customers_update_own" ON customers
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_delete_own" ON customers;
CREATE POLICY "customers_delete_own" ON customers
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- INVOICES
-- =============================================================================
DROP POLICY IF EXISTS "invoices_select_own" ON invoices;
CREATE POLICY "invoices_select_own" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_insert_own" ON invoices;
CREATE POLICY "invoices_insert_own" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_update_own" ON invoices;
CREATE POLICY "invoices_update_own" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- INVOICE_ITEMS — Accessible through shop ownership
-- =============================================================================
DROP POLICY IF EXISTS "invoice_items_select_own" ON invoice_items;
CREATE POLICY "invoice_items_select_own" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shops WHERE shops.id = invoice_items.shop_id AND shops.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "invoice_items_insert_own" ON invoice_items;
CREATE POLICY "invoice_items_insert_own" ON invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shops WHERE shops.id = invoice_items.shop_id AND shops.user_id = auth.uid()
        )
    );

-- =============================================================================
-- AGENT_LOGS — Users can read their own logs
-- =============================================================================
DROP POLICY IF EXISTS "agent_logs_select_own" ON agent_logs;
CREATE POLICY "agent_logs_select_own" ON agent_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Backend uses service-role key so INSERT bypasses RLS — this is correct and safe

-- =============================================================================
-- CHAT_MESSAGES
-- =============================================================================
DROP POLICY IF EXISTS "chat_messages_select_own" ON chat_messages;
CREATE POLICY "chat_messages_select_own" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_insert_own" ON chat_messages;
CREATE POLICY "chat_messages_insert_own" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

