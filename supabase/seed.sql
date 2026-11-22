-- ==============================================================================
-- Seed Data for Maktabati Demo & Development
-- ==============================================================================

-- 1. Demo Tenant (مكتبة النور للطباعة والنشر - اللون الأخضر الزمردي وزخرفة دمشقية هندسية)
INSERT INTO tenants (id, name, slug, plan, contact_phone, primary_color, secondary_color, background_theme, tagline, feature_flags)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'مكتبة النور الحديثة',
    'al-noor',
    'smart_print',
    '+963911223344',
    '#16a34a',
    '#052e16',
    'damascus_geometric',
    'مركز الطباعة الذكية والخدمات الطلابية المتكاملة',
    '{
        "smart_print": true,
        "notes_catalog": true,
        "shamcash_pay": true,
        "pos": false,
        "inventory": false,
        "multi_branch": true,
        "audit_reports": true
    }'::jsonb
),
(
    'a2000000-0000-0000-0000-000000000002',
    'دار المعرفة للطباعة والقرطاسية',
    'dar-al-marefa',
    'integrated_library',
    '+963911223355',
    '#4f46e5',
    '#1e1b4b',
    'arabesque_floral',
    'دار المعرفة - طباعة رقمية وقرطاسية وكتب مدرسية',
    '{
        "smart_print": true,
        "notes_catalog": true,
        "shamcash_pay": true,
        "pos": true,
        "inventory": true,
        "multi_branch": false,
        "audit_reports": true
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 2. Demo Branches (فرع الجامعة + فرع وسط المدينة)
INSERT INTO branches (
    id, tenant_id, name, slug, address, phone, 
    default_currency, exchange_rate, sham_cash_enabled, 
    sham_cash_account_info, sham_cash_min_amount, auto_print_enabled, agent_auth_token
)
VALUES 
(
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'فرع الجامعة الرئيسي',
    'campus',
    'بوابة كلية العلوم - مقابل مجمع الكليات',
    '+963988776655',
    'SYP',
    1.00,
    true,
    'حساب شام كاش: 0988776655 - مكتبة النور',
    10000.00, -- يتطلب دفع شام كاش مسبقاً إذا تجاوز الطلب 10,000 ل.س أو كان طلباً عن بعد
    false,
    'agent-token-campus-secret-key-1234'
),
(
    'b2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'فرع ساحة الشهباء',
    'downtown',
    'شارع المكتبات - جانب البريد المركزي',
    '+963988776656',
    'SYP',
    1.00,
    true,
    'حساب شام كاش: 0988776656 - مكتبة النور وسط المدينة',
    5000.00,
    false,
    'agent-token-downtown-secret-key-5678'
) ON CONFLICT (id) DO NOTHING;

-- 3. Print Pricing Matrix for Campus Branch
INSERT INTO print_pricing (tenant_id, branch_id, paper_size, color_mode, duplex, price_per_page)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'A4', 'bw', 'simplex', 300.00),
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'A4', 'bw', 'duplex', 500.00),
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'A4', 'color', 'simplex', 1200.00),
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'A4', 'color', 'duplex', 2000.00),
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'A3', 'bw', 'simplex', 800.00),
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'A3', 'color', 'simplex', 2500.00)
ON CONFLICT DO NOTHING;

-- 4. Finishing Services
INSERT INTO print_services (tenant_id, branch_id, service_key, name_ar, price, is_available)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'staple', 'تكبيس زاوية / منتصف', 500.00, true),
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'spiral_binding', 'تسليك سلك حلزوني بلاستيكي', 4000.00, true),
    ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'thermal_lamination', 'تغليف حراري (Lamination)', 3000.00, true)
ON CONFLICT DO NOTHING;

-- 5. Sample Notes Catalog
INSERT INTO notes_catalog (
    id, tenant_id, branch_id, title, category, faculty_or_school, 
    subject, professor_or_author, description, file_path, page_count, fixed_printing_price
)
VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'ملخص الرياضيات الهندسية 1 - شامل ومحلول',
    'جامعي',
    'كلية الهندسة الميكانيكية والكهربائية',
    'رياضيات هندسية',
    'د. أحمد كنعان',
    'نوطة شاملة لكافة تمارين ومسائل الدورات السابقة مع الشرح والحلول التفصيلية للسنوات السابقة.',
    'notes-catalog-files/math1_summary.pdf',
    48,
    15000.00
),
(
    'c2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'مكثفة مادة الكيمياء العضوية - لطلاب التحضيرية',
    'سنة تحضيرية طبية',
    'الكليات الطبية',
    'كيمياء عضوية',
    'فريق التميز الأكاديمي',
    'جداول مقارنة وملخص التفاعلات والأفكار الامتحانية الأكثر تكراراً بصيغة منسقة بالألوان.',
    'notes-catalog-files/organic_chem.pdf',
    32,
    12000.00
) ON CONFLICT DO NOTHING;
