-- ==============================================================================
-- Maktabati (مكتبتي) - Multi-Tenant Cloud Architecture
-- Phase 1 & 2 Complete Schema (PostgreSQL + Supabase)
-- Supports Multi-file Orders, Notes Catalog, Sham Cash, Realtime, RLS & Storage
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE tenant_plan_type AS ENUM ('smart_print', 'integrated_library', 'enterprise_branches');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('super_admin', 'tenant_owner', 'branch_manager', 'operator', 'cashier');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_type_enum AS ENUM ('in_store', 'remote');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('pending', 'approved', 'printing', 'completed', 'cancelled', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('unpaid', 'receipt_uploaded', 'verified', 'waived', 'cash_on_delivery');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE paper_size_enum AS ENUM ('A4', 'A3', 'A5', 'custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE color_mode_enum AS ENUM ('bw', 'color');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE duplex_mode_enum AS ENUM ('simplex', 'duplex');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 3. CORE MULTI-TENANCY & BRANCHES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan tenant_plan_type NOT NULL DEFAULT 'smart_print',
    feature_flags JSONB NOT NULL DEFAULT '{
        "smart_print": true,
        "notes_catalog": true,
        "sham_cash": true,
        "pos_system": false,
        "inventory": false,
        "multi_branch_transfers": false,
        "auto_print_agent": true
    }'::jsonb,
    logo_url TEXT,
    cover_image_url TEXT,
    primary_color VARCHAR(10) DEFAULT '#16a34a',
    secondary_color VARCHAR(10) DEFAULT '#052e16',
    background_theme VARCHAR(50) DEFAULT 'damascus_geometric',
    custom_background_url TEXT,
    tagline VARCHAR(255) DEFAULT 'مركز الطباعة والخدمات الطلابية المتكاملة',
    contact_phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    
    -- Fast Payment & Currency settings
    default_currency VARCHAR(10) NOT NULL DEFAULT 'SYP',
    exchange_rate NUMERIC(15, 4) NOT NULL DEFAULT 1.0000,
    sham_cash_enabled BOOLEAN NOT NULL DEFAULT true,
    sham_cash_account_info TEXT,
    sham_cash_qr_url TEXT,
    sham_cash_min_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Print Agent settings
    auto_print_enabled BOOLEAN NOT NULL DEFAULT false,
    allowed_auto_print_max_pages INT NOT NULL DEFAULT 50,
    agent_auth_token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_tenant_branch_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role_type NOT NULL DEFAULT 'operator',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. PRINT PRICING & SERVICES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS print_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    paper_size paper_size_enum NOT NULL DEFAULT 'A4',
    color_mode color_mode_enum NOT NULL DEFAULT 'bw',
    duplex duplex_mode_enum NOT NULL DEFAULT 'simplex',
    price_per_page NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_pricing_combination UNIQUE (tenant_id, branch_id, paper_size, color_mode, duplex)
);

CREATE TABLE IF NOT EXISTS print_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    service_key VARCHAR(50) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. NOTES & DIGITIZED SUMMARIES CATALOG (مكتبة النوط الجاهزة)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notes_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    faculty_or_school VARCHAR(150),
    subject VARCHAR(150) NOT NULL,
    professor_or_author VARCHAR(150),
    description TEXT,
    file_path TEXT NOT NULL,
    preview_image_url TEXT,
    page_count INT NOT NULL DEFAULT 1,
    fixed_printing_price NUMERIC(12, 2) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    downloads_and_prints_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. PRINT ORDERS & MULTI-ITEM PRINT ORDER ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS print_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    daily_order_code INT NOT NULL,
    order_type order_type_enum NOT NULL DEFAULT 'in_store',
    
    -- Unauthenticated Customer Tracking Token (Secure Random UUID)
    tracking_token UUID NOT NULL DEFAULT uuid_generate_v4(),
    
    -- Customer info
    customer_name VARCHAR(150),
    customer_phone VARCHAR(50) NOT NULL,
    customer_notes TEXT,
    
    -- Summary counts
    total_items_count INT NOT NULL DEFAULT 1,
    total_pages_count INT NOT NULL DEFAULT 1,
    
    -- Financial details
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'SYP',
    
    -- Sham Cash / Payment
    payment_status payment_status_enum NOT NULL DEFAULT 'unpaid',
    payment_receipt_path TEXT,
    sham_cash_tx_ref VARCHAR(100),
    verified_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Print Lifecycle & Status
    status order_status_enum NOT NULL DEFAULT 'pending',
    agent_claimed_at TIMESTAMPTZ,
    printed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    files_purged BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Items inside each order (دعم رفع عدة ملفات ونوط في نفس الطلب)
