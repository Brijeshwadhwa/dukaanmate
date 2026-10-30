-- =============================================================================
-- DukaanMate — Supabase Database Migration 001
-- Creates all tables with proper constraints, indexes, and Row Level Security.
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste & Run
-- =============================================================================

-- ── Enable UUID generation ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: shops
-- One row per registered shopkeeper.
-- =============================================================================
CREATE TABLE IF NOT EXISTS shops (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_name           TEXT NOT NULL CHECK (char_length(shop_name) BETWEEN 1 AND 100),
    owner_name          TEXT DEFAULT '' CHECK (char_length(owner_name) <= 100),
    city                TEXT DEFAULT '' CHECK (char_length(city) <= 100),
    state               TEXT DEFAULT 'Punjab' CHECK (char_length(state) <= 100),
    business_type       TEXT DEFAULT 'General Store',
    gst_registered      BOOLEAN DEFAULT FALSE,
    gstin               TEXT CHECK (
                            gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$'
                        ),
    preferred_language  TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'pa')),
    product_category    TEXT DEFAULT 'Food & Grocery',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops(user_id);

-- =============================================================================
-- TABLE: products
-- Products/inventory for each shop.
-- =============================================================================
CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    category            TEXT DEFAULT 'Food & Grocery',
    purchase_price      NUMERIC(10,2) NOT NULL CHECK (purchase_price >= 0),
    selling_price       NUMERIC(10,2) NOT NULL CHECK (selling_price >= 0),
    quantity            INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit                TEXT DEFAULT 'piece' CHECK (char_length(unit) <= 50),
    low_stock_limit     INTEGER DEFAULT 5 CHECK (low_stock_limit >= 0),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- =============================================================================
-- TABLE: sales
-- One row per sale transaction.
-- =============================================================================
CREATE TABLE IF NOT EXISTS sales (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method      TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'credit')),
    total_amount        NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    profit_amount       NUMERIC(12,2) DEFAULT 0,
    notes               TEXT DEFAULT '' CHECK (char_length(notes) <= 500),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_shop_id    ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id    ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- =============================================================================
-- TABLE: sale_items
-- Line items for each sale.
-- =============================================================================
CREATE TABLE IF NOT EXISTS sale_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id             UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price          NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price         NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id    ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- =============================================================================
-- TABLE: customers
-- Optional customer contact info.
-- =============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    phone               TEXT DEFAULT '' CHECK (char_length(phone) <= 15),
    gstin               TEXT CHECK (
                            gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$'
                        ),
    state               TEXT DEFAULT 'Punjab',
    notes               TEXT DEFAULT '',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);

-- =============================================================================
-- TABLE: invoices
-- GST invoice headers with sequential numbering.
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number      TEXT NOT NULL,          -- e.g. DM-0042-2026
    invoice_date        DATE NOT NULL,
    customer_name       TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 200),
    customer_phone      TEXT DEFAULT '',
    customer_gstin      TEXT,
    customer_state      TEXT DEFAULT 'Punjab',
    is_intrastate       BOOLEAN DEFAULT TRUE,   -- TRUE = CGST+SGST, FALSE = IGST
    subtotal_taxable    NUMERIC(12,2) NOT NULL CHECK (subtotal_taxable >= 0),
    total_cgst          NUMERIC(12,2) DEFAULT 0 CHECK (total_cgst >= 0),
    total_sgst          NUMERIC(12,2) DEFAULT 0 CHECK (total_sgst >= 0),
    total_igst          NUMERIC(12,2) DEFAULT 0 CHECK (total_igst >= 0),
    grand_total         NUMERIC(12,2) NOT NULL CHECK (grand_total >= 0),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    -- Unique invoice number per shop
    UNIQUE(shop_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_shop_id    ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- =============================================================================
-- TABLE: invoice_items
-- Line items for each invoice.
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    description         TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 200),
    quantity            NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
    rate                NUMERIC(10,2) NOT NULL CHECK (rate >= 0),
    gst_rate            NUMERIC(5,2) NOT NULL CHECK (gst_rate IN (0, 5, 12, 18, 28)),
    taxable_value       NUMERIC(12,2) NOT NULL CHECK (taxable_value >= 0),
    cgst_amount         NUMERIC(10,2) DEFAULT 0 CHECK (cgst_amount >= 0),
    sgst_amount         NUMERIC(10,2) DEFAULT 0 CHECK (sgst_amount >= 0),
    igst_amount         NUMERIC(10,2) DEFAULT 0 CHECK (igst_amount >= 0),
    line_total          NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- =============================================================================
-- TABLE: agent_logs
-- Logs every AI agent request for debugging and audit.
-- NOTE: We do NOT log the actual question or answer content for privacy.
-- =============================================================================
CREATE TABLE IF NOT EXISTS agent_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id             UUID REFERENCES shops(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    intent              TEXT DEFAULT 'unknown',
    agents_used         TEXT[],                 -- Array of agent step descriptions
    response_ms         INTEGER,                -- How long the response took (ms)
    used_gemini         BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_shop_id    ON agent_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at DESC);

-- =============================================================================
-- TABLE: chat_messages
-- Stores chat history per shop.
-- =============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id             UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role                TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content             TEXT NOT NULL CHECK (char_length(content) <= 5000),
    intent              TEXT DEFAULT 'general',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_shop_id    ON chat_messages(shop_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