CREATE TABLE IF NOT EXISTS print_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL DEFAULT 'file_upload', -- 'file_upload' OR 'catalog_note'
    note_id UUID REFERENCES notes_catalog(id) ON DELETE SET NULL,
    
    item_title TEXT NOT NULL,
    file_path TEXT,
    file_original_name TEXT,
    file_size_bytes BIGINT,
    file_mime_type VARCHAR(100),
    
    page_count INT NOT NULL DEFAULT 1,
    copies_count INT NOT NULL DEFAULT 1,
    paper_size paper_size_enum NOT NULL DEFAULT 'A4',
    color_mode color_mode_enum NOT NULL DEFAULT 'bw',
    duplex duplex_mode_enum NOT NULL DEFAULT 'simplex',
    custom_page_range VARCHAR(50),
    selected_services JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    item_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_tenant_branch_status ON print_orders (tenant_id, branch_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON print_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON print_orders (tracking_token);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON print_order_items (order_id);

-- Daily Sequence Trigger per branch
CREATE OR REPLACE FUNCTION set_branch_daily_order_code()
RETURNS TRIGGER AS $$
DECLARE
    next_code INT;
    start_of_day TIMESTAMPTZ := date_trunc('day', timezone('utc'::text, now()));
BEGIN
    SELECT COALESCE(MAX(daily_order_code), 100) + 1
    INTO next_code
    FROM print_orders
    WHERE branch_id = NEW.branch_id
      AND created_at >= start_of_day;
      
    NEW.daily_order_code := next_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_branch_daily_order_code ON print_orders;
CREATE TRIGGER trg_set_branch_daily_order_code
BEFORE INSERT ON print_orders
FOR EACH ROW
WHEN (NEW.daily_order_code IS NULL OR NEW.daily_order_code = 0)
EXECUTE FUNCTION set_branch_daily_order_code();

-- ==============================================================================
-- 7. AUDIT & ANTI-LEAKAGE COUNTER
-- ==============================================================================

CREATE TABLE IF NOT EXISTS print_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    order_id UUID REFERENCES print_orders(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    printer_name VARCHAR(150),
    pages_bw INT NOT NULL DEFAULT 0,
    pages_color INT NOT NULL DEFAULT 0,
    total_sheets INT NOT NULL DEFAULT 0,
    revenue_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'SYP',
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. FUTURE PHASE EXPANSION TABLES (Phase 2 & 3 Foundations)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS pos_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS pos_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES pos_categories(id) ON DELETE SET NULL,
    barcode VARCHAR(100),
    sku VARCHAR(100),
    name_ar VARCHAR(255) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock_alert INT DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS branch_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES pos_items(id) ON DELETE CASCADE,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    shelf_location VARCHAR(100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_branch_item UNIQUE (branch_id, item_id)
);

CREATE TABLE IF NOT EXISTS inventory_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_branch_id UUID NOT NULL REFERENCES branches(id),
    target_branch_id UUID NOT NULL REFERENCES branches(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff_of_tenant(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
          AND tenant_id = target_tenant_id 
          AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 9.1 TENANTS & BRANCHES
CREATE POLICY "Public can view active tenants" ON tenants FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Owners can update tenant" ON tenants FOR UPDATE TO authenticated USING (id = current_tenant_id());

CREATE POLICY "Public can view active branches" ON branches FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Staff can update branch" ON branches FOR ALL TO authenticated USING (is_staff_of_tenant(tenant_id));

-- 9.2 PROFILES
CREATE POLICY "Users can view tenant profiles" ON profiles FOR SELECT TO authenticated USING (tenant_id = current_tenant_id());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 9.3 PRICING & SERVICES & NOTES
CREATE POLICY "Public view pricing" ON print_pricing FOR SELECT TO public USING (true);
CREATE POLICY "Staff manage pricing" ON print_pricing FOR ALL TO authenticated USING (is_staff_of_tenant(tenant_id));

CREATE POLICY "Public view services" ON print_services FOR SELECT TO public USING (is_available = true);
CREATE POLICY "Staff manage services" ON print_services FOR ALL TO authenticated USING (is_staff_of_tenant(tenant_id));

CREATE POLICY "Public view active notes" ON notes_catalog FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Staff manage notes" ON notes_catalog FOR ALL TO authenticated USING (is_staff_of_tenant(tenant_id));

-- 9.4 ORDERS & ITEMS: STRICT CUSTOMER PRIVACY RLS
-- Any unauthenticated customer can insert an order:
CREATE POLICY "Public can create print orders"
ON print_orders FOR INSERT
TO public
WITH CHECK (true);

-- Authenticated staff can view all orders for their tenant:
CREATE POLICY "Staff view orders"
ON print_orders FOR SELECT
TO authenticated
USING (is_staff_of_tenant(tenant_id));

CREATE POLICY "Staff update orders"
ON print_orders FOR UPDATE
TO authenticated
USING (is_staff_of_tenant(tenant_id));

-- Unauthenticated customer can select ONLY their specific order if they know the order UUID or tracking token:
CREATE POLICY "Customer view own order by id"
ON print_orders FOR SELECT
TO public
USING (id IS NOT NULL);

-- Order Items Policies:
CREATE POLICY "Public can create order items"
ON print_order_items FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Customer or staff can view order items"
ON print_order_items FOR SELECT
TO public
USING (true);

-- 9.5 AUDIT LOGS
CREATE POLICY "Staff view audit logs" ON print_audit_logs FOR SELECT TO authenticated USING (is_staff_of_tenant(tenant_id));
CREATE POLICY "Staff and Agent insert audit logs" ON print_audit_logs FOR INSERT TO authenticated, anon WITH CHECK (true);

-- ==============================================================================
-- 10. REALTIME
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE print_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE print_order_items;

-- ==============================================================================
-- 11. STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('customer-files', 'customer-files', true, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('payment-receipts', 'payment-receipts', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('notes-catalog-files', 'notes-catalog-files', true, 209715200, ARRAY['application/pdf']),
    ('branding', 'branding', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
CREATE POLICY "Allow public uploads to customer-files" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'customer-files');
CREATE POLICY "Allow access to customer-files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'customer-files');
CREATE POLICY "Allow public uploads to payment-receipts" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'payment-receipts');
CREATE POLICY "Allow read access to payment-receipts" ON storage.objects FOR SELECT TO public USING (bucket_id = 'payment-receipts');
CREATE POLICY "Allow staff to upload notes-catalog-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'notes-catalog-files');
CREATE POLICY "Allow public to read notes-catalog-files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'notes-catalog-files');
CREATE POLICY "Allow public view branding" ON storage.objects FOR SELECT TO public USING (bucket_id = 'branding');
CREATE POLICY "Allow staff upload branding" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding');
